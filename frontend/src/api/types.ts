/**
 * TypeScript types for API communication
 */

export interface User {
  id: number;
  username: string;
  email?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Item {
  id: number;
  title: string;
  description: string | null;
  category: Category | null;
  owner: User | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
}

// Request types
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ItemCreateRequest {
  title: string;
  description?: string;
  category_id?: number;
  status?: "active" | "inactive" | "archived";
}

export interface ItemUpdateRequest {
  title?: string;
  description?: string;
  category_id?: number;
  status?: "active" | "inactive" | "archived";
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
