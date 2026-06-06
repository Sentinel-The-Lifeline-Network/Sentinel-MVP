import { api } from '@/lib/api';

export interface Contact {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  relationship: string;
  notification_enabled: boolean;
  created_at: string;
}

export interface ContactInput {
  full_name: string;
  phone: string;
  email: string;
  relationship: string;
  notification_enabled?: boolean;
}

export const contactsService = {
  getAll: () => api.get<Contact[]>('/api/contacts'),
  create: (data: ContactInput) => api.post<Contact>('/api/contacts', data),
  update: (id: string, data: Partial<ContactInput>) => api.put<Contact>(`/api/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/api/contacts/${id}`),
};
