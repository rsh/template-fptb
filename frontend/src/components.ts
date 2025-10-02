/**
 * Reusable UI components
 */

import type { Category, Item } from "./api";

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
 * Create item form component
 */
export function createItemForm(categories: Category[], item?: Item): HTMLElement {
  const form = document.createElement("form");
  form.className = "card p-4 mb-4";

  const categoryOptions = categories
    .map(
      (cat) =>
        `<option value="${cat.id}" ${item?.category?.id === cat.id ? "selected" : ""}>
          ${cat.name}
        </option>`
    )
    .join("");

  form.innerHTML = `
    <h3 class="mb-3">${item ? "Edit Item" : "Create New Item"}</h3>
    <div class="mb-3">
      <label for="item-title" class="form-label">Title</label>
      <input type="text" class="form-control" id="item-title" name="title"
             value="${item?.title || ""}" required>
    </div>
    <div class="mb-3">
      <label for="item-description" class="form-label">Description</label>
      <textarea class="form-control" id="item-description" name="description" rows="3">${item?.description || ""}</textarea>
    </div>
    <div class="mb-3">
      <label for="item-category" class="form-label">Category</label>
      <select class="form-select" id="item-category" name="category_id">
        <option value="">No category</option>
        ${categoryOptions}
      </select>
    </div>
    <div class="mb-3">
      <label for="item-status" class="form-label">Status</label>
      <select class="form-select" id="item-status" name="status">
        <option value="active" ${item?.status === "active" ? "selected" : ""}>Active</option>
        <option value="inactive" ${item?.status === "inactive" ? "selected" : ""}>Inactive</option>
        <option value="archived" ${item?.status === "archived" ? "selected" : ""}>Archived</option>
      </select>
    </div>
    <div class="d-flex gap-2">
      <button type="submit" class="btn btn-primary">
        ${item ? "Update" : "Create"} Item
      </button>
      ${item ? '<button type="button" class="btn btn-secondary" id="cancel-edit">Cancel</button>' : ""}
    </div>
  `;
  return form;
}

/**
 * Create items table component
 */
export function createItemsTable(items: Item[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "card p-4";

  if (items.length === 0) {
    container.innerHTML = `
      <h3 class="mb-3">Your Items</h3>
      <p class="text-muted">No items yet. Create your first item above!</p>
    `;
    return container;
  }

  const tableHtml = `
    <h3 class="mb-3">Your Items</h3>
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Category</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr data-item-id="${item.id}">
              <td><strong>${escapeHtml(item.title)}</strong></td>
              <td>${item.description ? escapeHtml(item.description) : "<em>No description</em>"}</td>
              <td>${item.category ? escapeHtml(item.category.name) : "<em>None</em>"}</td>
              <td>
                <span class="badge bg-${getStatusColor(item.status)}">
                  ${item.status}
                </span>
              </td>
              <td>${formatDate(item.created_at)}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary edit-item" data-item-id="${item.id}">
                  Edit
                </button>
                <button class="btn btn-sm btn-outline-danger delete-item" data-item-id="${item.id}">
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
 * Create category form component
 */
export function createCategoryForm(): HTMLElement {
  const form = document.createElement("form");
  form.className = "card p-4 mb-4";
  form.innerHTML = `
    <h3 class="mb-3">Create New Category</h3>
    <div class="mb-3">
      <label for="category-name" class="form-label">Name</label>
      <input type="text" class="form-control" id="category-name" name="name" required>
    </div>
    <div class="mb-3">
      <label for="category-description" class="form-label">Description</label>
      <textarea class="form-control" id="category-description" name="description" rows="2"></textarea>
    </div>
    <button type="submit" class="btn btn-primary">Create Category</button>
  `;
  return form;
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
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "archived":
      return "secondary";
    default:
      return "secondary";
  }
}
