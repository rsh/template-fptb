/**
 * Tests for API client
 */

import { ApiClient } from "../api/client";

// Mock fetch globally
global.fetch = jest.fn();

describe("ApiClient", () => {
  let client: ApiClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
    localStorage.clear();
    client = new ApiClient("http://test-api.com");
  });

  describe("Token management", () => {
    it("loads token from localStorage", () => {
      localStorage.setItem("auth_token", "stored-token");
      const newClient = new ApiClient();
      expect(newClient.getToken()).toBe("stored-token");
    });

    it("returns null when no token is stored", () => {
      expect(client.getToken()).toBeNull();
    });

    it("clears token from localStorage", () => {
      localStorage.setItem("auth_token", "test-token");
      const newClient = new ApiClient();
      newClient.clearToken();
      expect(newClient.getToken()).toBeNull();
      expect(localStorage.getItem("auth_token")).toBeNull();
    });

    it("checks authentication status", () => {
      expect(client.isAuthenticated()).toBe(false);
      localStorage.setItem("auth_token", "test-token");
      const authenticatedClient = new ApiClient();
      expect(authenticatedClient.isAuthenticated()).toBe(true);
    });
  });

  describe("register", () => {
    it("registers a new user and saves token", async () => {
      const mockResponse = {
        token: "new-token",
        user: { id: 1, username: "testuser", email: "test@example.com" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.register({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      expect(result.token).toBe("new-token");
      expect(client.getToken()).toBe("new-token");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/auth/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            username: "testuser",
            password: "password123",
          }),
        })
      );
    });

    it("throws error on registration failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Email already registered" }),
      } as Response);

      await expect(
        client.register({
          email: "test@example.com",
          username: "testuser",
          password: "password123",
        })
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("login", () => {
    it("logs in a user and saves token", async () => {
      const mockResponse = {
        token: "login-token",
        user: { id: 1, username: "testuser", email: "test@example.com" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.token).toBe("login-token");
      expect(client.getToken()).toBe("login-token");
    });

    it("throws error on login failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Invalid credentials" }),
      } as Response);

      await expect(
        client.login({
          email: "test@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("logout", () => {
    it("clears token", () => {
      localStorage.setItem("auth_token", "test-token");
      const authenticatedClient = new ApiClient();
      authenticatedClient.logout();
      expect(authenticatedClient.getToken()).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("gets current user profile", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        created_at: "2024-01-01",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response);

      const result = await client.getCurrentUser();
      expect(result).toEqual(mockUser);
    });
  });

  describe("getTodos", () => {
    it("gets all todos", async () => {
      const mockTodos = [
        {
          id: 1,
          title: "Todo 1",
          description: "First todo",
          status: "pending",
          importance: 3,
          urgency: 2,
          importance_label: "High",
          urgency_label: "Medium",
          importance_icon:
            '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="12" fill="#F44336"/></svg>',
          urgency_icon:
            '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8 2 L14 14 L2 14 Z" fill="#FF7811"/></svg>',
          priority_score: 2.6,
          owner: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todos: mockTodos }),
      } as Response);

      const result = await client.getTodos();
      expect(result).toEqual(mockTodos);
    });
  });

  describe("getTodo", () => {
    it("gets a specific todo", async () => {
      const mockTodo = {
        id: 1,
        title: "Todo 1",
        description: "First todo",
        status: "pending",
        importance: 3,
        urgency: 2,
        importance_label: "High",
        urgency_label: "Medium",
        importance_icon:
          '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="12" fill="#F44336"/></svg>',
        urgency_icon:
          '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8 2 L14 14 L2 14 Z" fill="#FF7811"/></svg>',
        priority_score: 2.6,
        owner: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todo: mockTodo }),
      } as Response);

      const result = await client.getTodo(1);
      expect(result).toEqual(mockTodo);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/todos/1",
        expect.any(Object)
      );
    });
  });

  describe("createTodo", () => {
    it("creates a new todo", async () => {
      const mockTodo = {
        id: 1,
        title: "New Todo",
        description: "A new todo",
        status: "pending",
        importance: 2,
        urgency: 2,
        importance_label: "Medium",
        urgency_label: "Medium",
        importance_icon:
          '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8 2 L14 14 L2 14 Z" fill="#FF7811"/></svg>',
        urgency_icon:
          '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8 2 L14 14 L2 14 Z" fill="#FF7811"/></svg>',
        priority_score: 2.0,
        owner: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todo: mockTodo }),
      } as Response);

      const result = await client.createTodo({
        title: "New Todo",
        description: "A new todo",
      });

      expect(result).toEqual(mockTodo);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/todos",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  describe("updateTodo", () => {
    it("updates a todo", async () => {
      const mockTodo = {
        id: 1,
        title: "Updated Todo",
        description: "Updated description",
        status: "completed",
        importance: 3,
        urgency: 3,
        importance_label: "High",
        urgency_label: "High",
        importance_icon: "🟥",
        urgency_icon: "🟥",
        priority_score: 3.0,
        owner: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todo: mockTodo }),
      } as Response);

      const result = await client.updateTodo(1, {
        title: "Updated Todo",
        status: "completed",
      });

      expect(result).toEqual(mockTodo);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/todos/1",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });
  });

  describe("deleteTodo", () => {
    it("deletes a todo", async () => {
      const mockResponse = { message: "Todo deleted successfully" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.deleteTodo(1);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/todos/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("Authentication headers", () => {
    it("includes Authorization header when token is present", async () => {
      localStorage.setItem("auth_token", "test-token");
      const authenticatedClient = new ApiClient("http://test-api.com");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todos: [] }),
      } as Response);

      await authenticatedClient.getTodos();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/todos",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("does not include Authorization header when no token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 1, username: "test", created_at: "2024-01-01" },
        }),
      } as Response);

      await client.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/auth/me",
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });
  });
});
