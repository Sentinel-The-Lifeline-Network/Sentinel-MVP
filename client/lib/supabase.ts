import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          created_at: string;
        };
      };
      sos_alerts: {
        Row: {
          id: string;
          user_id: string;
          status: 'active' | 'resolved' | 'cancelled';
          started_at: string;
          ended_at: string | null;
          last_latitude: number | null;
          last_longitude: number | null;
          last_location_timestamp: string | null;
          tracking_token: string;
          created_at: string;
        };
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_name: string;
          phone_number: string;
          relationship: string;
          priority: number;
          invite_status: 'pending_invite' | 'accepted' | 'push_enabled' | 'push_disabled' | 'whatsapp_only';
          invite_token: string;
          invite_link: string;
          whatsapp_invite_sent_at: string | null;
          accepted_at: string | null;
          push_enabled: boolean;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
