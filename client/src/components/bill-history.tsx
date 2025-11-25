import React, { useState, useEffect } from "react";
import { getBillHistory, clearBillHistory, formatCurrency, BillHistoryEntry } from "@/lib/bill-validator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Clock } from "lucide-react";

export function BillHistoryPanel() {
  const [history, setHistory] = useState<BillHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getBillHistory());
  }, []);

  const handleClear = () => {
    if (confirm("Clear all bill history?")) {
      clearBillHistory();
      setHistory([]);
    }
  };

  return (
    <Card className="mt-4 bg-gradient-to-br from-slate-50 to-slate-100 border-emerald-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-lg">Bill History</CardTitle>
          </div>
          {history.length > 0 && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleClear}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No bills generated yet</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history.map((bill) => (
              <div key={bill.id} className="text-sm p-2 bg-white rounded border border-emerald-100 hover:bg-emerald-50 cursor-pointer transition">
                <div className="font-medium text-emerald-900">{bill.projectName}</div>
                <div className="text-xs text-slate-600">
                  {bill.contractorName} • {bill.billDate} • {formatCurrency(bill.totalAmount)} • {bill.itemCount} items
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
