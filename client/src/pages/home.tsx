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

// Item presets/templates
const ITEM_PRESETS = [
  { description: "Labour Cost", rate: 500 },
  { description: "Material Cost", rate: 1000 },
  { description: "Equipment Rental", rate: 2000 },
  { description: "Transportation", rate: 500 },
  { description: "Supervision", rate: 1500 },
];

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
  const handleAddPreset = (preset: any) => {
    const nextNo = (Math.max(0, ...fields.map((f: any, i) => parseInt(f.itemNo) || i)) + 1).toString().padStart(3, '0');
    append({ itemNo: nextNo, description: preset.description, quantity: 0, rate: preset.rate, unit: "", previousQty: 0 });
    toast({ title: "✅ Preset Added", description: `${preset.description} added to items` });
  };

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

        <div className="grid lg:grid-cols-4 gap-4 mb-8">
          <div className="lg:col-span-1 order-last lg:order-first">
            {/* Sticky Summary Panel */}
            <div className="sticky top-4 space-y-4">
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-emerald-700">Bill Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-600">Valid Items</div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.itemCount}</div>
                  </div>
                  <Separator className="bg-emerald-200" />
                  <div>
                    <div className="text-xs text-slate-600">Subtotal</div>
                    <div className="text-lg font-semibold text-teal-600">{formatCurrency(stats.subtotal)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Premium ({stats.tenderPremiumPercent}%)</div>
                    <div className="text-lg font-semibold text-blue-600">{formatCurrency(stats.premium)}</div>
                  </div>
                  <Separator className="bg-emerald-200" />
                  <div>
                    <div className="text-xs text-slate-600">Total Amount</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{formatCurrency(stats.totalAmount)}</div>
                  </div>
                  <Separator className="bg-emerald-200" />
                  
                  {/* Form Completion */}
                  <div>
                    <div className="text-xs text-slate-600 mb-1">Form Completion</div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all" style={{width: `${formCompletion}%`}}></div>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{formCompletion}%</div>
                  </div>

                  {/* Validation Indicators */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      {isProjectValid ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                      <span className={isProjectValid ? "text-green-700" : "text-red-700"}>Project Name</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isContractorValid ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                      <span className={isContractorValid ? "text-green-700" : "text-red-700"}>Contractor Name</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasValidItems ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                      <span className={hasValidItems ? "text-green-700" : "text-red-700"}>Valid Items</span>
                    </div>
                  </div>

                  <Separator className="bg-emerald-200" />

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <Button size="sm" onClick={handleSaveDraft} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-save-draft">
                      <Save className="w-4 h-4 mr-1" /> Save Draft
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowDrafts(!showDrafts)} className="w-full border-teal-300 hover:bg-teal-50" data-testid="button-load-draft">
                      <Upload className="w-4 h-4 mr-1" /> Load Draft
                    </Button>
                  </div>

                  {/* Drafts Dropdown */}
                  {showDrafts && drafts.length > 0 && (
                    <Card className="bg-white border-teal-200">
                      <CardContent className="pt-3 space-y-2 max-h-32 overflow-y-auto">
                        {drafts.map(draft => (
                          <div key={draft.id} className="flex items-center gap-2 text-xs p-2 bg-teal-50 rounded hover:bg-teal-100 transition">
                            <div className="flex-1">
                              <div className="font-semibold text-teal-700">{draft.projectName}</div>
                              <div className="text-slate-600">{formatDraftTime(draft.savedAt)}</div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleLoadDraft(draft.id)} className="h-6 px-2 text-xs text-green-600">Load</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteDraft(draft.id)} className="h-6 px-2 text-xs text-red-600">Delete</Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Item Presets */}
              <Card className="bg-white border-cyan-200 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-cyan-700">Quick Add</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {ITEM_PRESETS.map((preset, idx) => (
                    <Button key={idx} size="sm" variant="outline" onClick={() => handleAddPreset(preset)} className="w-full text-xs justify-start border-cyan-200 hover:bg-cyan-50 text-left" data-testid={`button-preset-${idx}`}>
                      <Plus className="w-3 h-3 mr-1" /> {preset.description}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
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
                          <Button type="button" size="sm" onClick={() => append({ itemNo: "", description: "", quantity: 0, rate: 0, unit: "", previousQty: 0 })} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-add-item">
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto border border-emerald-200 rounded-lg p-3 bg-emerald-50">
                        {fields.map((field, idx) => (
                          <div key={field.id} className="bg-white p-3 rounded border border-emerald-200 space-y-2" data-testid={`item-row-${idx}`}>
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
                        ))}
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
        </div>
      </div>
    </div>
  );
}
