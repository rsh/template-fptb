/**
 * Authentication utilities
 */

import { apiClient, type User } from "./api";

let currentUser: User | null = null;

export async function initAuth(): Promise<void> {
  if (apiClient.isAuthenticated()) {
    try {
      currentUser = await apiClient.getCurrentUser();
    } catch (error) {
      console.error("Failed to get current user:", error);
      apiClient.clearToken();
    }
  }
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function setCurrentUser(user: User | null): void {
  currentUser = user;
}

export function isAuthenticated(): boolean {
  return currentUser !== null;
}

export function logout(): void {
  apiClient.logout();
  currentUser = null;
  window.location.href = "/";
}
