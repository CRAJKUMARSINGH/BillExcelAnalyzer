import React from "react";
import { FileSpreadsheet } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">💰 BillGenerator</h1>
              <p className="text-xs text-emerald-100">v1.0 | Professional Contractor Bill System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-emerald-50 backdrop-blur-sm">
              ✅ Production Ready
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
