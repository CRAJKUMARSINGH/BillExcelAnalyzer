import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, FileSpreadsheet, Calculator, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { generateExcel } from "@/lib/excel-export";
import { parseBillExcel } from "@/lib/excel-parser";
import { useToast } from "@/hooks/use-toast";
import testFilesData from "@/data/test-files.json";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form Schema
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

const SAMPLE_DATA = {
  "projectDetails": {
    "projectName": "Sample Project",
    "contractorName": "Sample Contractor",
    "billDate": new Date("2025-11-25"),
    "tenderPremium": 5.11
  },
  "items": [
    {
      "itemNo": "2",
      "description": "Short point (up to 3 mtr.)",
      "quantity": 52.0,
      "rate": 256.0,
      "unit": "P. point",
      "previousQty": 0.0
    },
    {
      "itemNo": "3",
      "description": "Medium point (up to 6 mtr.)",
      "quantity": 48.0,
      "rate": 472.0,
      "unit": "P. point",
      "previousQty": 0.0
    },
    {
      "itemNo": "4",
      "description": "Long point  (up to 10 mtr.)",
      "quantity": 52.0,
      "rate": 662.0,
      "unit": "P. point",
      "previousQty": 0.0
    },
    {
      "itemNo": "6",
      "description": "On board",
      "quantity": 102.0,
      "rate": 136.0,
      "unit": "P. point",
      "previousQty": 0.0
    },
    {
      "itemNo": "7",
      "description": "P & F ISI marked (IS:3854) 6 amp. flush type non modular switch...",
      "quantity": 8.0,
      "rate": 23.0,
      "unit": "Each",
      "previousQty": 0.0
    }
  ]
};

