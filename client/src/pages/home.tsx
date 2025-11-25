import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, FileSpreadsheet, Calculator, RefreshCw, Zap, Download, File, AlertCircle, Copy, Check, X, ArrowUp, ArrowDown, Save, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { parseBillExcel } from "@/lib/excel-parser";
import { useToast } from "@/hooks/use-toast";
import { generateStyledExcel, generateHTML, generatePDF, generateZIP, generateCSV } from "@/lib/multi-format-export";
import { validateBillInput, saveBillToHistory, calculateBillStats, getErrorMessage, formatCurrency } from "@/lib/bill-validator";
import testFilesData from "@/data/test-files.json";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveDraft, getDrafts, loadDraft, deleteDraft, formatDraftTime } from "@/lib/draft-manager";

const billSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  contractorName: z.string().min(1, "Contractor name is required"),
  billDate: z.date(),
  tenderPremium: z.coerce.number().min(0).max(100),
  items: z.array(z.object({
    itemNo: z.string().min(1, "Item No required"),
    description: z.string().min(1, "Description required"),
    quantity: z.coerce.number().min(0),
    rate: z.coerce.number().min(0),
    unit: z.string().optional(),
    previousQty: z.coerce.number().optional().default(0),
  })).min(1, "At least one item is required"),
});

type BillFormValues = z.infer<typeof billSchema>;


