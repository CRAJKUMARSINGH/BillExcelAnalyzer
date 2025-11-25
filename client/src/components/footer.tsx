import React from "react";
import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8 px-4 mt-12 border-t border-slate-700">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Branding */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center font-bold text-white">
                💰
              </div>
              <h3 className="text-lg font-bold">BillGenerator</h3>
            </div>
            <p className="text-sm text-slate-300">
              Professional contractor bill generation with precision formatting and multi-format exports.
            </p>
            <p className="text-xs text-slate-400">v1.0 | Production Ready</p>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-emerald-400">Features</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>✅ 5 Export Formats (Excel, HTML, CSV, PDF, ZIP)</li>
              <li>✅ Online & Offline Modes</li>
              <li>✅ Draft Management</li>
              <li>✅ Pixel-Perfect PDF Rendering</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-emerald-400">Resources</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              <li><a href="#" className="hover:text-emerald-400 transition">📖 Documentation</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">🎯 Quick Start Guide</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">📋 Table Specifications</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">🔮 Future Enhancements</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          {/* Credits */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-emerald-400 mb-2">Credits & Attribution</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                <span className="font-semibold">Developed by:</span> BillGenerator Team
              </p>
              <p>
                <span className="font-semibold">Built with:</span> React, TypeScript, Tailwind CSS, Shadcn UI, XLSX, PDFKit
              </p>
              <p>
                <span className="font-semibold">Inspired by:</span> Contractor Bill Management Systems
              </p>
              <p className="text-slate-400 italic">
                This project maintains the highest standards of bill formatting accuracy with reference implementations from professional billing templates and tender documentation standards.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-700">
            <p className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-500" /> by the BillGenerator Team
            </p>
            <p>© 2025 BillGenerator. All rights reserved.</p>
            <div className="flex items-center gap-3 mt-3 md:mt-0">
              <a href="#" className="hover:text-emerald-400 transition"><Github className="w-4 h-4" /></a>
              <span>|</span>
              <a href="#" className="hover:text-emerald-400 transition">Privacy Policy</a>
              <span>|</span>
              <a href="#" className="hover:text-emerald-400 transition">Terms of Use</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