export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"online" | "excel">("online");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTestFile, setSelectedTestFile] = useState<string>("");

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      projectName: "",
      contractorName: "",
      billDate: new Date(),
      tenderPremium: 4.0,
      items: [
        { itemNo: "001", description: "Earth work in excavation", quantity: 100, rate: 450, unit: "cum", previousQty: 0 },
        { itemNo: "002", description: "PCC 1:4:8", quantity: 50, rate: 3200, unit: "cum", previousQty: 0 },
        { itemNo: "003", description: "Brick work 1:6", quantity: 150, rate: 5600, unit: "cum", previousQty: 0 },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const loadTestFile = (filename: string) => {
    const data = (testFilesData as any)[filename];
    if (!data) return;

    // Load Project Details
    form.setValue("projectName", data.projectDetails.projectName);
    form.setValue("contractorName", data.projectDetails.contractorName);
    form.setValue("billDate", new Date(data.projectDetails.billDate || new Date()));
    form.setValue("tenderPremium", data.projectDetails.tenderPremium);

    // 1. Load ALL items with 0 quantity initially
    const initialItems = data.items.map((item: any) => ({
      itemNo: item.itemNo,
      description: item.description,
      quantity: 0, // Explicitly 0 as per "donot read quantity sheet"
      rate: item.rate,
      unit: item.unit,
      previousQty: 0
    }));

    // 2. Randomly select 5 items to fill with some quantity (Simulate Online Entry)
    const totalItems = initialItems.length;
    if (totalItems > 0) {
      const indicesToFill = new Set<number>();
      while (indicesToFill.size < 5 && indicesToFill.size < totalItems) {
        indicesToFill.add(Math.floor(Math.random() * totalItems));
      }

      indicesToFill.forEach(index => {
        // Generate a realistic random quantity between 1 and 100
        const randomQty = Math.floor(Math.random() * 100) + 1;
        initialItems[index].quantity = randomQty;
      });
    }

    replace(initialItems);
    setSelectedTestFile(filename);
    setActiveTab("online");
    
    toast({
        title: "Fast Mode Activated ⚡",
        description: `Loaded ${filename} with 5 auto-filled random items.`,
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
    });
  };

  const randomizeQuantities = () => {
    const currentItems = form.getValues("items");
    if (currentItems.length === 0) return;

    // Reset all to 0
    const newItems = currentItems.map(item => ({ ...item, quantity: 0 }));
    
    // Pick 5 random
    const indicesToFill = new Set<number>();
    while (indicesToFill.size < 5 && indicesToFill.size < newItems.length) {
      indicesToFill.add(Math.floor(Math.random() * newItems.length));
    }

    indicesToFill.forEach(index => {
      newItems[index].quantity = Math.floor(Math.random() * 100) + 1;
    });

    replace(newItems);
    toast({
      title: "Quantities Randomized 🎲",
      description: "5 new items have been selected and filled.",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await parseBillExcel(file);
      
      // Update form with parsed data
      form.setValue("projectName", data.projectDetails.projectName || "Imported Project");
      form.setValue("contractorName", data.projectDetails.contractorName || "Imported Contractor");
      if (data.projectDetails.billDate) {
        form.setValue("billDate", data.projectDetails.billDate);
      }
      form.setValue("tenderPremium", data.projectDetails.tenderPremium || 0);
      
      if (data.items.length > 0) {
        replace(data.items);
        toast({
          title: "File Parsed Successfully",
          description: `Loaded ${data.items.length} items from ${file.name}`,
        });
        setActiveTab("online"); // Switch to online view to show data
      } else {
         toast({
          title: "Warning",
          description: "No valid items found in the Excel file.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error(error);
      toast({
        title: "Import Failed",
        description: "Could not parse the Excel file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate totals for preview
  const items = form.watch("items");
  const tenderPremium = form.watch("tenderPremium");
  
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate)), 0);
  const premiumAmount = totalAmount * (Number(tenderPremium) / 100);
  const netPayable = totalAmount + premiumAmount;

  const onSubmit = (data: BillFormValues) => {
    try {
      generateExcel(
        {
          projectName: data.projectName,
          contractorName: data.contractorName,
          billDate: data.billDate,
          tenderPremium: data.tenderPremium,
        },
        data.items.map(item => ({
           ...item,
           id: Math.random().toString(), // temp id
           unit: item.unit || "",
           previousQty: item.previousQty || 0
        }))
      );
      
      toast({
        title: "Success!",
        description: "Bill generated and Excel file downloaded.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate Excel file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 flex-shrink-0">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-4 rounded-xl text-center text-white shadow-lg shadow-emerald-500/20 mb-6">
          <div className="text-4xl mb-2">📑</div>
          <h2 className="font-bold text-lg">BillGenerator</h2>
          <p className="text-xs opacity-90">Unified System v2.0</p>
        </div>

        <nav className="space-y-2">
          <Button 
            variant={activeTab === "online" ? "secondary" : "ghost"} 
            className={cn("w-full justify-start", activeTab === "online" && "bg-emerald-50 text-emerald-700 font-semibold")}
            onClick={() => setActiveTab("online")}
          >
            <span className="mr-2">💻</span> Online Entry
          </Button>
          <Button 
            variant={activeTab === "excel" ? "secondary" : "ghost"} 
            className={cn("w-full justify-start", activeTab === "excel" && "bg-emerald-50 text-emerald-700 font-semibold")}
            onClick={() => setActiveTab("excel")}
          >
            <span className="mr-2">📊</span> Excel Upload
          </Button>
          <Button variant="ghost" className="w-full justify-start" disabled>
            <span className="mr-2">📦</span> Batch Processing
          </Button>
          <Button variant="ghost" className="w-full justify-start" disabled>
            <span className="mr-2">📈</span> Analytics
          </Button>
        </nav>

        <div className="mt-8">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Features Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border-l-4 border-emerald-500">
              <span className="mr-2">✅</span> Online Entry
            </div>
            <div className="flex items-center text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border-l-4 border-slate-300">
              <span className="mr-2">❌</span> Batch Processing
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-8 text-white text-center shadow-xl shadow-emerald-500/20 mb-8 animate-in slide-in-from-top duration-500">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-sm">BillGenerator Unified</h1>
          <p className="text-emerald-50">✨ Professional Bill Generation System | Version 2.0.0</p>
          
          <div className="mt-6 max-w-xl mx-auto bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 shadow-inner">
             <div className="flex items-center justify-between mb-2">
                <label className="flex items-center text-sm font-bold text-white">
                    <Zap className="w-4 h-4 mr-2 text-yellow-300 fill-yellow-300" /> 
                    FAST MODE
                    <Badge variant="secondary" className="ml-2 bg-yellow-400/20 text-yellow-100 hover:bg-yellow-400/30 border-0">
                        Auto-Fill Active
                    </Badge>
                </label>
             </div>
             
             <div className="flex gap-2">
                 <div className="flex-1">
                     <Select onValueChange={loadTestFile} value={selectedTestFile}>
                        <SelectTrigger className="bg-white/95 text-slate-800 border-0 h-10 font-medium">
                          <SelectValue placeholder="Select Test File (e.g. 0511-N-extra)" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(testFilesData).map(filename => (
                            <SelectItem key={filename} value={filename}>
                              {filename}
                            </SelectItem>
                          ))}
                        </SelectContent>
                     </Select>
                 </div>
                 <Button 
                    onClick={randomizeQuantities}
                    disabled={!selectedTestFile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-10 px-4"
                    title="Randomize 5 Items"
                 >
                    <RefreshCw className="w-4 h-4" />
                 </Button>
             </div>
             <p className="text-xs text-emerald-50 mt-2 opacity-80 flex items-center">
               <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5"></span>
               Simulates online entry by auto-filling 5 random items from the selected file.
             </p>
          </div>
        </div>

        {activeTab === "online" ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto">
              
              {/* Project Details Card */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center text-slate-700">
                    <span className="mr-2">📋</span> Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contractor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contractor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Bill Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tenderPremium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tender Premium (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Work Items Card */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-slate-700">
                    <span className="mr-2">🔨</span> Work Items
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => append({ itemNo: "", description: "", quantity: 0, rate: 0, unit: "", previousQty: 0 })}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-100 group hover:border-emerald-200 transition-colors">
                        <div className="col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.itemNo`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-slate-500">No.</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-slate-500">Description</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-slate-500">Unit</FormLabel>
                                <FormControl>
                                  <Input {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-slate-500">Quantity</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.rate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-slate-500">Rate</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2 flex items-end pb-1">
                           <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {fields.length === 0 && (
                     <div className="text-center py-8 text-slate-400 italic border-2 border-dashed border-slate-200 rounded-lg">
                       No items added. Click "Add Item" to start.
                     </div>
                  )}

                  {/* Summary Section */}
                  <div className="mt-8 bg-slate-100/50 rounded-xl p-6 border border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center">
                      <Calculator className="w-4 h-4 mr-2" /> Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium uppercase">Total Amount</p>
                        <p className="text-2xl font-bold text-slate-700">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium uppercase">Premium ({tenderPremium}%)</p>
                        <p className="text-2xl font-bold text-emerald-600">+ ₹{premiumAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg shadow-sm border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-medium uppercase">Net Payable</p>
                        <p className="text-2xl font-bold text-emerald-700">₹{netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 w-full md:w-auto">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Generate Documents & Excel
                </Button>
              </div>

            </form>
          </Form>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200 transition-all hover:border-emerald-300 hover:bg-slate-50">
            {isUploading ? (
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4"></div>
                <p className="text-lg font-medium text-emerald-700">Parsing Excel File...</p>
              </div>
            ) : (
              <>
                <div className="bg-emerald-100 p-4 rounded-full mb-4">
                   <FileSpreadsheet className="w-12 h-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Upload Bill Excel</h3>
                <p className="text-sm text-slate-500 max-w-md text-center mb-6">
                  Upload your Excel file containing 'Title', 'Work Order', and 'Bill Quantity' sheets to automatically populate the form.
                </p>
                <div className="relative">
                  <Input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="excel-upload"
                  />
                  <div className="flex gap-4">
                    <Button asChild size="lg" className="cursor-pointer bg-emerald-600 hover:bg-emerald-700">
                      <label htmlFor="excel-upload">
                        Select Excel File
                      </label>
                    </Button>
                    <Button 
                        type="button"
                        variant="outline" 
                        size="lg" 
                        onClick={loadSampleData}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                        Load Test Data (0511-N-extra)
                    </Button>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400">Supports .xlsx and .xls formats</p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
