/**
 * Tests for UI components
 */

import {
  createLoginForm,
  createRegisterForm,
  createTodoForm,
  createTodosTable,
  showError,
  showSuccess,
} from "../components";
import type { Todo } from "../api";

describe("Components", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  describe("createLoginForm", () => {
    it("creates a login form with email and password fields", () => {
      const form = createLoginForm();
      expect(form.tagName).toBe("FORM");
      expect(form.querySelector("#email")).toBeTruthy();
      expect(form.querySelector("#password")).toBeTruthy();
      expect(form.querySelector('button[type="submit"]')).toBeTruthy();
      expect(form.querySelector("#switch-to-register")).toBeTruthy();
    });

    it("has required attributes on inputs", () => {
      const form = createLoginForm();
      const emailInput = form.querySelector("#email") as HTMLInputElement;
      const passwordInput = form.querySelector("#password") as HTMLInputElement;
      expect(emailInput.required).toBe(true);
      expect(passwordInput.required).toBe(true);
      expect(emailInput.type).toBe("email");
      expect(passwordInput.type).toBe("password");
    });
  });

  describe("createRegisterForm", () => {
    it("creates a registration form with all required fields", () => {
      const form = createRegisterForm();
      expect(form.tagName).toBe("FORM");
      expect(form.querySelector("#username")).toBeTruthy();
      expect(form.querySelector("#email")).toBeTruthy();
      expect(form.querySelector("#password")).toBeTruthy();
      expect(form.querySelector('button[type="submit"]')).toBeTruthy();
      expect(form.querySelector("#switch-to-login")).toBeTruthy();
    });

    it("has validation constraints", () => {
      const form = createRegisterForm();
      const usernameInput = form.querySelector("#username") as HTMLInputElement;
      const passwordInput = form.querySelector("#password") as HTMLInputElement;
      expect(usernameInput.minLength).toBe(3);
      expect(passwordInput.minLength).toBe(8);
    });
  });

  describe("createTodoForm", () => {
    it("creates an empty form for new todos", () => {
      const form = createTodoForm();
      expect(form.tagName).toBe("FORM");
      expect(form.querySelector("#todo-title")).toBeTruthy();
      expect(form.querySelector("#todo-description")).toBeTruthy();
      expect(form.querySelector("#todo-importance")).toBeTruthy();
      expect(form.querySelector("#todo-urgency")).toBeTruthy();
      expect(form.querySelector("#todo-status")).toBeTruthy();
      expect(form.textContent).toContain("Create Task");
    });

    it("populates form with existing todo data", () => {
      const mockTodo: Todo = {
        id: 1,
        title: "Test Todo",
        description: "Test description",
        status: "in_progress",
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

      const form = createTodoForm(mockTodo);
      const titleInput = form.querySelector("#todo-title") as HTMLInputElement;
      const descriptionInput = form.querySelector(
        "#todo-description"
      ) as HTMLTextAreaElement;
      const statusSelect = form.querySelector("#todo-status") as HTMLSelectElement;
      const importanceSelect = form.querySelector(
        "#todo-importance"
      ) as HTMLSelectElement;
      const urgencySelect = form.querySelector("#todo-urgency") as HTMLSelectElement;

      expect(titleInput.value).toBe("Test Todo");
      expect(descriptionInput.value).toBe("Test description");
      expect(statusSelect.value).toBe("in_progress");
      expect(importanceSelect.value).toBe("3");
      expect(urgencySelect.value).toBe("2");
      expect(form.textContent).toContain("Update Task");
      expect(form.querySelector("#cancel-edit")).toBeTruthy();
    });
  });

  describe("createTodosTable", () => {
    it("shows empty state when no todos", () => {
      const table = createTodosTable([]);
      expect(table.textContent).toContain("No todos yet");
    });

    it("creates table with todos", () => {
      const mockTodos: Todo[] = [
        {
          id: 1,
          title: "Todo 1",
          description: "Description 1",
          status: "pending",
          importance: 3,
          urgency: 2,
          importance_label: "High",
          urgency_label: "Medium",
          importance_icon: "🟥",
          urgency_icon: "🔺",
          priority_score: 2.6,
          owner: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          title: "Todo 2",
          description: null,
          status: "completed",
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
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ];

      const table = createTodosTable(mockTodos);
      expect(table.querySelector("table")).toBeTruthy();
      expect(table.textContent).toContain("Todo 1");
      expect(table.textContent).toContain("Todo 2");
      expect(table.textContent).toContain("No description");
    });

    it("includes edit and delete buttons for each todo", () => {
      const mockTodos: Todo[] = [
        {
          id: 1,
          title: "Todo 1",
          description: "Description 1",
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
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const table = createTodosTable(mockTodos);
      const editButton = table.querySelector(".edit-todo") as HTMLButtonElement;
      const deleteButton = table.querySelector(".delete-todo") as HTMLButtonElement;

      expect(editButton).toBeTruthy();
      expect(deleteButton).toBeTruthy();
      expect(editButton.dataset.todoId).toBe("1");
      expect(deleteButton.dataset.todoId).toBe("1");
    });

    it("escapes HTML in todo data", () => {
      const mockTodos: Todo[] = [
        {
          id: 1,
          title: "<script>alert('xss')</script>",
          description: "<b>Bold</b>",
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
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const table = createTodosTable(mockTodos);
      const html = table.innerHTML;

      // HTML should be escaped
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("&lt;b&gt;");
    });
  });

  describe("showError", () => {
    it("displays error message in app container", () => {
      showError("Test error message");
      const app = document.getElementById("app");
      const alert = app?.querySelector(".alert-danger");

      expect(alert).toBeTruthy();
      expect(alert?.textContent).toContain("Test error message");
    });

    it("escapes HTML in error messages", () => {
      showError("<script>alert('xss')</script>");
      const app = document.getElementById("app");
      const alert = app?.querySelector(".alert-danger");

      expect(alert?.innerHTML).toContain("&lt;script&gt;");
    });

    it("does nothing if app container does not exist", () => {
      document.body.innerHTML = "";
      expect(() => showError("Test")).not.toThrow();
    });
  });

  describe("showSuccess", () => {
    it("displays success message in app container", () => {
      showSuccess("Test success message");
      const app = document.getElementById("app");
      const alert = app?.querySelector(".alert-success");

      expect(alert).toBeTruthy();
      expect(alert?.textContent).toContain("Test success message");
    });

    it("escapes HTML in success messages", () => {
      showSuccess("<b>Bold text</b>");
      const app = document.getElementById("app");
      const alert = app?.querySelector(".alert-success");

      expect(alert?.innerHTML).toContain("&lt;b&gt;");
    });

    it("does nothing if app container does not exist", () => {
      document.body.innerHTML = "";
      expect(() => showSuccess("Test")).not.toThrow();
    });
  });
});
