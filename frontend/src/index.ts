/**
 * Main application entry point
 */

import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import "./styles.css";

// Make Bootstrap available globally for components
(window as typeof window & { bootstrap: typeof bootstrap }).bootstrap = bootstrap;

import { apiClient, type Todo } from "./api";
import {
  getCurrentUser,
  initAuth,
  isAuthenticated,
  logout,
  setCurrentUser,
} from "./auth";
import {
  createLoginForm,
  createRegisterForm,
  createTodoForm,
  createTodosTable,
  showError,
  showSuccess,
} from "./components";

// State
let todos: Todo[] = [];
let editingTodo: Todo | null = null;

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  await initAuth();

  if (isAuthenticated()) {
    await showMainView();
  } else {
    showAuthView();
  }
}

/**
 * Show authentication view (login/register)
 */
function showAuthView(showRegister = false): void {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <nav class="navbar navbar-dark bg-primary">
      <div class="container">
        <span class="navbar-brand mb-0 h1">Todo Calendar</span>
      </div>
    </nav>
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6" id="auth-container"></div>
      </div>
    </div>
  `;

  const authContainer = document.getElementById("auth-container");
  if (!authContainer) return;

  if (showRegister) {
    const registerForm = createRegisterForm();
    authContainer.appendChild(registerForm);
    setupRegisterForm(registerForm);
  } else {
    const loginForm = createLoginForm();
    authContainer.appendChild(loginForm);
    setupLoginForm(loginForm);
  }
}

/**
 * Setup login form handlers
 */
function setupLoginForm(form: HTMLElement): void {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await apiClient.login({ email, password });
      setCurrentUser(response.user);
      await showMainView();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Login failed");
    }
  });

  const switchBtn = form.querySelector("#switch-to-register");
  switchBtn?.addEventListener("click", () => showAuthView(true));
}

/**
 * Setup register form handlers
 */
function setupRegisterForm(form: HTMLElement): void {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const response = await apiClient.register({ email, username, password });
      setCurrentUser(response.user);
      await showMainView();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Registration failed");
    }
  });

  const switchBtn = form.querySelector("#switch-to-login");
  switchBtn?.addEventListener("click", () => showAuthView(false));
}

/**
 * Show main application view
 */
async function showMainView(): Promise<void> {
  const app = document.getElementById("app");
  const user = getCurrentUser();
  if (!app || !user) return;

  app.innerHTML = `
    <nav class="navbar navbar-dark bg-primary">
      <div class="container">
        <span class="navbar-brand mb-0 h1">Todo Calendar</span>
        <div class="d-flex align-items-center gap-3">
          <span class="text-white">Welcome, ${user.username}!</span>
          <button class="btn btn-outline-light btn-sm" id="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
    <div class="container mt-4">
      <div id="todo-form-container"></div>
      <div id="todos-container"></div>
    </div>
  `;

  document.getElementById("logout-btn")?.addEventListener("click", handleLogout);

  await loadData();
  renderTodoForm();
  renderTodos();
}

/**
 * Load todos from API
 */
async function loadData(): Promise<void> {
  try {
    todos = await apiClient.getTodos();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Failed to load data");
  }
}

/**
 * Render todo form
 */
function renderTodoForm(): void {
  const todoFormContainer = document.getElementById("todo-form-container");
  if (todoFormContainer) {
    todoFormContainer.innerHTML = "";
    const todoForm = createTodoForm(editingTodo || undefined);
    todoFormContainer.appendChild(todoForm);
    setupTodoForm(todoForm);
  }
}

/**
 * Render todos table
 */
function renderTodos(): void {
  const todosContainer = document.getElementById("todos-container");
  if (!todosContainer) return;

  todosContainer.innerHTML = "";
  const todosTable = createTodosTable(todos);
  todosContainer.appendChild(todosTable);

  // Setup event handlers for edit/delete buttons
  todosTable.querySelectorAll(".edit-todo").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const todoId = parseInt((e.target as HTMLElement).dataset["todoId"] || "0");
      await handleEditTodo(todoId);
    });
  });

  todosTable.querySelectorAll(".delete-todo").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const todoId = parseInt((e.target as HTMLElement).dataset["todoId"] || "0");
      await handleDeleteTodo(todoId);
    });
  });
}

/**
 * Setup todo form handler
 */
function setupTodoForm(form: HTMLElement): void {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const importance = parseInt(formData.get("importance") as string);
    const urgency = parseInt(formData.get("urgency") as string);
    const status = formData.get("status") as "pending" | "in_progress" | "completed";

    const todoData: any = {
      title,
      importance,
      urgency,
      status,
    };

    if (description) {
      todoData.description = description;
    }

    try {
      if (editingTodo) {
        const updated = await apiClient.updateTodo(editingTodo.id, todoData);
        const index = todos.findIndex((t) => t.id === editingTodo?.id);
        if (index !== -1) todos[index] = updated;
        showSuccess("Todo updated successfully");
        editingTodo = null;
      } else {
        const newTodo = await apiClient.createTodo(todoData);
        todos.unshift(newTodo);
        showSuccess("Todo created successfully");
      }
      renderTodoForm();
      renderTodos();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save todo");
    }
  });

  // Cancel edit button
  const cancelBtn = form.querySelector("#cancel-edit");
  cancelBtn?.addEventListener("click", () => {
    editingTodo = null;
    renderTodoForm();
  });
}

/**
 * Handle edit todo
 */
async function handleEditTodo(todoId: number): Promise<void> {
  editingTodo = todos.find((t) => t.id === todoId) || null;
  renderTodoForm();
  // Scroll to form
  document
    .getElementById("todo-form-container")
    ?.scrollIntoView({ behavior: "smooth" });
}

/**
 * Handle delete todo
 */
async function handleDeleteTodo(todoId: number): Promise<void> {
  if (!confirm("Are you sure you want to delete this todo?")) return;

  try {
    await apiClient.deleteTodo(todoId);
    todos = todos.filter((t) => t.id !== todoId);
    showSuccess("Todo deleted successfully");
    renderTodos();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Failed to delete todo");
  }
}

/**
 * Handle logout
 */
function handleLogout(): void {
  logout();
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  void init();
}
