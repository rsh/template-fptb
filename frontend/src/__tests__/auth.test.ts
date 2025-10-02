/**
 * Tests for authentication utilities
 */

import { apiClient } from "../api";
import * as auth from "../auth";

// Mock the apiClient
jest.mock("../api", () => ({
  apiClient: {
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
    clearToken: jest.fn(),
    logout: jest.fn(),
  },
}));

describe("Auth utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the current user state
    auth.setCurrentUser(null);
  });

  describe("getCurrentUser", () => {
    it("returns null when no user is set", () => {
      expect(auth.getCurrentUser()).toBeNull();
    });

    it("returns the current user when set", () => {
      const user = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        is_admin: false,
        created_at: "2024-01-01T00:00:00Z",
      };
      auth.setCurrentUser(user);
      expect(auth.getCurrentUser()).toEqual(user);
    });
  });

  describe("setCurrentUser", () => {
    it("sets the current user", () => {
      const user = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        is_admin: false,
        created_at: "2024-01-01T00:00:00Z",
      };
      auth.setCurrentUser(user);
      expect(auth.getCurrentUser()).toEqual(user);
    });

    it("can set user to null", () => {
      const user = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        is_admin: false,
        created_at: "2024-01-01T00:00:00Z",
      };
      auth.setCurrentUser(user);
      auth.setCurrentUser(null);
      expect(auth.getCurrentUser()).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("returns false when no user is set", () => {
      expect(auth.isAuthenticated()).toBe(false);
    });

    it("returns true when user is set", () => {
      const user = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        is_admin: false,
        created_at: "2024-01-01T00:00:00Z",
      };
      auth.setCurrentUser(user);
      expect(auth.isAuthenticated()).toBe(true);
    });
  });

  describe("initAuth", () => {
    it("fetches current user when authenticated", async () => {
      const user = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        is_admin: false,
        created_at: "2024-01-01T00:00:00Z",
      };

      (apiClient.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiClient.getCurrentUser as jest.Mock).mockResolvedValue(user);

      await auth.initAuth();

      expect(apiClient.isAuthenticated).toHaveBeenCalled();
      expect(apiClient.getCurrentUser).toHaveBeenCalled();
      expect(auth.getCurrentUser()).toEqual(user);
    });

    it("does not fetch user when not authenticated", async () => {
      (apiClient.isAuthenticated as jest.Mock).mockReturnValue(false);

      await auth.initAuth();

      expect(apiClient.isAuthenticated).toHaveBeenCalled();
      expect(apiClient.getCurrentUser).not.toHaveBeenCalled();
    });

    it("clears token on error", async () => {
      (apiClient.isAuthenticated as jest.Mock).mockReturnValue(true);
      (apiClient.getCurrentUser as jest.Mock).mockRejectedValue(
        new Error("Unauthorized")
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await auth.initAuth();

      expect(apiClient.clearToken).toHaveBeenCalled();
      expect(auth.getCurrentUser()).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe("logout", () => {
    it("calls apiClient.logout and clears user", () => {
      const user = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        is_admin: false,
        created_at: "2024-01-01T00:00:00Z",
      };
      auth.setCurrentUser(user);

      // Mock window.location
      delete (window as { location?: unknown }).location;
      window.location = { href: "" } as Location;

      auth.logout();

      expect(apiClient.logout).toHaveBeenCalled();
      expect(auth.getCurrentUser()).toBeNull();
      expect(window.location.href).toBe("/");
    });
  });
});
