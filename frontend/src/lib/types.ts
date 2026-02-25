export interface Vote {
  id: string;
  voterName: string;
  selectedTimeSlots: string[];
  votedAt: Date; // serialized as ISO string
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
  createdAt: string; // ISO string
  imageUrl?: string; // Supabase Storage URL
  votes: Vote[];
}

export type AuthMethod = 'supabase' | 'local';

export type AuthUser = {
  email: string;
  method: AuthMethod;
};