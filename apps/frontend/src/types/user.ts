export type UserRole = 'SUPER_ADMIN' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  name?: string;
  username?: string;
  role?: UserRole;
  is_active?: boolean;
}
