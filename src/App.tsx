import React, { useState, useMemo, useCallback, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { COLUMNS, DEPRECATED_STATUS } from "./constants";
import { Contact } from "./types";
import { Header } from "./components/Header";
import { Toolbar } from "./components/Toolbar";
import { StatsBar } from "./components/StatsBar";
import { Column } from "./components/Column";
import { ContactModal } from "./components/ContactModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { useContacts } from "./hooks/useContacts";
import {
  getLocalDateString,
  isSameDay,
  filterContactsByColumn,
  getHighestStatus,
} from "./lib/utils";

export default function App() {
  const {
    contacts,
    isSyncing,
    isClearing,
    lastSynced,
    hasPendingUpdate,
    newContactIds,
    fetchContacts,
    clearDeprecated,
    deleteContact,
  } = useContacts();

  const [isAdding, setIsAdding] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [selectedDate, setSelectedDate] =
    useState<string>(getLocalDateString());
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReadme, setShowReadme] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string>("");

  useEffect(() => {
    if (showReadme && !readmeContent) {
      fetch("/api/readme")
        .then((res) => res.json())
        .then((data) => setReadmeContent(data.content || "No content found."))
        .catch((err) => {
          console.error("Failed to load README.TXT:", err);
          setReadmeContent("Failed to load README.TXT");
        });
    }
  }, [showReadme, readmeContent]);

  const dailyCounts = useMemo(() => {
    if (!selectedDate)
      return COLUMNS.reduce(
        (acc, col) => {
          acc[col] = 0;
          return acc;
        },
        {} as Record<string, number>,
      );

    return COLUMNS.reduce(
      (acc, col) => {
        const colId = col.toLowerCase();

        acc[col] = contacts.filter((c) => {
          if (!isSameDay(c.updatedAt, selectedDate)) return false;

          const statuses = Array.isArray(c.status) ? c.status : [c.status];
          const isDeprecated = statuses.some(
            (s) => s.toLowerCase().trim() === "deprecated",
          );

          // Special logic for 'convo' stat: sum total of all entries for the day (excluding deprecated)
          if (colId === "convo") {
            return !isDeprecated;
          }

          // For all other stages (pray, gospel, contact, salvation),
          // count them if they are the highest status and not deprecated
          const highestStatus = getHighestStatus(c.status).toLowerCase().trim();
          return highestStatus === colId && !isDeprecated;
        }).length;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [contacts, selectedDate]);

  const saveContact = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isSaving) return;

      setIsSaving(true);
      try {
        const formData = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(formData.entries());

        // Collect all checked statuses
        const statuses = formData.getAll("status") as string[];
        data.status = statuses.length > 0 ? statuses : ["convo"];

        // Derive highPriority from status array
        data.highPriority = data.status.includes("high-priority");

        const method = editingContact ? "PUT" : "POST";
        const url = editingContact
          ? `/api/contacts/${editingContact.id}`
          : "/api/contacts";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          fetchContacts();
          setIsAdding(false);
          setEditingContact(null);
        }
      } catch (error) {
        console.error("Failed to save contact:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, editingContact, fetchContacts],
  );

  const filteredContacts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return contacts.filter((c) => {
      // Date filter logic
      if (selectedDate && !isSameDay(c.updatedAt, selectedDate)) {
        return false;
      }

      // Team filter logic
      if (
        teamFilter &&
        c.teamMember?.toLowerCase() !== teamFilter.toLowerCase()
      ) {
        return false;
      }

      if (!query) return true;

      const date = new Date(c.updatedAt);
      const formattedDate = date.toLocaleDateString().toLowerCase();
      const formattedTime = date
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        .toLowerCase();
      const monthName = date
        .toLocaleString("default", { month: "long" })
        .toLowerCase();
      const monthShort = date
        .toLocaleString("default", { month: "short" })
        .toLowerCase();

      return (
        c.name.toLowerCase().includes(query) ||
        c.occupation.toLowerCase().includes(query) ||
        c.remarks.toLowerCase().includes(query) ||
        c.status.some((s) => s.toLowerCase().includes(query)) ||
        c.updatedAt.toLowerCase().includes(query) ||
        formattedDate.includes(query) ||
        formattedTime.includes(query) ||
        monthName.includes(query) ||
        monthShort.includes(query)
      );
    });
  }, [contacts, searchQuery, selectedDate, teamFilter]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      <Header isSyncing={isSyncing} onShowReadme={() => setShowReadme(true)} />

      <main className="max-w-full mx-auto px-6 py-8">
        <Toolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          teamFilter={teamFilter}
          setTeamFilter={setTeamFilter}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isSyncing={isSyncing}
          hasPendingUpdate={hasPendingUpdate}
          fetchContacts={() => fetchContacts()}
          lastSynced={lastSynced}
          onClearClick={() => setIsConfirmingClear(true)}
          isClearing={isClearing}
          deprecatedCount={
            contacts.filter((c) => {
              const statuses = Array.isArray(c.status) ? c.status : [c.status];
              return statuses.some(
                (s) => s.toLowerCase().trim() === "deprecated",
              );
            }).length
          }
          onAddClick={() => setIsAdding(true)}
        />

        <StatsBar dailyCounts={dailyCounts} selectedDate={selectedDate} />

        <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
          {[...COLUMNS, DEPRECATED_STATUS].map((col) => (
            <Column
              key={col}
              id={col}
              title={col}
              contacts={filterContactsByColumn(filteredContacts, col)}
              onEdit={(c) => {
                setEditingContact(c);
                setIsAdding(true);
              }}
              onDelete={deleteContact}
              newContactIds={newContactIds}
            />
          ))}
        </div>
      </main>

      <ContactModal
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
          setEditingContact(null);
        }}
        editingContact={editingContact}
        onSave={saveContact}
        isSaving={isSaving}
      />

      <ConfirmationModal
        isOpen={isConfirmingClear}
        onClose={() => setIsConfirmingClear(false)}
        onConfirm={clearDeprecated}
        title="Clear Deprecated Contacts"
        message="Are you sure you want to permanently delete all contacts in the Deprecated column? This action cannot be undone."
        confirmText="Clear All"
        isDestructive
      />

      {/* README Bottom Sheet */}
      <AnimatePresence>
        {showReadme && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReadme(false)}
              className="absolute inset-0 bg-[#141414]/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              <div className="p-6 border-b border-[#141414]/5 flex items-center justify-between bg-[#141414]/2 shrink-0">
                <div>
                  <h2 className="text-lg font-medium text-[#141414]">
                    Documentation
                  </h2>
                  <p className="text-xs text-[#141414]/40 uppercase tracking-wider font-medium">
                    System Updates & Info
                  </p>
                </div>
                <button
                  onClick={() => setShowReadme(false)}
                  className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#141414]/40" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <pre className="text-sm text-[#141414]/70 whitespace-pre-wrap font-mono leading-relaxed">
                  {readmeContent || "Loading..."}
                </pre>
              </div>
              <div className="p-4 bg-[#141414]/2 border-t border-[#141414]/5 flex justify-end shrink-0">
                <button
                  onClick={() => setShowReadme(false)}
                  className="px-4 py-2 bg-[#141414] text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#141414]/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
