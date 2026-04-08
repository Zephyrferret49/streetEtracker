import React from 'react';
import { cn } from '../lib/utils';
import { Contact } from '../types';
import { ContactCard } from './ContactCard';

interface ColumnProps {
  key?: React.Key;
  id: string;
  title: string;
  contacts: Contact[];
  onEdit: (c: Contact) => void;
  onDelete: (id: string) => Promise<void> | void;
  newContactIds: Set<string>;
}

export function Column({ id, title, contacts, onEdit, onDelete, newContactIds }: ColumnProps) {
  return (
    <div id={`column-${id}`} className="flex flex-col gap-2 scroll-mt-24">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <h3 className="font-header font-semibold text-base capitalize">{title}</h3>
          <span className="text-[9px] font-bold text-[#141414]/30 border border-[#141414]/10 px-1.5 py-0.5 rounded-full">
            {contacts.length}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "flex-1 min-h-[400px] bg-[#141414]/[0.01] rounded-2xl p-0.5 space-y-0.5 border border-[#141414]/5 transition-colors",
          id === 'deprecated' && "bg-red-50/30 border-red-100"
        )}
      >
        {contacts.map((contact) => (
          <ContactCard 
            key={contact.id} 
            contact={contact} 
            onEdit={onEdit} 
            onDelete={onDelete}
            isNew={newContactIds.has(contact.id)}
          />
        ))}
      </div>
    </div>
  );
}
