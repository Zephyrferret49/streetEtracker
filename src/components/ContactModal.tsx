import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact } from '../types';
import { COLUMNS } from '../constants';

import { STAGES } from '../constants';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContact: Contact | null;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving?: boolean;
}

export function ContactModal({ isOpen, onClose, editingContact, onSave, isSaving }: ContactModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
          >
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-header font-semibold mb-4">
                {editingContact ? 'Edit Contact' : 'New Contact Entry'}
              </h2>
              <form onSubmit={onSave} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">Full Name</label>
                    <input
                      name="name"
                      defaultValue={editingContact?.name}
                      required
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#141414]/10 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">Gender</label>
                    <select
                      name="gender"
                      defaultValue={editingContact?.gender || ""}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#141414]/10 outline-none"
                    >
                      <option value="" disabled>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">Team Member</label>
                    <select
                      name="teamMember"
                      defaultValue={editingContact?.teamMember || 'Kenny'}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#141414]/10 outline-none"
                    >
                      <option value="Kenny">Kenny</option>
                      <option value="Jermaine">Jermaine</option>
                      <option value="Caleb">Caleb</option>
                      <option value="Jessica">Jessica</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">Age</label>
                    <input
                      name="age"
                      defaultValue={editingContact?.age}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#141414]/10 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">Occupation</label>
                    <input
                      name="occupation"
                      defaultValue={editingContact?.occupation}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#141414]/10 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50"> Contact</label>
                    <input
                      name="socialMedia"
                      defaultValue={editingContact?.socialMedia}
                      placeholder="@handle or phone"
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#141414]/10 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">Status (Select all that apply)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {STAGES.map(col => (
                      <label key={col} className="flex items-center gap-1.5 p-1.5 bg-[#F5F5F0] rounded-lg cursor-pointer hover:bg-[#F5F5F0]/80 transition-colors">
                        <input
                          type="checkbox"
                          name="status"
                          value={col}
                          defaultChecked={editingContact?.status?.includes(col)}
                          className="w-3.5 h-3.5 rounded border-[#141414]/10 text-[#141414] focus:ring-[#141414]/10"
                        />
                        <span className="text-[10px] capitalize font-medium">{col.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">Remarks</label>
                  <textarea
                    name="remarks"
                    defaultValue={editingContact?.remarks}
                    rows={2}
                    className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#141414]/10 outline-none resize-none"
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-2.5 rounded-xl border border-[#141414]/10 text-sm font-medium hover:bg-[#F5F5F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-[#141414] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : (editingContact ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
