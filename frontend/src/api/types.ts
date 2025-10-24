/**
 * TypeScript types for API communication
 */

export interface User {
  id: number;
  username: string;
  email?: string;
  created_at: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  owner: User | null;
  status: "pending" | "in_progress" | "completed";
  importance: number; // 1=Low, 2=Medium, 3=High, 4=Critical
  urgency: number; // 1=Low, 2=Medium, 3=High, 4=Critical
  importance_label: string;
  urgency_label: string;
  importance_icon: string;
  urgency_icon: string;
  priority_score: number;
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

export interface TodoCreateRequest {
  title: string;
  description?: string;
  importance?: number; // 1=Low, 2=Medium, 3=High, 4=Critical
  urgency?: number; // 1=Low, 2=Medium, 3=High, 4=Critical
  status?: "pending" | "in_progress" | "completed";
}

export interface TodoUpdateRequest {
  title?: string;
  description?: string;
  importance?: number; // 1=Low, 2=Medium, 3=High, 4=Critical
  urgency?: number; // 1=Low, 2=Medium, 3=High, 4=Critical
  status?: "pending" | "in_progress" | "completed";
}

export interface ApiError {
  error: string;
  details?: unknown;
}
