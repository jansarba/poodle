export interface Vote {
  id: string;
  voterName: string;
  selectedTimeSlots: string[];
  votedAt: Date; // Data jest przesyłana jako string w JSON
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  timeSlots: string[];
  createdAt: string; // Data jest przesyłana jako string w JSON
  imageUrl?: string; // URL do obrazka z Supabase Storage, opcjonalne
  votes: Vote[];
}

export type AuthMethod = 'supabase' | 'local';

export type AuthUser = {
  email: string;
  method: AuthMethod;
};