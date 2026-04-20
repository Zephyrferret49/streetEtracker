import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Contact } from '../types';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [hasPendingUpdate, setHasPendingUpdate] = useState(false);
  const [newContactIds, setNewContactIds] = useState<Set<string>>(new Set());

  const fetchContacts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const res = await fetch('/api/contacts');
      const sheetData: Contact[] = await res.json();
      
      setContacts(prev => {
        if (prev.length === 0) return sheetData;

        const currentIds = new Set(prev.map(c => c.id));
        const newIds = sheetData.filter(c => !currentIds.has(c.id)).map(c => c.id);
        if (newIds.length > 0) {
          setNewContactIds(new Set(newIds));
          setTimeout(() => setNewContactIds(new Set()), 10000);
        }

        return sheetData;
      });
      setLastSynced(new Date());
      setHasPendingUpdate(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 1000);
    }
  }, []);

  useEffect(() => {
    // Initial fetch from API to ensure we have the latest from Sheets
    fetchContacts();

    // Set up Firestore real-time listener
    const q = query(collection(db, 'contacts'), orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreContacts: Contact[] = [];
      snapshot.forEach((doc) => {
        firestoreContacts.push(doc.data() as Contact);
      });
      
      if (firestoreContacts.length > 0) {
        setContacts(prev => {
          // Merge logic: prefer Firestore data if it's newer or if we don't have it
          // But since server.ts syncs Sheets -> Firestore, Firestore should be the latest
          return firestoreContacts;
        });
        setLastSynced(new Date());
        setHasPendingUpdate(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contacts');
    });

    // Keep WebSocket for now as a fallback for non-Firestore updates if any
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'UPDATE_CONTACTS') {
          // If Firestore is working, we might not need this, but it doesn't hurt
          setHasPendingUpdate(true);
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    return () => {
      unsubscribe();
      ws.close();
    };
  }, [fetchContacts]);

  const clearDeprecated = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/contacts/clear-deprecated', {
        method: 'POST',
      });
      if (res.ok) {
        fetchContacts(true);
      }
    } catch (e) {
      console.error('Failed to clear deprecated:', e);
    } finally {
      setIsClearing(false);
    }
  };

  const deleteContact = async (id: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchContacts(true);
      }
    } catch (e) {
      console.error('Failed to delete contact:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    contacts,
    setContacts,
    loading,
    isSyncing,
    isClearing,
    lastSynced,
    hasPendingUpdate,
    newContactIds,
    fetchContacts,
    clearDeprecated,
    deleteContact,
  };
}
