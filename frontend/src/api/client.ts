/**
 * TypeScript client library for Web Application API
 * Provides type-safe methods for all API endpoints
 */

import type {
  ApiError,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Todo,
  TodoCreateRequest,
  TodoUpdateRequest,
  User,
} from "./types";

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = "http://localhost:5000") {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  /**
   * Load token from localStorage
   */
  private loadToken(): void {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auth_token");
      if (stored !== null) {
        this.token = stored;
      }
    }
  }

  /**
   * Save token to localStorage
   */
  private saveToken(token: string): void {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  /**
   * Clear token from localStorage
   */
  public clearToken(): void {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  /**
   * Get current token
   */
  public getToken(): string | null {
    return this.token;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token !== null) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.error || "Request failed");
    }

    return response.json() as Promise<T>;
  }

  // Authentication methods

  /**
   * Register a new user
   */
  public async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.saveToken(response.token);
    return response;
  }

  /**
   * Login existing user
   */
  public async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.saveToken(response.token);
    return response;
  }

  /**
   * Logout current user
   */
  public logout(): void {
    this.clearToken();
  }

  /**
   * Get current user profile
   */
  public async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>("/api/auth/me");
    return response.user;
  }

  // Todo methods

  /**
   * Get all todos for current user (sorted by priority)
   */
  public async getTodos(): Promise<Todo[]> {
    const response = await this.request<{ todos: Todo[] }>("/api/todos");
    return response.todos;
  }

  /**
   * Get todo details
   */
  public async getTodo(todoId: number): Promise<Todo> {
    const response = await this.request<{ todo: Todo }>(`/api/todos/${todoId}`);
    return response.todo;
  }

  /**
   * Create a new todo
   */
  public async createTodo(data: TodoCreateRequest): Promise<Todo> {
    const response = await this.request<{ todo: Todo }>("/api/todos", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.todo;
  }

  /**
   * Update a todo
   */
  public async updateTodo(todoId: number, data: TodoUpdateRequest): Promise<Todo> {
    const response = await this.request<{ todo: Todo }>(`/api/todos/${todoId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.todo;
  }

  /**
   * Delete a todo
   */
  public async deleteTodo(todoId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/todos/${todoId}`, {
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
