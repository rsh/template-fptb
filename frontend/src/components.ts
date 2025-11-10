/**
 * Reusable UI components
 */

import type { Todo } from "./api";

/**
 * Helper function to get SVG icon for a level
 */
function getLevelSvg(level: number): string {
  const svgs: Record<number, string> = {
    1: '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 6px;"><circle cx="8" cy="8" r="7" fill="#FFC107"/></svg>',
    2: '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 6px;"><path d="M8 2 L14 14 L2 14 Z" fill="#FF7811"/></svg>',
    3: '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 6px;"><rect x="2" y="2" width="12" height="12" fill="#F44336"/></svg>',
    4: '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 6px;"><path d="M8 1 L10 6 L15 7 L11 11 L12 16 L8 13 L4 16 L5 11 L1 7 L6 6 Z" fill="#2196F3"/></svg>',
  };
  return svgs[level] !== undefined ? svgs[level] : svgs[2]!;
}

/**
 * Helper function to get level label
 */
function getLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    1: "Low",
    2: "Medium",
    3: "High",
    4: "Critical",
  };
  return labels[level] || "Medium";
}

/**
 * Create login form component
 */
export function createLoginForm(): HTMLElement {
  const form = document.createElement("form");
  form.className = "card p-4";
  form.innerHTML = `
    <h2 class="mb-3">Login</h2>
    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input type="email" class="form-control" id="email" name="email" required>
    </div>
    <div class="mb-3">
      <label for="password" class="form-label">Password</label>
      <input type="password" class="form-control" id="password" name="password" required>
    </div>
    <button type="submit" class="btn btn-primary">Login</button>
    <button type="button" class="btn btn-link" id="switch-to-register">
      Don't have an account? Register
    </button>
  `;
  return form;
}

/**
 * Create registration form component
 */
export function createRegisterForm(): HTMLElement {
  const form = document.createElement("form");
  form.className = "card p-4";
  form.innerHTML = `
    <h2 class="mb-3">Register</h2>
    <div class="mb-3">
      <label for="username" class="form-label">Username</label>
      <input type="text" class="form-control" id="username" name="username" required minlength="3">
    </div>
    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input type="email" class="form-control" id="email" name="email" required>
    </div>
    <div class="mb-3">
      <label for="password" class="form-label">Password</label>
      <input type="password" class="form-control" id="password" name="password" required minlength="8">
    </div>
    <button type="submit" class="btn btn-primary">Register</button>
    <button type="button" class="btn btn-link" id="switch-to-login">
      Already have an account? Login
    </button>
  `;
  return form;
}

/**
 * Create todo form component
 */
