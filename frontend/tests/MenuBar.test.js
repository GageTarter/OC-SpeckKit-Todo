/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import { defineComponent } from "vue";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

const getUser = vi.hoisted(() => vi.fn());
const updateUser = vi.hoisted(() => vi.fn());
const logoutUser = vi.hoisted(() => vi.fn());

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser,
    updateUser,
  },
}));

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser,
    loginUser: vi.fn(),
    registerUser: vi.fn(),
  },
}));

const session = {
  userId: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  role: "worker",
  token: "valid-token",
};

const MenuBarHarness = defineComponent({
  components: { MenuBar },
  template: `<v-app><MenuBar /></v-app>`,
});

async function mountMenuBar() {
  return mountWithPlugins(MenuBarHarness, {
    attachTo: document.body,
    global: {
      stubs: {
        VMenu: {
          props: ["modelValue"],
          emits: ["update:modelValue"],
          template: `
            <div>
              <span @click="$emit('update:modelValue', true)">
                <slot name="activator" :props="{}" />
              </span>
              <div v-if="modelValue" class="profile-dropdown">
                <slot />
              </div>
            </div>
          `,
        },
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

async function openProfileMenu(wrapper) {
  await wrapper.find('[aria-label="Open profile menu"]').trigger("click");
  await flushPromises();
}

async function openEditDialog(wrapper) {
  await openProfileMenu(wrapper);
  await buttonByText(wrapper, "Edit Profile").trigger("click");
  await flushPromises();
}

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    getUser.mockReset();
    updateUser.mockReset();
    logoutUser.mockReset();
    localStorage.clear();
    Utils.setStore("user", { ...session });
    getUser.mockResolvedValue({
      data: {
        id: 1,
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
        role: "worker",
      },
    });
    logoutUser.mockResolvedValue({ status: 200 });
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const { wrapper } = await mountMenuBar();
      await openProfileMenu(wrapper);

      expect(wrapper.text()).toContain("Jane Doe");
      expect(wrapper.text()).toContain("jdoe");
      expect(wrapper.text()).toContain("jdoe@example.com");
      expect(wrapper.text()).toContain("Edit Profile");
      expect(wrapper.text()).toContain("Log out");
      wrapper.unmount();
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      expect(wrapper.text()).toContain("Edit Profile");
      expect(fieldByLabel(wrapper, "First name").find("input").element.value).toBe("Jane");
      expect(fieldByLabel(wrapper, "Last name").find("input").element.value).toBe("Doe");
      expect(fieldByLabel(wrapper, "Email").find("input").element.value).toBe("jdoe@example.com");
      expect(fieldByLabel(wrapper, "Username").find("input").element.value).toBe("jdoe");
      wrapper.unmount();
    });

    it("User cancels the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      await fieldByLabel(wrapper, "First name").find("input").setValue("Janet");
      await buttonByText(wrapper, "Cancel").trigger("click");
      await flushPromises();

      expect(updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
      expect(wrapper.text()).not.toContain("First name");
      wrapper.unmount();
    });

    it("User saves profile changes", async () => {
      updateUser.mockResolvedValue({
        data: {
          id: 1,
          fName: "Janet",
          lName: "Smith",
          email: "janet@example.com",
          username: "jsmith",
          role: "worker",
        },
        status: 200,
      });

      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      await fieldByLabel(wrapper, "First name").find("input").setValue("Janet");
      await fieldByLabel(wrapper, "Last name").find("input").setValue("Smith");
      await fieldByLabel(wrapper, "Email").find("input").setValue("janet@example.com");
      await fieldByLabel(wrapper, "Username").find("input").setValue("jsmith");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(updateUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toMatchObject({
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
        token: "valid-token",
      });

      await openProfileMenu(wrapper);
      expect(wrapper.text()).toContain("Janet Smith");
      expect(wrapper.text()).toContain("jsmith");
      expect(wrapper.text()).toContain("janet@example.com");
      wrapper.unmount();
    });

    it("User saves profile with invalid email format", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      await fieldByLabel(wrapper, "Email").find("input").setValue("notanemail");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(updateUser).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("User saves profile with mismatched passwords", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      await fieldByLabel(wrapper, "New password").find("input").setValue("password1");
      await fieldByLabel(wrapper, "Confirm password").find("input").setValue("password2");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(updateUser).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("User saves profile with a password that is too short", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);

      await fieldByLabel(wrapper, "New password").find("input").setValue("short");
      await fieldByLabel(wrapper, "Confirm password").find("input").setValue("short");
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(updateUser).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("Profile update API returns an error", async () => {
      updateUser.mockRejectedValue({
        response: { status: 400, data: { message: "Username is already taken." } },
      });

      const { wrapper } = await mountMenuBar();
      await openEditDialog(wrapper);
      await buttonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(wrapper.findComponent({ name: "VAlert" }).exists()).toBe(true);
      expect(wrapper.text()).toContain("Username is already taken.");
      expect(wrapper.text()).toContain("Edit Profile");
      wrapper.unmount();
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      const { wrapper, router } = await mountMenuBar();
      await openProfileMenu(wrapper);

      await buttonByText(wrapper, "Log out").trigger("click");
      await flushPromises();

      expect(logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
      wrapper.unmount();
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const { wrapper } = await mountMenuBar();
      await flushPromises();

      expect(wrapper.text()).not.toContain("Sign out");
      wrapper.unmount();
    });
  });
});