export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"online" | "excel">("online");
  const [selectedTestFile, setSelectedTestFile] = useState<string>("");
  const [exportProgress, setExportProgress] = useState(0);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      projectName: "",
      contractorName: "",
      billDate: new Date(),
      tenderPremium: 4.0,
      items: [{ itemNo: "001", description: "Item 1", quantity: 0, rate: 0, unit: "", previousQty: 0 }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "items" });

  const items = form.watch("items");
  const tenderPremium = form.watch("tenderPremium");
  const stats = calculateBillStats(items, tenderPremium);
  const projectName = form.watch("projectName");
  const contractorName = form.watch("contractorName");

  // Load drafts on mount
  useEffect(() => {
    setDrafts(getDrafts());
  }, []);

  const doExport = async (format: 'excel' | 'html' | 'csv' | 'pdf' | 'zip') => {
    const data = form.getValues();
    const validation = validateBillInput(data.projectName, data.contractorName, data.items);
    
    if (!validation.isValid) {
      toast({ title: "❌ Validation Error", description: validation.errors[0], variant: "destructive" });
      return;
    }

    try {
      setExportProgress(50);
      const billItems = data.items.map((item: any) => ({
        ...item, id: Math.random().toString(), unit: item.unit || "", previousQty: item.previousQty || 0
      }));

      const project = {
        projectName: data.projectName, contractorName: data.contractorName,
        billDate: data.billDate, tenderPremium: data.tenderPremium
      };

      if (format === 'excel') generateStyledExcel(project, billItems);
      else if (format === 'html') generateHTML(project, billItems);
      else if (format === 'csv') generateCSV(project, billItems);
      else if (format === 'pdf') await generatePDF(project, billItems);
      else if (format === 'zip') await generateZIP(project, billItems);

      saveBillToHistory(data, billItems, stats.totalAmount);
      setExportProgress(100);
      toast({ title: "✅ Success!", description: `${format.toUpperCase()} exported successfully!` });
      setTimeout(() => setExportProgress(0), 2000);
    } catch (error) {
      toast({ title: "❌ Error", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const loadFastMode = (filename: string) => {
    const testData = (testFilesData as any)[filename];
    if (!testData) return;

    form.setValue("projectName", testData.projectDetails.projectName || "Project");
    form.setValue("contractorName", testData.projectDetails.contractorName || "Contractor");
    form.setValue("tenderPremium", testData.projectDetails.tenderPremium || 0);

    const itemsToFill = [];
    const indices = new Set<number>();
    while (indices.size < Math.min(5, testData.items.length)) {
      indices.add(Math.floor(Math.random() * testData.items.length));
    }

    const newItems = testData.items.map((item: any, idx: number) => ({
      itemNo: item.itemNo, description: item.description, quantity: indices.has(idx) ? Math.floor(Math.random() * 100) + 1 : 0,
      rate: item.rate, unit: item.unit, previousQty: 0
    }));

    form.setValue("items", newItems);
    toast({ title: "⚡ Fast Mode", description: `Loaded ${filename} with random quantities` });
  };

  // Quick actions
  const handleDuplicateItem = (index: number) => {
    const item = fields[index];
    append({ ...item, itemNo: (Math.max(0, ...fields.map((f: any) => parseInt(f.itemNo) || 0)) + 1).toString().padStart(3, '0') });
    toast({ title: "📋 Item Duplicated", description: "Item copied successfully" });
  };

  const handleClearAll = () => {
    if (confirm("Clear all items? This cannot be undone.")) {
      form.setValue("items", [{ itemNo: "001", description: "", quantity: 0, rate: 0, unit: "", previousQty: 0 }]);
      toast({ title: "🗑️ Cleared", description: "All items removed" });
    }
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    if (!data.projectName || !data.contractorName) {
      toast({ title: "❌ Error", description: "Project and contractor names required", variant: "destructive" });
      return;
    }
    const draft = saveDraft(data);
    setDrafts(getDrafts());
    toast({ title: "💾 Draft Saved", description: `${data.projectName} saved at ${format(new Date(), "HH:mm")}` });
  };

  const handleLoadDraft = (draftId: string) => {
    const draft = loadDraft(draftId);
    if (draft) {
      form.setValue("projectName", draft.projectName);
      form.setValue("contractorName", draft.contractorName);
      form.setValue("billDate", new Date(draft.billDate));
      form.setValue("tenderPremium", draft.tenderPremium);
      form.setValue("items", draft.items);
      setShowDrafts(false);
      toast({ title: "✅ Draft Loaded", description: `${draft.projectName} restored` });
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    deleteDraft(draftId);
    setDrafts(getDrafts());
    toast({ title: "🗑️ Deleted", description: "Draft removed" });
  };

  // Validation indicators
  const isProjectValid = projectName?.length > 0;
  const isContractorValid = contractorName?.length > 0;
  const hasValidItems = stats.itemCount > 0;
  const formCompletion = Math.round(((isProjectValid ? 1 : 0) + (isContractorValid ? 1 : 0) + (hasValidItems ? 1 : 0)) / 3 * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">Contractor Bill Generator</h1>
          <p className="text-slate-600">Generate professional bills in multiple formats</p>
        </div>

        <div className="space-y-6">
            <Card className="border-emerald-300 bg-white shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
                <CardTitle>Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(() => {})} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField name="projectName" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-emerald-700 font-semibold">Project Name *</FormLabel>
                          <FormControl>
                            <Input {...field} className="border-emerald-300 focus:ring-emerald-500" placeholder="Enter project name" data-testid="input-projectname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="contractorName" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-emerald-700 font-semibold">Contractor Name *</FormLabel>
                          <FormControl>
                            <Input {...field} className="border-emerald-300 focus:ring-emerald-500" placeholder="Enter contractor name" data-testid="input-contractorname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField name="billDate" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-emerald-700 font-semibold">Bill Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button className="w-full justify-start text-left bg-emerald-50 border-emerald-300 hover:bg-emerald-100" data-testid="button-billdate">
                                {format(field.value, "PPP")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                          </Popover>
                        </FormItem>
                      )} />
                      <FormField name="tenderPremium" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-emerald-700 font-semibold">Tender Premium (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" max="100" className="border-emerald-300" placeholder="4.0" data-testid="input-premium" />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>

                    <Separator className="bg-emerald-200" />

                    <div className="flex gap-2 items-center">
                      <label className="font-semibold text-emerald-700">⚡ Fast Mode:</label>
                      <Select value={selectedTestFile} onValueChange={(val) => { setSelectedTestFile(val); loadFastMode(val); }}>
                        <SelectTrigger className="w-60 border-teal-300" data-testid="select-fastmode">
                          <SelectValue placeholder="Select test file..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(testFilesData).map(file => <SelectItem key={file} value={file}>{file}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <Card className="bg-yellow-50 border-yellow-300 p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <strong>Validation:</strong> Items with quantity 0 are auto-filtered. Ensure at least one item has quantity {'>'} 0.
                        </div>
                      </div>
                    </Card>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-semibold text-emerald-700">Bill Items ({fields.length})</label>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={handleClearAll} className="text-red-600 border-red-300 hover:bg-red-50" data-testid="button-clear-all">
                            <X className="w-4 h-4 mr-1" /> Clear All
                          </Button>
                          <Button type="button" size="sm" onClick={() => append({ itemNo: "", description: "", quantity: 0, rate: 0, unit: "", previousQty: 0, level: 0 })} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-add-item">
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto border border-emerald-200 rounded-lg p-3 bg-emerald-50">
                        {fields.map((field, idx) => {
                          const itemLevel = (items[idx]?.level || 0);
                          const indent = itemLevel > 0 ? itemLevel * 4 : 0;
                          return (
                            <div key={field.id} className="bg-white p-3 rounded border border-emerald-200 space-y-2" style={{marginLeft: `${indent}px`}} data-testid={`item-row-${idx}`}>
                              <div className="grid md:grid-cols-6 gap-2 items-start">
                                <FormField name={`items.${idx}.itemNo`} control={form.control} render={({ field }) => (
                                  <FormItem><FormControl><Input {...field} placeholder="No." size={1} className="border-emerald-300" data-testid={`input-itemno-${idx}`} /></FormControl></FormItem>
                                )} />
                                <FormField name={`items.${idx}.description`} control={form.control} render={({ field }) => (
                                  <FormItem><FormControl><Input {...field} placeholder="Description" className="md:col-span-2 border-emerald-300" data-testid={`input-description-${idx}`} /></FormControl></FormItem>
                                )} />
                                <FormField name={`items.${idx}.quantity`} control={form.control} render={({ field }) => (
                                  <FormItem><FormControl><Input {...field} type="number" placeholder="Qty" className="border-emerald-300" data-testid={`input-quantity-${idx}`} /></FormControl></FormItem>
                                )} />
                                <FormField name={`items.${idx}.rate`} control={form.control} render={({ field }) => (
                                  <FormItem><FormControl><Input {...field} type="number" placeholder="Rate" className="border-emerald-300" data-testid={`input-rate-${idx}`} /></FormControl></FormItem>
                                )} />
                              </div>
                              <div className="flex gap-2 text-xs">
                                <span className={`px-2 py-1 rounded ${itemLevel === 0 ? "bg-emerald-100 text-emerald-700" : itemLevel === 1 ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                  {itemLevel === 0 ? "Main Item" : itemLevel === 1 ? "Sub-item" : "Sub-sub-item"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" size="sm" variant="ghost" onClick={() => handleDuplicateItem(idx)} className="text-blue-600 hover:bg-blue-50" data-testid={`button-duplicate-${idx}`}>
                                  <Copy className="w-4 h-4 mr-1" /> Dup
                                </Button>
                                {idx > 0 && <Button type="button" size="sm" variant="ghost" onClick={() => move(idx, idx - 1)} className="text-slate-600 hover:bg-slate-100" data-testid={`button-up-${idx}`}>
                                  <ArrowUp className="w-4 h-4" />
                                </Button>}
                                {idx < fields.length - 1 && <Button type="button" size="sm" variant="ghost" onClick={() => move(idx, idx + 1)} className="text-slate-600 hover:bg-slate-100" data-testid={`button-down-${idx}`}>
                                  <ArrowDown className="w-4 h-4" />
                                </Button>}
                                <Button type="button" size="sm" variant="ghost" onClick={() => remove(idx)} className="text-red-600 hover:bg-red-50 ml-auto" data-testid={`button-delete-${idx}`}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <Button type="button" onClick={() => doExport('excel')} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-export-excel"><FileSpreadsheet className="w-4 h-4 mr-1" /> Excel</Button>
                        <Button type="button" onClick={() => doExport('html')} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-export-html"><File className="w-4 h-4 mr-1" /> HTML</Button>
                        <Button type="button" onClick={() => doExport('csv')} className="bg-orange-600 hover:bg-orange-700 text-white" data-testid="button-export-csv"><File className="w-4 h-4 mr-1" /> CSV</Button>
                        <Button type="button" onClick={() => doExport('pdf')} className="bg-red-600 hover:bg-red-700 text-white" data-testid="button-export-pdf"><File className="w-4 h-4 mr-1" /> PDF</Button>
                        <Button type="button" onClick={() => doExport('zip')} className="bg-purple-600 hover:bg-purple-700 text-white" data-testid="button-export-zip"><Download className="w-4 h-4 mr-1" /> ZIP</Button>
                      </div>
                      {exportProgress > 0 && <div className="mt-2 w-full bg-slate-200 rounded h-2"><div className="bg-emerald-500 h-full transition-all" style={{width: `${exportProgress}%`}}></div></div>}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
        </div>
        
        {/* Credits */}
        <div className="text-center text-sm text-slate-600 py-6 border-t border-slate-200 mt-8">
          <p className="italic">Prepared on Initiative of</p>
          <p className="font-semibold text-slate-700">Mrs. Premlata Jain, AAO, PWD Udaipur</p>
        </div>
      </div>
    </div>
  );
}
