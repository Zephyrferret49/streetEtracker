import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Contact } from "../types";
import { COLUMNS } from "../constants";

import { STAGES } from "../constants";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContact: Contact | null;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving?: boolean;
}

export function ContactModal({
  isOpen,
  onClose,
  editingContact,
  onSave,
  isSaving,
}: ContactModalProps) {
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
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <h2 className="text-2xl font-header font-semibold mb-6">
                {editingContact ? "Edit Contact" : "New Contact Entry"}
              </h2>
              <form onSubmit={onSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                      Full Name
                    </label>
                    <input
                      name="name"
                      defaultValue={editingContact?.name}
                      required
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 ring-[#141414]/10 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                      Gender
                    </label>
                    <input
                      name="gender"
                      defaultValue={editingContact?.gender}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 ring-[#141414]/10 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                      Team Member
                    </label>
                    <select
                      name="teamMember"
                      defaultValue={editingContact?.teamMember || "Kenny"}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 ring-[#141414]/10 outline-none"
                    >
                      <option value="Kenny">Kenny</option>
                      <option value="Jermaine">Jermaine</option>
                      <option value="Caleb">Caleb</option>
                      <option value="Jessica">Jessica</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                      Age
                    </label>
                    <input
                      name="age"
                      defaultValue={editingContact?.age}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 ring-[#141414]/10 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                      Occupation
                    </label>
                    <input
                      name="occupation"
                      defaultValue={editingContact?.occupation}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 ring-[#141414]/10 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                      Social Media / Contact
                    </label>
                    <input
                      name="socialMedia"
                      defaultValue={editingContact?.socialMedia}
                      placeholder="@handle or phone"
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 ring-[#141414]/10 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={editingContact?.status || "convo"}
                      className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 ring-[#141414]/10 outline-none capitalize"
                    >
                      {STAGES.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 py-2 pt-6">
                    <input
                      type="checkbox"
                      id="highPriority"
                      name="highPriority"
                      defaultChecked={editingContact?.highPriority}
                      className="w-4 h-4 rounded border-[#141414]/10 text-[#141414] focus:ring-[#141414]/10"
                    />
                    <label
                      htmlFor="highPriority"
                      className="text-xs font-bold uppercase tracking-wider opacity-70 cursor-pointer"
                    >
                      High Priority
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    defaultValue={editingContact?.remarks}
                    rows={3}
                    className="w-full bg-[#F5F5F0] border-none rounded-xl px-4 py-3 focus:ring-2 ring-[#141414]/10 outline-none resize-none"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-xl border border-[#141414]/10 font-medium hover:bg-[#F5F5F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-[#141414] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingContact
                        ? "Update"
                        : "Save Contact"}
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
