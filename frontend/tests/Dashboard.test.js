/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import { mountWithPlugins } from "./testUtils.js";

const getAll = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());

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

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    getAll.mockReset();
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    getAll.mockResolvedValue({ data: [] });
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
