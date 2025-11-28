import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Clock, FileText } from 'lucide-react';

/**
 * Enhanced Batch Progress Component
 * Inspired by ref_app2's progress tracking with better UI
 */

export interface BatchProgressItem {
  fileName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress?: number;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface BatchProgressProps {
  items: BatchProgressItem[];
  currentIndex: number;
  totalItems: number;
  overallProgress: number;
  isProcessing: boolean;
}

export function BatchProgress({
  items,
  currentIndex,
  totalItems,
  overallProgress,
  isProcessing,
}: BatchProgressProps) {
  const successCount = items.filter(item => item.status === 'success').length;
  const errorCount = items.filter(item => item.status === 'error').length;
  const pendingCount = items.filter(item => item.status === 'pending').length;
  
  return (
    <Card className="border-emerald-300 bg-white shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          Batch Processing Progress
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-emerald-700">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-emerald-600">
              {currentIndex} / {totalItems} files
            </span>
          </div>
          <Progress 
            value={overallProgress} 
            className="h-3 bg-emerald-100"
          />
          <div className="text-xs text-center text-emerald-600 font-medium">
            {Math.round(overallProgress)}% Complete
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-semibold">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-semibold">Success</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-700 font-semibold">Errors</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-700 font-semibold">Pending</span>
            </div>
            <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <div className="text-sm font-semibold text-emerald-700 mb-2">
            Processing Details
          </div>
          {items.map((item, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                item.status === 'processing'
                  ? 'bg-blue-50 border-blue-300 shadow-md'
                  : item.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : item.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Status Icon */}
                  {item.status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {item.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  {item.status === 'pending' && (
                    <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  
                  {/* File Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.fileName}
                    </div>
                    {item.error && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {item.error}
                      </div>
                    )}
                    {item.status === 'processing' && item.progress !== undefined && (
                      <div className="mt-2">
                        <Progress value={item.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status Badge */}
                <Badge
                  variant={
                    item.status === 'success'
                      ? 'default'
                      : item.status === 'error'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className={`ml-2 flex-shrink-0 ${
                    item.status === 'processing'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : item.status === 'success'
                      ? 'bg-green-500 hover:bg-green-600'
                      : ''
                  }`}
                >
                  {item.status === 'processing' && 'Processing...'}
                  {item.status === 'success' && 'Done'}
                  {item.status === 'error' && 'Failed'}
                  {item.status === 'pending' && 'Waiting'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Processing Message */}
        {isProcessing && currentIndex <= totalItems && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <div className="text-sm font-semibold text-blue-900">
                  Processing file {currentIndex} of {totalItems}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {items[currentIndex - 1]?.fileName || 'Please wait...'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {!isProcessing && currentIndex === totalItems && totalItems > 0 && (
          <div className={`border rounded-lg p-4 ${
            errorCount === 0
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {errorCount === 0 ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <div className={`text-sm font-semibold ${
                  errorCount === 0 ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {errorCount === 0
                    ? '🎉 All files processed successfully!'
                    : `⚠️ Completed with ${errorCount} error(s)`
                  }
                </div>
                <div className={`text-xs mt-1 ${
                  errorCount === 0 ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {successCount} file(s) processed successfully
                  {errorCount > 0 && `, ${errorCount} failed`}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for inline display
 */
export function BatchProgressCompact({
  currentIndex,
  totalItems,
  overallProgress,
  currentFileName,
}: {
  currentIndex: number;
  totalItems: number;
  overallProgress: number;
  currentFileName?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-emerald-700">
          Processing {currentIndex} / {totalItems}
        </span>
        <span className="font-bold text-emerald-600">
          {Math.round(overallProgress)}%
        </span>
      </div>
      <Progress value={overallProgress} className="h-2 bg-emerald-100" />
      {currentFileName && (
        <div className="text-xs text-gray-600 truncate">
          Current: {currentFileName}
        </div>
      )}
    </div>
  );
}
