export interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
  saved_slots?: number[];
}

export interface AuthResponse {
  access: string;
  refresh: string;
}
