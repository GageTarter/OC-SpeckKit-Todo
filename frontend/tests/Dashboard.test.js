/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import { formatDueDate } from "../src/config/validation.js";
import { mountWithPlugins } from "./testUtils.js";

const getAll = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());
const getTodos = vi.hoisted(() => vi.fn());
const createTodo = vi.hoisted(() => vi.fn());
const updateTodo = vi.hoisted(() => vi.fn());
const removeTodo = vi.hoisted(() => vi.fn());

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getAll: getTodos,
    create: createTodo,
    update: updateTodo,
    remove: removeTodo,
  },
}));

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getAll,
    create,
    update,
    remove,
  },
}));

async function mountDashboard() {
  return mountWithPlugins(Dashboard, {
    attachTo: document.body,
    global: {
      stubs: {
        VDialog: {
          props: ["modelValue"],
          template: `<div v-if="modelValue"><slot /></div>`,
        },
      },
    },
  });
}

function fieldByLabel(wrapper, label) {
  return wrapper
    .findAllComponents({ name: "VTextField" })
    .find((field) => field.props("label") === label);
}

function buttonByText(wrapper, text) {
  return wrapper.findAll("button").find((btn) => btn.text().includes(text));
}

function buttonByLabel(wrapper, label) {
  return wrapper.find(`[aria-label="${label}"]`);
}

