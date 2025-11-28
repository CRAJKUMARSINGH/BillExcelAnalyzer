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
import { generateStyledExcel, generateHTML, generatePDF, generateZIP, generateCSV, generateDeviationStatementExcel, generateDeviationStatementHTML, generateNoteSheetHTML, generateCertificateIIHTML, generateCertificateIIIHTML, generateExtraItemsHTML } from "@/lib/multi-format-export";
import { exportToDocx } from "@/lib/docx-export";
import { generatePDFWithJsPDF, generateDeviationPDFWithJsPDF } from "@/lib/pdf-jspdf";
import { generatePDFWithPuppeteer } from "@/lib/pdf-puppeteer";
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
    level: z.coerce.number().optional().default(0),
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
  const [fileMode, setFileMode] = useState<"offline" | "online">("offline");

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseBillExcel(file);
      
      // Auto-populate project and contractor names from title sheet
      form.setValue("projectName", parsed.projectDetails.projectName || "");
      form.setValue("contractorName", parsed.projectDetails.contractorName || "");
      form.setValue("billDate", parsed.projectDetails.billDate || new Date());
      form.setValue("tenderPremium", parsed.projectDetails.tenderPremium || 4.0);
      
      // Populate items based on file mode
      if (parsed.items && parsed.items.length > 0) {
        if (fileMode === "offline") {
          // OFFLINE MODE: Use file quantities as-is (final bill)
          form.setValue("items", parsed.items.map((item: any) => ({
            itemNo: item.itemNo || "",
            description: item.description || "",
            quantity: item.quantity || 0,
            rate: item.rate || 0,
            unit: item.unit || "",
            previousQty: item.previousQty || 0,
            level: item.level || 0,
          })));
          toast({ 
            title: "✅ OFFLINE MODE", 
            description: `Loaded ${parsed.items.length} items with quantities from file` 
          });
        } else {
          // ONLINE MODE: Use file as Work Order template (WO Qty + Rate), clear quantity for user input
          form.setValue("items", parsed.items.map((item: any) => ({
            itemNo: item.itemNo || "",
            description: item.description || "",
            quantity: 0,  // User enters quantity online
            rate: item.rate || 0,  // Rate from file
            unit: item.unit || "",
            previousQty: item.quantity || 0,  // File qty becomes WO baseline (previousQty)
            level: item.level || 0,
          })));
          toast({ 
            title: "✅ ONLINE MODE", 
            description: `Work Order loaded - enter quantities online` 
          });
        }
      }
    } catch (error) {
      toast({ 
        title: "❌ Error", 
        description: `Failed to parse file: ${getErrorMessage(error)}`, 
        variant: "destructive" 
      });
    }
  };

  const doExport = async (format: string) => {
    if (exportProgress > 0) return;
    setExportProgress(10);
    
    try {
      const data = form.getValues();
      const billItems = data.items.map((item: any) => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
        previousQty: parseFloat(item.previousQty) || 0
      }));
      
      const project = {
        projectName: data.projectName, contractorName: data.contractorName,
        billDate: data.billDate, tenderPremium: data.tenderPremium
      };

      if (format === 'excel') generateStyledExcel(project, billItems);
      else if (format === 'html') generateHTML(project, billItems);
      else if (format === 'csv') generateCSV(project, billItems);
      else if (format === 'pdf') await generatePDF(project, billItems);
      else if (format === 'pdf-pro') await generatePDFWithJsPDF(project, billItems);
      else if (format === 'pdf-ultra') await generatePDFWithPuppeteer(project, billItems);
      else if (format === 'docx') await exportToDocx(project, billItems);
      else if (format === 'zip') await generateZIP(project, billItems);
      else if (format === 'deviation') {
        // For deviation statements, we now support both Excel and HTML formats
        generateDeviationStatementExcel(project, billItems);
        // Also generate HTML version for better PDF printing
        generateDeviationStatementHTML(project, billItems);
        // Also generate professional PDF
        await generateDeviationPDFWithJsPDF(project, billItems);
      }
      else if (format === 'note-sheet') generateNoteSheetHTML(project, billItems);
      else if (format === 'certificate-ii') generateCertificateIIHTML(project);
      else if (format === 'certificate-iii') generateCertificateIIIHTML(project, billItems);
      else if (format === 'extra-items') generateExtraItemsHTML(project);

      saveBillToHistory(data, billItems, stats.totalAmount);
      setExportProgress(100);
      toast({ title: "✅ Success!", description: `${format === 'deviation' ? 'Deviation Statement' : format === 'note-sheet' ? 'Note Sheet' : format === 'certificate-ii' ? 'Certificate II' : format === 'certificate-iii' ? 'Certificate III' : format === 'extra-items' ? 'Extra Items' : format === 'docx' ? 'Word Document' : format === 'pdf-pro' ? 'Professional PDF' : format === 'pdf-ultra' ? 'Ultra High-Quality PDF' : format.toUpperCase()} exported successfully!` });
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
      form.setValue("items", [{ itemNo: "001", description: "", quantity: 0, rate: 0, unit: "", previousQty: 0, level: 0 }]);
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

  const triggerAnimation = () => {
    setIsAnimating(true);
    setAnimationKey(prev => prev + 1);
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Beautiful Animated Header */}
        <div className={`mb-8 transition-all duration-700 ${isAnimating ? 'animate-pulse' : ''}`} key={animationKey}>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 shadow-xl mb-4 transform transition-transform hover:scale-[1.02]">
            <h1 className="text-4xl font-bold text-white mb-2 text-center">Contractor Bill Generator</h1>
            <p className="text-emerald-100 text-center">✨ Professional Bill Generation System ✨</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">📊 Excel Processing</Badge>
            <Badge variant="secondary" className="bg-teal-100 text-teal-800">📈 Deviation Analysis</Badge>
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">📄 Multi-Format Export</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">🔒 Statutory Compliance</Badge>
          </div>
        </div>

        <div className="space-y-6">
            <Card className="border-emerald-300 bg-white shadow-xl rounded-2xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-2xl">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Calculator className="w-6 h-6" />
                  Bill Details
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  Enter project details and itemized bill information
                </CardDescription>
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

                    <div className="space-y-4 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <div className="flex gap-3 items-end flex-wrap">
                        <div className="flex gap-3 items-center">
                          <label className="font-semibold text-emerald-700 flex items-center gap-2">
                            <File className="w-5 h-5" />
                            File Mode:
                          </label>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              onClick={() => { setFileMode("offline"); triggerAnimation(); }} 
                              className={`${fileMode === "offline" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-200 text-slate-700"} transition-all duration-200 hover:scale-105`}
                              data-testid="button-offline-mode"
                            >
                              Offline (Use File Qty)
                            </Button>
                            <Button 
                              type="button" 
                              onClick={() => { setFileMode("online"); triggerAnimation(); }} 
                              className={`${fileMode === "online" ? "bg-blue-600 text-white shadow-md" : "bg-slate-200 text-slate-700"} transition-all duration-200 hover:scale-105`}
                              data-testid="button-online-mode"
                            >
                              Online (WO Template)
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 items-end">
                        <label className="font-semibold text-emerald-700">📤 Upload Excel File:</label>
                        <input 
                          type="file" 
                          accept=".xlsx,.xls" 
                          onChange={handleFileUpload} 
                          className="block text-sm text-emerald-700 file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:bg-emerald-500 file:text-white hover:file:bg-emerald-600" 
                          data-testid="input-file-upload"
                        />
                        <span className="text-xs text-slate-600">{fileMode === "offline" ? "Uses file quantities as final bill" : "File quantities become Work Order baseline"}</span>
                      </div>

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
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-emerald-600" />
                          <label className="font-semibold text-emerald-700">Bill Items ({fields.length})</label>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline" 
                            onClick={handleClearAll} 
                            className="text-red-600 border-red-300 hover:bg-red-50 transition-all duration-200 hover:scale-105"
                            data-testid="button-clear-all"
                          >
                            <X className="w-4 h-4 mr-1" /> Clear All
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={() => { append({ itemNo: "", description: "", quantity: 0, rate: 0, unit: "", previousQty: 0, level: 0 }); triggerAnimation(); }} 
                            className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 hover:scale-105"
                            data-testid="button-add-item"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto border border-emerald-200 rounded-lg p-3 bg-emerald-50">
                        {fields.map((field, idx) => {
                          const itemLevel = (items[idx]?.level || 0);
                          const indent = itemLevel > 0 ? itemLevel * 4 : 0;
                          return (
                            <div 
                              key={field.id} 
                              className="bg-white p-4 rounded-xl border border-emerald-200 space-y-3 shadow-sm hover:shadow-md transition-all duration-200"
                              style={{marginLeft: `${indent}px`}} 
                              data-testid={`item-row-${idx}`}
                            >
                              <div className="grid md:grid-cols-6 gap-3 items-start">
                                <FormField name={`items.${idx}.itemNo`} control={form.control} render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        placeholder="No." 
                                        size={1} 
                                        className="border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg" 
                                        data-testid={`input-itemno-${idx}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`items.${idx}.description`} control={form.control} render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        placeholder="Description" 
                                        className="border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg" 
                                        data-testid={`input-description-${idx}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`items.${idx}.quantity`} control={form.control} render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        type="number" 
                                        placeholder="Qty" 
                                        className="border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg" 
                                        data-testid={`input-quantity-${idx}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )} />
                                <FormField name={`items.${idx}.rate`} control={form.control} render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        type="number" 
                                        placeholder="Rate" 
                                        className="border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg" 
                                        data-testid={`input-rate-${idx}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )} />
                              </div>
                              <div className="flex gap-2 text-xs">
                                <span className={`px-3 py-1 rounded-full font-medium ${itemLevel === 0 ? "bg-emerald-100 text-emerald-700" : itemLevel === 1 ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                  {itemLevel === 0 ? "Main Item" : itemLevel === 1 ? "Sub-item" : "Sub-sub-item"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleDuplicateItem(idx)} 
                                  className="text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                                  data-testid={`button-duplicate-${idx}`}
                                >
                                  <Copy className="w-4 h-4 mr-1" /> Dup
                                </Button>
                                {idx > 0 && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => move(idx, idx - 1)} 
                                    className="text-slate-600 hover:bg-slate-100 transition-all duration-200 hover:scale-105"
                                    data-testid={`button-up-${idx}`}
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </Button>
                                )}
                                {idx < fields.length - 1 && (
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => move(idx, idx + 1)} 
                                    className="text-slate-600 hover:bg-slate-100 transition-all duration-200 hover:scale-105"
                                    data-testid={`button-down-${idx}`}
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => remove(idx)} 
                                  className="text-red-600 hover:bg-red-50 ml-auto transition-all duration-200 hover:scale-105"
                                  data-testid={`button-delete-${idx}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Download className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-emerald-700">Export Formats</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <Button 
                          type="button" 
                          onClick={() => { doExport('excel'); triggerAnimation(); }} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-excel"
                        >
                          <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('html'); triggerAnimation(); }} 
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-html"
                        >
                          <File className="w-4 h-4 mr-1" /> HTML
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('csv'); triggerAnimation(); }} 
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-csv"
                        >
                          <File className="w-4 h-4 mr-1" /> CSV
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('pdf'); triggerAnimation(); }} 
                          className="bg-red-600 hover:bg-red-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-pdf"
                        >
                          <File className="w-4 h-4 mr-1" /> PDF
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('pdf-pro'); triggerAnimation(); }} 
                          className="bg-red-800 hover:bg-red-900 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-pdf-pro"
                        >
                          <File className="w-4 h-4 mr-1" /> PDF Pro
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('pdf-ultra'); triggerAnimation(); }} 
                          className="bg-red-950 hover:bg-black text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-pdf-ultra"
                        >
                          <File className="w-4 h-4 mr-1" /> PDF Ultra
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('docx'); triggerAnimation(); }} 
                          className="bg-blue-700 hover:bg-blue-800 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-docx"
                        >
                          <File className="w-4 h-4 mr-1" /> Word
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('zip'); triggerAnimation(); }} 
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-zip"
                        >
                          <Download className="w-4 h-4 mr-1" /> ZIP
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('deviation'); triggerAnimation(); }} 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-deviation"
                        >
                          <FileSpreadsheet className="w-4 h-4 mr-1" /> Deviation
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                        <Button 
                          type="button" 
                          onClick={() => { doExport('note-sheet'); triggerAnimation(); }} 
                          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-note-sheet"
                        >
                          <File className="w-4 h-4 mr-1" /> Note Sheet
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('certificate-ii'); triggerAnimation(); }} 
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-certificate-ii"
                        >
                          <File className="w-4 h-4 mr-1" /> Cert II
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('certificate-iii'); triggerAnimation(); }} 
                          className="bg-green-600 hover:bg-green-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-certificate-iii"
                        >
                          <File className="w-4 h-4 mr-1" /> Cert III
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => { doExport('extra-items'); triggerAnimation(); }} 
                          className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                          data-testid="button-export-extra-items"
                        >
                          <File className="w-4 h-4 mr-1" /> Extra Items
                        </Button>
                      </div>
                      {exportProgress > 0 && (
                        <div className="mt-4 w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 rounded-full"
                            style={{width: `${exportProgress}%`}}
                          ></div>
                        </div>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
        </div>
        
        {/* Enhanced Credits with Professional Styling */}
        <div className="text-center py-8 border-t border-emerald-200 mt-12 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl mx-4">
          <div className="max-w-2xl mx-auto px-4">
            <p className="text-emerald-700 font-medium mb-2">Prepared on Initiative of</p>
            <div className="bg-white rounded-xl p-4 shadow-md inline-block">
              <p className="font-bold text-emerald-800 text-lg">Mrs. Premlata Jain, AAO</p>
              <p className="text-emerald-600">PWD Udaipur</p>
            </div>
            <div className="mt-4 flex justify-center gap-4 text-xs text-emerald-600">
              <span className="bg-emerald-100 px-3 py-1 rounded-full">🏛️ Government of Rajasthan</span>
              <span className="bg-teal-100 px-3 py-1 rounded-full">📋 Public Works Department</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
