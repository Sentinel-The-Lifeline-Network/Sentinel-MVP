'use client';
import { useState, useEffect, useCallback } from 'react';
import { contactsService, Contact, ContactInput } from '@/services/contactsService';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contactsService.getAll();
      setContacts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addContact = useCallback(async (data: ContactInput) => {
    const contact = await contactsService.create(data);
    setContacts((prev) => [...prev, contact]);
    return contact;
  }, []);

  const updateContact = useCallback(async (id: string, data: Partial<ContactInput>) => {
    const updated = await contactsService.update(id, data);
    setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const removeContact = useCallback(async (id: string) => {
    await contactsService.delete(id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const resendInvite = useCallback(async (id: string) => {
    const updated = await contactsService.resendInvite(id);
    setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  return { contacts, loading, error, addContact, updateContact, removeContact, resendInvite, reload: load };
};