function buttonByExactText(wrapper, text) {
  return wrapper.findAll("button").find((btn) => btn.text().trim() === text);
}

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    getAll.mockReset();
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    getTodos.mockReset();
    createTodo.mockReset();
    updateTodo.mockReset();
    removeTodo.mockReset();
    getAll.mockResolvedValue({ data: [] });
    getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const created = { id: 1, name: "Groceries", userId: 1 };
      create.mockResolvedValue({ data: created, status: 201 });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      const newListBtn = buttonByText(wrapper, "New List");
      await newListBtn.trigger("click");
      await flushPromises();
      const nameField = fieldByLabel(wrapper, "List name");
      await nameField.find("input").setValue("Groceries");

      const createBtn = buttonByText(wrapper, "Create");
      await createBtn.trigger("click");
      await flushPromises();

      expect(create).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
      wrapper.unmount();
    });

    it("User creates a list with an empty name", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      const newListBtn = buttonByText(wrapper, "New List");
      await newListBtn.trigger("click");
      await flushPromises();
      const nameField = fieldByLabel(wrapper, "List name");
      await nameField.find("input").setValue("   ");

      const createBtn = buttonByText(wrapper, "Create");
      await createBtn.trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("List name is required.");
      expect(create).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      getAll.mockResolvedValue({
        data: [
          { id: 1, name: "Work", userId: 1 },
          { id: 2, name: "Personal", userId: 1 },
        ],
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.findAll('[aria-label="Edit list"]')).toHaveLength(2);
      expect(wrapper.findAll('[aria-label="Delete list"]')).toHaveLength(2);
      wrapper.unmount();
    });

    it("User has no lists", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
      wrapper.unmount();
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("Groceries");
      expect(buttonByLabel(wrapper, "Edit list").exists()).toBe(true);
      expect(buttonByLabel(wrapper, "Delete list").exists()).toBe(true);
      wrapper.unmount();
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      update.mockResolvedValue({
        data: { id: 1, name: "Shopping", userId: 1 },
        status: 200,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await buttonByLabel(wrapper, "Edit list").trigger("click");
      await flushPromises();
      const nameField = fieldByLabel(wrapper, "List name");
      await nameField.find("input").setValue("Shopping");
      const saveBtn = buttonByText(wrapper, "Save");
      await saveBtn.trigger("click");
      await flushPromises();

      expect(update).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
      wrapper.unmount();
    });

    it("User deletes a list", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      remove.mockResolvedValue({ status: 200 });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await buttonByLabel(wrapper, "Delete list").trigger("click");
      await flushPromises();
      const confirmBtn = buttonByText(wrapper, "Delete");
      await confirmBtn.trigger("click");
      await flushPromises();

      expect(remove).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Groceries");
      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
      wrapper.unmount();
    });
  });
});

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(() => {
    getAll.mockReset();
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    getTodos.mockReset();
    createTodo.mockReset();
    updateTodo.mockReset();
    removeTodo.mockReset();
    getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      createTodo.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          userId: 1,
        },
        status: 201,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();
      await buttonByText(wrapper, "Add Item").trigger("click");
      await flushPromises();
      await fieldByLabel(wrapper, "Todo title").find("input").setValue("Buy milk");
      await buttonByExactText(wrapper, "Add").trigger("click");
      await flushPromises();

      expect(createTodo).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(wrapper.text()).toContain("Buy milk");
      wrapper.unmount();
    });

    it("User adds a todo with an empty title", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();
      await buttonByText(wrapper, "Add Item").trigger("click");
      await flushPromises();
      await fieldByLabel(wrapper, "Todo title").find("input").setValue("");
      await buttonByExactText(wrapper, "Add").trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Todo title is required.");
      expect(createTodo).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("Add item is only available inside the items dialog", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).not.toContain("Add Item");
      wrapper.unmount();
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 2, name: "Personal", userId: 1 }],
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await buttonByLabel(wrapper, "View items for Personal").trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("No todos in this list yet.");
      wrapper.unmount();
    });

    it("User opens items for different lists", async () => {
      getAll.mockResolvedValue({
        data: [
          { id: 1, name: "Work", userId: 1 },
          { id: 2, name: "Personal", userId: 1 },
        ],
      });
      getTodos
        .mockResolvedValueOnce({
          data: [{ id: 11, title: "Call mom", completed: false, listId: 2 }],
        })
        .mockResolvedValueOnce({
          data: [
            { id: 12, title: "Email client", completed: false, listId: 1 },
            { id: 13, title: "Write report", completed: false, listId: 1 },
          ],
        });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await buttonByLabel(wrapper, "View items for Personal").trigger("click");
      await flushPromises();
      expect(wrapper.text()).toContain("Call mom");
      expect(wrapper.text()).not.toContain("Email client");

      await buttonByExactText(wrapper, "Close").trigger("click");
      await flushPromises();

      await buttonByLabel(wrapper, "View items for Work").trigger("click");
      await flushPromises();
      expect(wrapper.text()).toContain("Email client");
      expect(wrapper.text()).toContain("Write report");
      expect(wrapper.text()).not.toContain("Call mom");
      wrapper.unmount();
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodos.mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", completed: false, listId: 1 }],
      });
      updateTodo.mockResolvedValue({
        data: { id: 10, title: "Buy milk", completed: true, listId: 1 },
        status: 200,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();

      await wrapper.find('input[type="checkbox"]').setValue(true);
      await flushPromises();

      expect(updateTodo).toHaveBeenCalledWith(10, { completed: true });
      expect(wrapper.html()).toContain("text-decoration-line-through");
      wrapper.unmount();
    });

    it("User marks a completed todo as incomplete", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodos.mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", completed: true, listId: 1 }],
      });
      updateTodo.mockResolvedValue({
        data: { id: 10, title: "Buy milk", completed: false, listId: 1 },
        status: 200,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();

      await wrapper.find('input[type="checkbox"]').setValue(false);
      await flushPromises();

      expect(updateTodo).toHaveBeenCalledWith(10, { completed: false });
      wrapper.unmount();
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodos.mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", completed: false, listId: 1 }],
      });
      updateTodo.mockResolvedValue({
        data: { id: 10, title: "Buy oat milk", completed: false, listId: 1 },
        status: 200,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();

      await buttonByLabel(wrapper, "Edit todo").trigger("click");
      await flushPromises();
      await fieldByLabel(wrapper, "Todo title").find("input").setValue("Buy oat milk");
      await buttonByExactText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(wrapper.text()).toContain("Buy oat milk");
      wrapper.unmount();
    });

    it("User deletes a todo", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodos.mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", completed: false, listId: 1 }],
      });
      removeTodo.mockResolvedValue({ status: 200 });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();

      await buttonByLabel(wrapper, "Delete todo").trigger("click");
      await flushPromises();
      await buttonByExactText(wrapper, "Delete").trigger("click");
      await flushPromises();

      expect(removeTodo).toHaveBeenCalledWith(10);
      expect(wrapper.text()).not.toContain("Buy milk");
      wrapper.unmount();
    });
  });
});

