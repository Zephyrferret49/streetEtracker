import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#E4E3E0] rounded-3xl shadow-2xl overflow-hidden border border-[#141414]/10"
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-[#141414] text-[#E4E3E0]'}`}>
                  <AlertTriangle size={24} />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#141414]/5 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-header font-medium tracking-tight text-[#141414] mb-2">
                {title}
              </h3>
              <p className="text-[#141414]/60 leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest border border-[#141414]/10 hover:bg-[#141414]/5 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest text-[#E4E3E0] transition-all hover:opacity-90 ${isDestructive ? 'bg-red-600' : 'bg-[#141414]'}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