export function createTodoForm(todo?: Todo): HTMLElement {
  const form = document.createElement("form");
  form.className = "";

  form.innerHTML = `
    <div class="mb-3">
      <label for="todo-title" class="form-label">Title</label>
      <input type="text" class="form-control" id="todo-title" name="title"
             value="${escapeHtml(todo?.title || "")}" required>
    </div>
    <div class="mb-3">
      <label for="todo-description" class="form-label">Description</label>
      <textarea class="form-control" id="todo-description" name="description" rows="3">${escapeHtml(todo?.description || "")}</textarea>
    </div>
    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label">Importance</label>
        <input type="hidden" id="todo-importance" name="importance" value="${todo?.importance || 2}">
        <div class="dropdown w-100">
          <button class="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center" type="button" id="importance-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <span id="importance-selected">${getLevelSvg(todo?.importance || 2)}${getLevelLabel(todo?.importance || 2)}</span>
            <span>▼</span>
          </button>
          <ul class="dropdown-menu w-100" aria-labelledby="importance-dropdown">
            <li><a class="dropdown-item importance-option" href="#" data-value="1">${getLevelSvg(1)}Low</a></li>
            <li><a class="dropdown-item importance-option" href="#" data-value="2">${getLevelSvg(2)}Medium</a></li>
            <li><a class="dropdown-item importance-option" href="#" data-value="3">${getLevelSvg(3)}High</a></li>
            <li><a class="dropdown-item importance-option" href="#" data-value="4">${getLevelSvg(4)}Critical</a></li>
          </ul>
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Urgency</label>
        <input type="hidden" id="todo-urgency" name="urgency" value="${todo?.urgency || 2}">
        <div class="dropdown w-100">
          <button class="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center" type="button" id="urgency-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <span id="urgency-selected">${getLevelSvg(todo?.urgency || 2)}${getLevelLabel(todo?.urgency || 2)}</span>
            <span>▼</span>
          </button>
          <ul class="dropdown-menu w-100" aria-labelledby="urgency-dropdown">
            <li><a class="dropdown-item urgency-option" href="#" data-value="1">${getLevelSvg(1)}Low</a></li>
            <li><a class="dropdown-item urgency-option" href="#" data-value="2">${getLevelSvg(2)}Medium</a></li>
            <li><a class="dropdown-item urgency-option" href="#" data-value="3">${getLevelSvg(3)}High</a></li>
            <li><a class="dropdown-item urgency-option" href="#" data-value="4">${getLevelSvg(4)}Critical</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="mb-3">
      <label for="todo-status" class="form-label">Status</label>
      <select class="form-select" id="todo-status" name="status">
        <option value="pending" ${!todo || todo?.status === "pending" ? "selected" : ""}>Pending</option>
        <option value="in_progress" ${todo?.status === "in_progress" ? "selected" : ""}>In Progress</option>
        <option value="completed" ${todo?.status === "completed" ? "selected" : ""}>Completed</option>
      </select>
    </div>
    <div class="modal-footer">
      ${todo ? '<button type="button" class="btn btn-secondary" id="cancel-edit">Cancel</button>' : '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>'}
      <button type="submit" class="btn btn-primary">
        ${todo ? "Update" : "Create"} Task
      </button>
    </div>
  `;

  // Add event listeners for dropdown selections
  setTimeout(() => {
    const importanceOptions = form.querySelectorAll(".importance-option");
    const urgencyOptions = form.querySelectorAll(".urgency-option");

    importanceOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const value = (e.currentTarget as HTMLElement).dataset["value"] || "2";
        const hiddenInput = form.querySelector("#todo-importance") as HTMLInputElement;
        const selectedSpan = form.querySelector("#importance-selected") as HTMLElement;
        if (hiddenInput) hiddenInput.value = value;
        if (selectedSpan) {
          selectedSpan.innerHTML = `${getLevelSvg(parseInt(value))}${getLevelLabel(parseInt(value))}`;
        }
      });
    });

    urgencyOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const value = (e.currentTarget as HTMLElement).dataset["value"] || "2";
        const hiddenInput = form.querySelector("#todo-urgency") as HTMLInputElement;
        const selectedSpan = form.querySelector("#urgency-selected") as HTMLElement;
        if (hiddenInput) hiddenInput.value = value;
        if (selectedSpan) {
          selectedSpan.innerHTML = `${getLevelSvg(parseInt(value))}${getLevelLabel(parseInt(value))}`;
        }
      });
    });
  }, 0);

  return form;
}

/**
 * Create quick add task component
 */
