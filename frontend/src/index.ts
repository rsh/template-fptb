/**
 * Main application entry point
 */

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

import { apiClient, type Category, type Item } from "./api";
import {
  getCurrentUser,
  initAuth,
  isAuthenticated,
  logout,
  setCurrentUser,
} from "./auth";
import {
  createCategoryForm,
  createItemForm,
  createItemsTable,
  createLoginForm,
  createRegisterForm,
  showError,
  showSuccess,
} from "./components";

// State
let categories: Category[] = [];
let items: Item[] = [];
let editingItem: Item | null = null;

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
        <span class="navbar-brand mb-0 h1">Web Application Template</span>
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
        <span class="navbar-brand mb-0 h1">Web Application Template</span>
        <div class="d-flex align-items-center gap-3">
          <span class="text-white">Welcome, ${user.username}!</span>
          <button class="btn btn-outline-light btn-sm" id="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
    <div class="container mt-4">
      <div class="row">
        <div class="col-md-4">
          <div id="category-form-container"></div>
        </div>
        <div class="col-md-8">
          <div id="item-form-container"></div>
          <div id="items-container"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("logout-btn")?.addEventListener("click", handleLogout);

  await loadData();
  renderForms();
  renderItems();
}

/**
 * Load categories and items from API
 */
async function loadData(): Promise<void> {
  try {
    [categories, items] = await Promise.all([
      apiClient.getCategories(),
      apiClient.getItems(),
    ]);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Failed to load data");
  }
}

/**
 * Render category and item forms
 */
function renderForms(): void {
  // Category form
  const categoryFormContainer = document.getElementById("category-form-container");
  if (categoryFormContainer) {
    categoryFormContainer.innerHTML = "";
    const categoryForm = createCategoryForm();
    categoryFormContainer.appendChild(categoryForm);
    setupCategoryForm(categoryForm);
  }

  // Item form
  const itemFormContainer = document.getElementById("item-form-container");
  if (itemFormContainer) {
    itemFormContainer.innerHTML = "";
    const itemForm = createItemForm(categories, editingItem || undefined);
    itemFormContainer.appendChild(itemForm);
    setupItemForm(itemForm);
  }
}

/**
 * Render items table
 */
function renderItems(): void {
  const itemsContainer = document.getElementById("items-container");
  if (!itemsContainer) return;

  itemsContainer.innerHTML = "";
  const itemsTable = createItemsTable(items);
  itemsContainer.appendChild(itemsTable);

  // Setup event handlers for edit/delete buttons
  itemsTable.querySelectorAll(".edit-item").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const itemId = parseInt((e.target as HTMLElement).dataset["itemId"] || "0");
      await handleEditItem(itemId);
    });
  });

  itemsTable.querySelectorAll(".delete-item").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const itemId = parseInt((e.target as HTMLElement).dataset["itemId"] || "0");
      await handleDeleteItem(itemId);
    });
  });
}

/**
 * Setup category form handler
 */
function setupCategoryForm(form: HTMLElement): void {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    try {
      const newCategory = await apiClient.createCategory({ name, description });
      categories.push(newCategory);
      showSuccess(`Category "${name}" created successfully`);
      (e.target as HTMLFormElement).reset();
      renderForms(); // Re-render to update category dropdown
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to create category");
    }
  });
}

/**
 * Setup item form handler
 */
function setupItemForm(form: HTMLElement): void {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const categoryIdStr = formData.get("category_id") as string;
    const status = formData.get("status") as "active" | "inactive" | "archived";

    const itemData: any = {
      title,
      status,
    };

    if (description) {
      itemData.description = description;
    }

    if (categoryIdStr) {
      itemData.category_id = parseInt(categoryIdStr);
    }

    try {
      if (editingItem) {
        const updated = await apiClient.updateItem(editingItem.id, itemData);
        const index = items.findIndex((i) => i.id === editingItem?.id);
        if (index !== -1) items[index] = updated;
        showSuccess("Item updated successfully");
        editingItem = null;
      } else {
        const newItem = await apiClient.createItem(itemData);
        items.unshift(newItem);
        showSuccess("Item created successfully");
      }
      renderForms();
      renderItems();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save item");
    }
  });

  // Cancel edit button
  const cancelBtn = form.querySelector("#cancel-edit");
  cancelBtn?.addEventListener("click", () => {
    editingItem = null;
    renderForms();
  });
}

/**
 * Handle edit item
 */
async function handleEditItem(itemId: number): Promise<void> {
  editingItem = items.find((i) => i.id === itemId) || null;
  renderForms();
}

/**
 * Handle delete item
 */
async function handleDeleteItem(itemId: number): Promise<void> {
  if (!confirm("Are you sure you want to delete this item?")) return;

  try {
    await apiClient.deleteItem(itemId);
    items = items.filter((i) => i.id !== itemId);
    showSuccess("Item deleted successfully");
    renderItems();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Failed to delete item");
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
