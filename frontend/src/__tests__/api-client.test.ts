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

  describe("getCategories", () => {
    it("gets all categories", async () => {
      const mockCategories = [
        { id: 1, name: "Tech", description: "Technology" },
        { id: 2, name: "Books", description: "Books" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories }),
      } as Response);

      const result = await client.getCategories();
      expect(result).toEqual(mockCategories);
    });
  });

  describe("createCategory", () => {
    it("creates a new category", async () => {
      const mockCategory = { id: 1, name: "Tech", description: "Technology" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ category: mockCategory }),
      } as Response);

      const result = await client.createCategory({
        name: "Tech",
        description: "Technology",
      });

      expect(result).toEqual(mockCategory);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/categories",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  describe("getItems", () => {
    it("gets all items", async () => {
      const mockItems = [
        { id: 1, title: "Item 1", description: "First item", status: "active" },
        { id: 2, title: "Item 2", description: "Second item", status: "inactive" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockItems }),
      } as Response);

      const result = await client.getItems();
      expect(result).toEqual(mockItems);
    });
  });

  describe("getItem", () => {
    it("gets a specific item", async () => {
      const mockItem = {
        id: 1,
        title: "Item 1",
        description: "First item",
        status: "active",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ item: mockItem }),
      } as Response);

      const result = await client.getItem(1);
      expect(result).toEqual(mockItem);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/items/1",
        expect.any(Object)
      );
    });
  });

  describe("createItem", () => {
    it("creates a new item", async () => {
      const mockItem = {
        id: 1,
        title: "New Item",
        description: "A new item",
        status: "active",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ item: mockItem }),
      } as Response);

      const result = await client.createItem({
        title: "New Item",
        description: "A new item",
      });

      expect(result).toEqual(mockItem);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/items",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  describe("updateItem", () => {
    it("updates an item", async () => {
      const mockItem = {
        id: 1,
        title: "Updated Item",
        description: "Updated description",
        status: "archived",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ item: mockItem }),
      } as Response);

      const result = await client.updateItem(1, {
        title: "Updated Item",
        status: "archived",
      });

      expect(result).toEqual(mockItem);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/items/1",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });
  });

  describe("deleteItem", () => {
    it("deletes an item", async () => {
      const mockResponse = { message: "Item deleted successfully" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.deleteItem(1);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/items/1",
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
        json: async () => ({ items: [] }),
      } as Response);

      await authenticatedClient.getItems();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/items",
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
        json: async () => ({ categories: [] }),
      } as Response);

      await client.getCategories();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/api/categories",
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });
  });
});
