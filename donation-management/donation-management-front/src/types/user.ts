export type UserRole = 'user' | 'admin' | 'system';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | null;
  is_active: boolean;
  created_at: string;
}
