export interface User {
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
  saved_slots?: number[];
  date_joined?: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface Room {
  id: number;
  name: string;
  code: string;
  category: 'UNIVERSITY' | 'WORK';
  has_password?: boolean;
  created_by: number;
  participants_count: number;
  created_at: string;
}

export interface Participant {
  id: number;
  user: number;
  username: string;
  room: number;
  room_code: string;
  color: string;
  joined_at: string;
}

export interface ScheduleEntry {
  id: number;
  subject: string;
  teacher?: string;
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  time_slot: string;
  room: number;
  entry_type: 'NOTE' | 'ACADEMIC';
  is_private: boolean;
  created_by_username: string;
  updated_at?: string;
}

export interface AcademicSlot {
  id: number;
  subject: string;
  teacher: string;
  day: string;
  time_slot: string;
}