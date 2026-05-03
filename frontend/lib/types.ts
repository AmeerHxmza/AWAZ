export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  channel: 'email' | 'sms' | string;
  recipient: string;
  status: 'sent' | 'failed' | string;
  sent_at: string;
}

export interface Complaint {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string | null;
  status: 'pending' | 'submitted' | 'acknowledged' | 'resolved' | 'escalated';
  authority: string | null;
  authority_email: string | null;
  drafted_letter: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  is_voice_input: boolean;
  created_at: string;
  updated_at: string;
  notifications?: Notification[];
}

export interface PublicStats {
  total_complaints: number;
  resolved: number;
  pending: number;
  submitted: number;
  acknowledged: number;
  escalated: number;
  authorities_notified: number;
}
