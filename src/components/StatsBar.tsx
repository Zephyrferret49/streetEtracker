import React from 'react';
import { MessageSquare, Heart, BookOpen, UserPlus, Star, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { COLUMNS } from '../constants';

interface StatsBarProps {
  dailyCounts: Record<string, number>;
  selectedDate: string;
}

const STATUS_ICONS: Record<string, any> = {
  'high-priority': { icon: AlertCircle, color: 'text-rose-600', label: 'High Priority' },
  convo: { icon: MessageSquare, color: 'text-blue-600', label: 'Total Convos' },
  pray: { icon: Heart, color: 'text-rose-600', label: 'Pray' },
  gospel: { icon: BookOpen, color: 'text-purple-600', label: 'Gospel' },
  contact: { icon: UserPlus, color: 'text-emerald-600', label: 'Contact' },
  salvation: { icon: Star, color: 'text-amber-600', label: 'Salvation' },
};

export function StatsBar({ dailyCounts, selectedDate }: StatsBarProps) {
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 mb-4">
      {COLUMNS.map((col) => {
        const config = STATUS_ICONS[col] || { icon: MessageSquare, color: 'text-gray-600', label: col };
        const Icon = config.icon;
        
        return (
          <a 
            key={col} 
            href={`#column-${col}`}
            className="bg-white/50 border border-[#141414]/5 p-2 rounded-2xl flex items-center justify-between hover:bg-white transition-colors group"
          >
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1">
                {config.label} {isToday ? 'Today' : ''}
              </p>
              <p className={cn("text-lg font-header font-medium", config.color)}>{dailyCounts[col] || 0}</p>
            </div>
            <Icon size={18} className="text-[#141414]/10 group-hover:text-[#141414]/30 transition-colors" />
          </a>
        );
      })}
    </div>
  );
}
