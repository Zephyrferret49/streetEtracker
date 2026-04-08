import React from 'react';
import { Search, Save, RefreshCcw, Trash2, Plus, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface ToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  teamFilter: string;
  setTeamFilter: (team: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isSyncing: boolean;
  hasPendingUpdate: boolean;
  fetchContacts: () => void;
  lastSynced: Date | null;
  onClearClick: () => void;
  isClearing: boolean;
  deprecatedCount: number;
  onAddClick: () => void;
}

export function Toolbar({
  searchQuery,
  setSearchQuery,
  teamFilter,
  setTeamFilter,
  selectedDate,
  setSelectedDate,
  isSyncing,
  hasPendingUpdate,
  fetchContacts,
  lastSynced,
  onClearClick,
  isClearing,
  deprecatedCount,
  onAddClick,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-[#141414]/5">
      {/* Row 1: Search Bar & Date Filter */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30 group-focus-within:text-[#141414] transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#141414]/10 rounded-xl pl-11 pr-6 py-3 text-sm focus:border-[#141414] focus:ring-0 transition-all outline-none shadow-sm"
          />
        </div>

        <div className="relative group sm:w-64 flex gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30 group-focus-within:text-[#141414] transition-colors pointer-events-none" size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white border border-[#141414]/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-[#141414] focus:ring-0 transition-all outline-none shadow-sm cursor-pointer"
            />
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="px-3 bg-white border border-[#141414]/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all"
            >
              All
            </button>
          )}
        </div>

        {/* Team Filter */}
        <div className="relative group sm:w-48">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30 group-focus-within:text-[#141414] transition-colors pointer-events-none" size={16} />
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full bg-white border border-[#141414]/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-[#141414] focus:ring-0 transition-all outline-none shadow-sm cursor-pointer appearance-none"
          >
            <option value="">All Team</option>
            <option value="Kenny">Kenny</option>
            <option value="Jermaine">Jermaine</option>
            <option value="Caleb">Caleb</option>
            <option value="Jessica">Jessica</option>
          </select>
        </div>
      </div>

      {/* Row 2: Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <div className="flex flex-col items-start">
            <button
              onClick={fetchContacts}
              disabled={isSyncing}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border w-full sm:w-auto",
                hasPendingUpdate && !isSyncing
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414]/10 hover:bg-[#141414]/5"
              )}
            >
              <RefreshCcw size={14} className={cn(isSyncing && "animate-spin")} />
              {isSyncing ? "Syncing" : hasPendingUpdate ? "New Data" : "Sync"}
            </button>
            {lastSynced && (
              <span className="text-[8px] text-[#141414]/40 uppercase tracking-tighter mt-1 font-bold ml-1">
                Last Sync: {lastSynced.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <button
            onClick={onClearClick}
            disabled={isClearing || deprecatedCount === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-red-100 text-red-600 bg-white hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed flex-1 sm:flex-none"
          >
            <Trash2 size={14} />
            {isClearing ? "Clearing" : "Clear Deprecated"}
          </button>
        </div>

        <button
          onClick={onAddClick}
          className="h-10 px-6 bg-[#141414] text-[#E4E3E0] rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-black/10 flex-1 sm:flex-none"
        >
          <Plus size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest sm:hidden">Add Contact</span>
        </button>
      </div>
    </div>
  );
}