export function createQuickAddTask(): HTMLElement {
  const container = document.createElement("div");
  container.className = "card p-3";

  container.innerHTML = `
    <h5 class="mb-3">Quick Add Task</h5>
    <form id="quick-add-form" class="row g-2 align-items-end">
      <div class="col-md-5">
        <label for="quick-task-name" class="form-label mb-1">Task Name</label>
        <input type="text" class="form-control" id="quick-task-name" name="title" placeholder="Get pomegranates" required>
      </div>
      <div class="col-md-3">
        <label for="quick-importance-dropdown" class="form-label mb-1">Importance</label>
        <input type="hidden" id="quick-importance" name="importance" value="2">
        <div class="dropdown w-100">
          <button class="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center" type="button" id="quick-importance-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <span id="quick-importance-selected">${getLevelSvg(2)}${getLevelLabel(2)}</span>
            <span>▼</span>
          </button>
          <ul class="dropdown-menu w-100" aria-labelledby="quick-importance-dropdown">
            <li><a class="dropdown-item quick-importance-option" href="#" data-value="1">${getLevelSvg(1)}Low</a></li>
            <li><a class="dropdown-item quick-importance-option" href="#" data-value="2">${getLevelSvg(2)}Medium</a></li>
            <li><a class="dropdown-item quick-importance-option" href="#" data-value="3">${getLevelSvg(3)}High</a></li>
            <li><a class="dropdown-item quick-importance-option" href="#" data-value="4">${getLevelSvg(4)}Critical</a></li>
          </ul>
        </div>
      </div>
      <div class="col-md-3">
        <label for="quick-urgency-dropdown" class="form-label mb-1">Urgency</label>
        <input type="hidden" id="quick-urgency" name="urgency" value="2">
        <div class="dropdown w-100">
          <button class="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center" type="button" id="quick-urgency-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <span id="quick-urgency-selected">${getLevelSvg(2)}${getLevelLabel(2)}</span>
            <span>▼</span>
          </button>
          <ul class="dropdown-menu w-100" aria-labelledby="quick-urgency-dropdown">
            <li><a class="dropdown-item quick-urgency-option" href="#" data-value="1">${getLevelSvg(1)}Low</a></li>
            <li><a class="dropdown-item quick-urgency-option" href="#" data-value="2">${getLevelSvg(2)}Medium</a></li>
            <li><a class="dropdown-item quick-urgency-option" href="#" data-value="3">${getLevelSvg(3)}High</a></li>
            <li><a class="dropdown-item quick-urgency-option" href="#" data-value="4">${getLevelSvg(4)}Critical</a></li>
          </ul>
        </div>
      </div>
      <div class="col-md-1">
        <button type="submit" class="btn btn-primary w-100">
          <i class="bi bi-plus-circle"></i> Add
        </button>
      </div>
    </form>
  `;

  // Add event listeners for dropdown selections
  setTimeout(() => {
    const importanceOptions = container.querySelectorAll(".quick-importance-option");
    const urgencyOptions = container.querySelectorAll(".quick-urgency-option");

    importanceOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const value = (e.currentTarget as HTMLElement).dataset["value"] || "2";
        const hiddenInput = container.querySelector(
          "#quick-importance"
        ) as HTMLInputElement;
        const selectedSpan = container.querySelector(
          "#quick-importance-selected"
        ) as HTMLElement;
        if (hiddenInput) hiddenInput.value = value;
        if (selectedSpan) {
          selectedSpan.innerHTML = `${getLevelSvg(parseInt(value))}${getLevelLabel(parseInt(value))}`;
        }
      });
    });

    urgencyOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const value = (e.currentTarget as HTMLElement).dataset["value"] || "2";
        const hiddenInput = container.querySelector(
          "#quick-urgency"
        ) as HTMLInputElement;
        const selectedSpan = container.querySelector(
          "#quick-urgency-selected"
        ) as HTMLElement;
        if (hiddenInput) hiddenInput.value = value;
        if (selectedSpan) {
          selectedSpan.innerHTML = `${getLevelSvg(parseInt(value))}${getLevelLabel(parseInt(value))}`;
        }
      });
    });
  }, 0);

  return container;
}

/**
 * Create todos table component
 */
export function createTodosTable(todos: Todo[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "card p-4";

  if (todos.length === 0) {
    container.innerHTML = `
      <h3 class="mb-3">Your Todos</h3>
      <p class="text-muted">No todos yet. Create your first todo above!</p>
    `;
    return container;
  }

  const tableHtml = `
    <h3 class="mb-3">Your Todos (sorted by priority)</h3>
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th style="text-align: center;">Importance</th>
            <th style="text-align: center;">Urgency</th>
            <th style="text-align: center;">Priority</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${todos
            .map(
              (todo) => `
            <tr data-todo-id="${todo.id}">
              <td><strong>${escapeHtml(todo.title)}</strong></td>
              <td>${todo.description ? escapeHtml(todo.description) : "<em>No description</em>"}</td>
              <td style="text-align: center;" title="${todo.importance_label}">
                <span style="font-size: 1.3em;">${todo.importance_icon}</span>
                <br><small class="text-muted">${todo.importance_label}</small>
              </td>
              <td style="text-align: center;" title="${todo.urgency_label}">
                <span style="font-size: 1.3em;">${todo.urgency_icon}</span>
                <br><small class="text-muted">${todo.urgency_label}</small>
              </td>
              <td style="text-align: center;">
                <strong>${todo.priority_score.toFixed(1)}</strong>
              </td>
              <td>
                <span class="badge bg-${getStatusColor(todo.status)}">
                  ${todo.status}
                </span>
              </td>
              <td>${formatDate(todo.created_at)}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary edit-todo" data-todo-id="${todo.id}">
                  Edit
                </button>
                <button class="btn btn-sm btn-outline-danger delete-todo" data-todo-id="${todo.id}">
                  Delete
                </button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHtml;
  return container;
}

/**
 * Show error message
 */
export function showError(message: string): void {
  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-danger alert-dismissible fade show";
  alertDiv.innerHTML = `
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  const container = document.getElementById("app");
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
  }
}

/**
 * Show success message
 */
export function showSuccess(message: string): void {
  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-success alert-dismissible fade show";
  alertDiv.innerHTML = `
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  const container = document.getElementById("app");
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => alertDiv.remove(), 3000);
  }
}

// Helper functions

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "secondary";
    case "in_progress":
      return "info";
    case "completed":
      return "success";
    default:
      return "secondary";
  }
}
