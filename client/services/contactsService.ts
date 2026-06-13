import { api } from '@/lib/api';

export const MAX_CONTACTS = 10;

export type InviteStatus = 'pending_invite' | 'accepted' | 'push_enabled' | 'push_disabled' | 'whatsapp_only';

export interface Contact {
  id: string;
  user_id: string;
  contact_name: string;
  phone_number: string;
  relationship: string;
  priority: number;
  invite_status: InviteStatus;
  invite_token: string;
  invite_link: string;
  whatsapp_invite_sent_at: string | null;
  accepted_at: string | null;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactInput {
  contact_name: string;
  phone_number: string;
  relationship: string;
  priority: number;
}

export const contactsService = {
  getAll: () => api.get<Contact[]>('/api/contacts'),
  create: (data: ContactInput) => api.post<Contact>('/api/contacts', data),
  update: (id: string, data: Partial<ContactInput>) => api.put<Contact>(`/api/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/api/contacts/${id}`),
  resendInvite: (id: string) => api.post<Contact>(`/api/contacts/${id}/resend-invite`, {}),
};
