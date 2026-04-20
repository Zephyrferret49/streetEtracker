import React, { useState, useEffect } from 'react';
import { Search, Save, RefreshCcw, Trash2, Plus, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { APP_NAME, APP_VERSION } from '../constants';

interface HeaderProps {
  isSyncing: boolean;
  onShowReadme: () => void;
}

export function Header({ isSyncing, onShowReadme }: HeaderProps) {
  return (
    <header className="border-b border-[#141414]/5 bg-white/40 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-header font-medium tracking-tight leading-none text-[#141414]">{APP_NAME}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-medium text-[#141414]/40 uppercase tracking-wider">v{APP_VERSION}</span>
              {isSyncing && (
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#141414]/5 rounded-full">
            <div className={cn("w-1.5 h-1.5 rounded-full", isSyncing ? "bg-emerald-500 animate-pulse" : "bg-emerald-500/30")} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">
              {isSyncing ? "Live Sync Active" : "System Ready"}
            </span>
          </div>

          <button 
            onClick={onShowReadme}
            className="w-8 h-8 rounded-full bg-[#141414]/5 flex items-center justify-center hover:bg-[#141414]/10 transition-colors"
            title="View README"
          >
            <HelpCircle className="w-4 h-4 text-[#141414]/60" />
          </button>
        </div>
      </div>
    </header>
  );
}
