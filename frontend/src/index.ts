/**
 * Main application entry point
 */

import "bootstrap/dist/css/bootstrap.min.css";
import "./brite-theme.css";
import "./brite-theme-override.css";
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
  createQuickAddTask,
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
      <div id="quick-add-container" class="mb-3"></div>
      <div id="todos-container"></div>
    </div>

    <!-- Todo Form Modal -->
    <div class="modal fade" id="todoModal" tabindex="-1" aria-labelledby="todoModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="todoModalLabel">Add Task</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="todo-form-container">
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("logout-btn")?.addEventListener("click", handleLogout);

  // Render quick add section
  renderQuickAdd();

  await loadData();
  renderTodos();
}

/**
 * Render quick add task section
 */
function renderQuickAdd(): void {
  const quickAddContainer = document.getElementById("quick-add-container");
  if (!quickAddContainer) return;

  quickAddContainer.innerHTML = "";
  const quickAddComponent = createQuickAddTask();
  quickAddContainer.appendChild(quickAddComponent);

  // Setup form submission handler
  const form = quickAddComponent.querySelector("#quick-add-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get("title") as string;
    const importance = parseInt(formData.get("importance") as string);
    const urgency = parseInt(formData.get("urgency") as string);

    const todoData = {
      title,
      importance,
      urgency,
      status: "pending" as const,
    };

    try {
      const newTodo = await apiClient.createTodo(todoData);
      todos.unshift(newTodo);
      showSuccess("Task created successfully");
      renderTodos();

      // Reset form
      (e.target as HTMLFormElement).reset();
      // Reset dropdowns to default (Medium)
      const importanceInput = form.querySelector(
        "#quick-importance"
      ) as HTMLInputElement;
      const urgencyInput = form.querySelector("#quick-urgency") as HTMLInputElement;
      const importanceSelected = form.querySelector(
        "#quick-importance-selected"
      ) as HTMLElement;
      const urgencySelected = form.querySelector(
        "#quick-urgency-selected"
      ) as HTMLElement;

      if (importanceInput) importanceInput.value = "2";
      if (urgencyInput) urgencyInput.value = "2";
      if (importanceSelected) {
        importanceSelected.innerHTML = `${document.querySelector(".quick-importance-option[data-value='2']")?.innerHTML || "Medium"}`;
      }
      if (urgencySelected) {
        urgencySelected.innerHTML = `${document.querySelector(".quick-urgency-option[data-value='2']")?.innerHTML || "Medium"}`;
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to create task");
    }
  });
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
 * Open todo modal for adding or editing
 */
function openTodoModal(todo?: Todo): void {
  const modalElement = document.getElementById("todoModal");
  const modalTitle = document.getElementById("todoModalLabel");
  const todoFormContainer = document.getElementById("todo-form-container");

  if (!modalElement || !modalTitle || !todoFormContainer) return;

  // Update modal title
  modalTitle.textContent = todo ? "Edit Task" : "Add Task";

  // Render form
  todoFormContainer.innerHTML = "";
  const todoForm = createTodoForm(todo);
  todoFormContainer.appendChild(todoForm);
  setupTodoForm(todoForm);

  // Show modal
  const modal = new (window as any).bootstrap.Modal(modalElement);
  modal.show();

  // Store modal reference for closing later
  (modalElement as any)._modalInstance = modal;
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
      closeModal();
      renderTodos();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save todo");
    }
  });

  // Cancel edit button
  const cancelBtn = form.querySelector("#cancel-edit");
  cancelBtn?.addEventListener("click", () => {
    editingTodo = null;
    closeModal();
  });
}

/**
 * Close the todo modal
 */
function closeModal(): void {
  const modalElement = document.getElementById("todoModal");
  if (modalElement && (modalElement as any)._modalInstance) {
    (modalElement as any)._modalInstance.hide();
  }
}

/**
 * Handle edit todo
 */
async function handleEditTodo(todoId: number): Promise<void> {
  editingTodo = todos.find((t) => t.id === todoId) || null;
  if (editingTodo) {
    openTodoModal(editingTodo);
  }
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
