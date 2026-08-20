import React from 'react';
import { X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { ExpenseAttachment } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  attachment: ExpenseAttachment | null;
  expenseName: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  attachment,
  expenseName,
  onClose,
}) => {
  if (!isOpen || !attachment) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name || `receipt_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div 
        id="receipt-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Receipt Attachment</h3>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Audit Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For transaction: <span className="font-semibold text-slate-700 dark:text-slate-200">{expenseName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-100 dark:bg-slate-950/60 flex items-center justify-center min-h-[360px] max-h-[65vh] overflow-auto">
          {attachment.type.startsWith('image/') || attachment.type.includes('svg') ? (
            <img 
              src={attachment.dataUrl} 
              alt="Receipt Document" 
              className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 bg-white"
            />
          ) : (
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <FileText className="w-16 h-16 text-blue-500 mx-auto mb-3" />
              <p className="font-bold text-slate-900 dark:text-white text-sm">{attachment.name}</p>
              <p className="text-xs text-slate-500 mt-1">{(attachment.size / 1024).toFixed(1)} KB • Document file</p>
              <button
                onClick={handleDownload}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
              >
                Download Document
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>File Name: {attachment.name}</span>
          <span>Size: {(attachment.size / 1024).toFixed(1)} KB</span>
        </div>
      </div>
    </div>
  );
};
