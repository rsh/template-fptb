/**
 * Tests for UI components
 */

import {
  createLoginForm,
  createRegisterForm,
  createItemForm,
  createItemsTable,
  createCategoryForm,
  showError,
  showSuccess,
} from "../components";
import type { Category, Item } from "../api";

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

  describe("createItemForm", () => {
    const mockCategories: Category[] = [
      { id: 1, name: "Tech", description: "Technology", created_at: "2024-01-01" },
      { id: 2, name: "Books", description: "Books", created_at: "2024-01-01" },
    ];

    it("creates an empty form for new items", () => {
      const form = createItemForm(mockCategories);
      expect(form.tagName).toBe("FORM");
      expect(form.querySelector("#item-title")).toBeTruthy();
      expect(form.querySelector("#item-description")).toBeTruthy();
      expect(form.querySelector("#item-category")).toBeTruthy();
      expect(form.querySelector("#item-status")).toBeTruthy();
      expect(form.textContent).toContain("Create New Item");
    });

    it("populates form with existing item data", () => {
      const mockItem: Item = {
        id: 1,
        title: "Test Item",
        description: "Test description",
        category: mockCategories[0],
        status: "active",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        owner: null,
      };

      const form = createItemForm(mockCategories, mockItem);
      const titleInput = form.querySelector("#item-title") as HTMLInputElement;
      const descriptionInput = form.querySelector(
        "#item-description"
      ) as HTMLTextAreaElement;
      const statusSelect = form.querySelector("#item-status") as HTMLSelectElement;

      expect(titleInput.value).toBe("Test Item");
      expect(descriptionInput.value).toBe("Test description");
      expect(statusSelect.value).toBe("active");
      expect(form.textContent).toContain("Edit Item");
      expect(form.querySelector("#cancel-edit")).toBeTruthy();
    });

    it("includes all categories as options", () => {
      const form = createItemForm(mockCategories);
      const categorySelect = form.querySelector("#item-category") as HTMLSelectElement;
      const options = Array.from(categorySelect.options);

      expect(options.length).toBe(3); // "No category" + 2 categories
      expect(options[1].value).toBe("1");
      expect(options[1].textContent).toContain("Tech");
      expect(options[2].value).toBe("2");
      expect(options[2].textContent).toContain("Books");
    });
  });

  describe("createItemsTable", () => {
    it("shows empty state when no items", () => {
      const table = createItemsTable([]);
      expect(table.textContent).toContain("No items yet");
    });

    it("creates table with items", () => {
      const mockItems: Item[] = [
        {
          id: 1,
          title: "Item 1",
          description: "Description 1",
          category: { id: 1, name: "Tech", description: "", created_at: "2024-01-01" },
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          owner: null,
        },
        {
          id: 2,
          title: "Item 2",
          description: null,
          category: null,
          status: "inactive",
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
          owner: null,
        },
      ];

      const table = createItemsTable(mockItems);
      expect(table.querySelector("table")).toBeTruthy();
      expect(table.textContent).toContain("Item 1");
      expect(table.textContent).toContain("Item 2");
      expect(table.textContent).toContain("Tech");
      expect(table.textContent).toContain("No description");
      expect(table.textContent).toContain("None"); // No category for item 2
    });

    it("includes edit and delete buttons for each item", () => {
      const mockItems: Item[] = [
        {
          id: 1,
          title: "Item 1",
          description: "Description 1",
          category: null,
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          owner: null,
        },
      ];

      const table = createItemsTable(mockItems);
      const editButton = table.querySelector(".edit-item") as HTMLButtonElement;
      const deleteButton = table.querySelector(".delete-item") as HTMLButtonElement;

      expect(editButton).toBeTruthy();
      expect(deleteButton).toBeTruthy();
      expect(editButton.dataset.itemId).toBe("1");
      expect(deleteButton.dataset.itemId).toBe("1");
    });

    it("escapes HTML in item data", () => {
      const mockItems: Item[] = [
        {
          id: 1,
          title: "<script>alert('xss')</script>",
          description: "<b>Bold</b>",
          category: {
            id: 1,
            name: "<em>Cat</em>",
            description: "",
            created_at: "2024-01-01",
          },
          status: "active",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          owner: null,
        },
      ];

      const table = createItemsTable(mockItems);
      const html = table.innerHTML;

      // HTML should be escaped
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("&lt;b&gt;");
      expect(html).toContain("&lt;em&gt;");
    });
  });

  describe("createCategoryForm", () => {
    it("creates a category form with name and description fields", () => {
      const form = createCategoryForm();
      expect(form.tagName).toBe("FORM");
      expect(form.querySelector("#category-name")).toBeTruthy();
      expect(form.querySelector("#category-description")).toBeTruthy();
      expect(form.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it("has required attribute on name field", () => {
      const form = createCategoryForm();
      const nameInput = form.querySelector("#category-name") as HTMLInputElement;
      expect(nameInput.required).toBe(true);
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
