export interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
  major?: number;
  semester?: number;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}
