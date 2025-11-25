import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, FileSpreadsheet, Calculator, RefreshCw, Zap, Download, File, AlertCircle } from "lucide-react";
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

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const items = form.watch("items");
  const stats = calculateBillStats(items);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">Contractor Bill Generator</h1>
          <p className="text-slate-600">Generate professional bills in multiple formats</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-emerald-200 bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-emerald-600">{stats.itemCount}</div>
              <div className="text-sm text-slate-600">Valid Items</div>
            </CardContent>
          </Card>
          <Card className="border-teal-200 bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-teal-600">{formatCurrency(stats.totalAmount)}</div>
              <div className="text-sm text-slate-600">Total Amount</div>
            </CardContent>
          </Card>
          <Card className="border-cyan-200 bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="text-sm font-semibold text-cyan-600">Export Formats</div>
              <div className="text-sm text-slate-600">5 formats available</div>
            </CardContent>
          </Card>
        </div>

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
                      <FormLabel className="text-emerald-700 font-semibold">Project Name</FormLabel>
                      <FormControl><Input {...field} className="border-emerald-300 focus:ring-emerald-500" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="contractorName" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-700 font-semibold">Contractor Name</FormLabel>
                      <FormControl><Input {...field} className="border-emerald-300 focus:ring-emerald-500" /></FormControl>
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
                          <Button className="w-full justify-start text-left bg-emerald-50 border-emerald-300 hover:bg-emerald-100">{format(field.value, "PPP")}</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                      </Popover>
                    </FormItem>
                  )} />
                  <FormField name="tenderPremium" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-700 font-semibold">Tender Premium (%)</FormLabel>
                      <FormControl><Input {...field} type="number" min="0" max="100" className="border-emerald-300" /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <Separator className="bg-emerald-200" />

                <div className="flex gap-2 items-center">
                  <label className="font-semibold text-emerald-700">⚡ Fast Mode:</label>
                  <Select value={selectedTestFile} onValueChange={(val) => { setSelectedTestFile(val); loadFastMode(val); }}>
                    <SelectTrigger className="w-60 border-teal-300"><SelectValue placeholder="Select test file..." /></SelectTrigger>
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
                    <label className="font-semibold text-emerald-700">Bill Items</label>
                    <Button type="button" size="sm" onClick={() => append({ itemNo: "", description: "", quantity: 0, rate: 0, unit: "", previousQty: 0 })} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-1" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto border border-emerald-200 rounded-lg p-3 bg-emerald-50">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="bg-white p-3 rounded border border-emerald-200 grid md:grid-cols-6 gap-2">
                        <FormField name={`items.${idx}.itemNo`} control={form.control} render={({ field }) => (
                          <FormControl><Input {...field} placeholder="No." size={1} className="border-emerald-300" /></FormControl>
                        )} />
                        <FormField name={`items.${idx}.description`} control={form.control} render={({ field }) => (
                          <FormControl><Input {...field} placeholder="Description" className="md:col-span-2 border-emerald-300" /></FormControl>
                        )} />
                        <FormField name={`items.${idx}.quantity`} control={form.control} render={({ field }) => (
                          <FormControl><Input {...field} type="number" placeholder="Qty" className="border-emerald-300" /></FormControl>
                        )} />
                        <FormField name={`items.${idx}.rate`} control={form.control} render={({ field }) => (
                          <FormControl><Input {...field} type="number" placeholder="Rate" className="border-emerald-300" /></FormControl>
                        )} />
                        <Button type="button" size="sm" variant="ghost" onClick={() => remove(idx)} className="text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <Button type="button" onClick={() => doExport('excel')} className="bg-emerald-600 hover:bg-emerald-700 text-white"><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel</Button>
                    <Button type="button" onClick={() => doExport('html')} className="bg-blue-600 hover:bg-blue-700 text-white"><File className="w-4 h-4 mr-2" /> HTML</Button>
                    <Button type="button" onClick={() => doExport('csv')} className="bg-orange-600 hover:bg-orange-700 text-white"><File className="w-4 h-4 mr-2" /> CSV</Button>
                    <Button type="button" onClick={() => doExport('pdf')} className="bg-red-600 hover:bg-red-700 text-white"><File className="w-4 h-4 mr-2" /> PDF</Button>
                    <Button type="button" onClick={() => doExport('zip')} className="bg-purple-600 hover:bg-purple-700 text-white"><Download className="w-4 h-4 mr-2" /> ZIP</Button>
                  </div>
                  {exportProgress > 0 && <div className="mt-2 w-full bg-slate-200 rounded h-2"><div className="bg-emerald-500 h-full transition-all" style={{width: `${exportProgress}%`}}></div></div>}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