function localYmdDaysAgo(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("Feature 5 — Todo Due Date", () => {
  beforeEach(() => {
    getAll.mockReset();
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    getTodos.mockReset();
    createTodo.mockReset();
    updateTodo.mockReset();
    removeTodo.mockReset();
    getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      createTodo.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          dueDate: "2026-07-15",
          userId: 1,
        },
        status: 201,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();
      await buttonByText(wrapper, "Add Item").trigger("click");
      await flushPromises();
      await fieldByLabel(wrapper, "Todo title").find("input").setValue("Buy milk");
      await fieldByLabel(wrapper, "Due date").find("input").setValue("2026-07-15");
      await buttonByExactText(wrapper, "Add").trigger("click");
      await flushPromises();

      expect(createTodo).toHaveBeenCalledWith(1, {
        title: "Buy milk",
        dueDate: "2026-07-15",
      });
      expect(wrapper.text()).toContain("Buy milk");
      expect(wrapper.text()).toContain(formatDueDate("2026-07-15"));
      wrapper.unmount();
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodos.mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", completed: false, listId: 1, dueDate: null }],
      });
      updateTodo.mockResolvedValue({
        data: {
          id: 10,
          title: "Buy milk",
          completed: false,
          listId: 1,
          dueDate: "2026-07-20",
        },
        status: 200,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();

      await buttonByLabel(wrapper, "Edit todo").trigger("click");
      await flushPromises();
      await fieldByLabel(wrapper, "Due date").find("input").setValue("2026-07-20");
      await buttonByExactText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(wrapper.text()).toContain(formatDueDate("2026-07-20"));
      wrapper.unmount();
    });

    it("User clears a due date when editing a todo", async () => {
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodos.mockResolvedValue({
        data: [
          {
            id: 10,
            title: "Buy milk",
            completed: false,
            listId: 1,
            dueDate: "2026-07-20",
          },
        ],
      });
      updateTodo.mockResolvedValue({
        data: {
          id: 10,
          title: "Buy milk",
          completed: false,
          listId: 1,
          dueDate: null,
        },
        status: 200,
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain(formatDueDate("2026-07-20"));

      await buttonByLabel(wrapper, "Edit todo").trigger("click");
      await flushPromises();
      await fieldByLabel(wrapper, "Due date").find("input").setValue("");
      await buttonByExactText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: null,
      });
      expect(wrapper.text()).not.toContain(formatDueDate("2026-07-20"));
      wrapper.unmount();
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      const yesterday = localYmdDaysAgo(1);
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodos.mockResolvedValue({
        data: [
          {
            id: 10,
            title: "Buy milk",
            completed: false,
            listId: 1,
            dueDate: yesterday,
          },
        ],
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain(formatDueDate(yesterday));
      expect(wrapper.find(".text-error").exists()).toBe(true);
      wrapper.unmount();
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      const yesterday = localYmdDaysAgo(1);
      getAll.mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      getTodos.mockResolvedValue({
        data: [
          {
            id: 10,
            title: "Buy milk",
            completed: true,
            listId: 1,
            dueDate: yesterday,
          },
        ],
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await buttonByLabel(wrapper, "View items for Groceries").trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain(formatDueDate(yesterday));
      expect(wrapper.find(".text-error").exists()).toBe(false);
      wrapper.unmount();
    });
  });
});
