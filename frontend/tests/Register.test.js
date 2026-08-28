/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import { mountWithPlugins } from "./testUtils.js";

const registerUser = vi.hoisted(() => vi.fn());

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser,
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

async function fieldByLabel(wrapper, label) {
  const fields = wrapper.findAllComponents({ name: "VTextField" });
  return fields.find((field) => field.props("label") === label);
}

async function setField(wrapper, label, value) {
  const field = await fieldByLabel(wrapper, label);
  const input = field.find("input");
  await input.setValue(value);
}

async function submitRegister(wrapper) {
  await wrapper.find("form").trigger("submit.prevent");
  await flushPromises();
}

async function mountRegister() {
  return mountWithPlugins(Register, { attachTo: document.body });
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    registerUser.mockReset();
    localStorage.clear();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountRegister();

      await setField(wrapper, "First name", "Jane");
      await setField(wrapper, "Last name", "Doe");
      await setField(wrapper, "Email", "notanemail");
      await setField(wrapper, "Username", "jdoe");
      await setField(wrapper, "Password", "password1");
      await setField(wrapper, "Confirm password", "password1");
      await submitRegister(wrapper);

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(registerUser).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountRegister();

      await setField(wrapper, "First name", "Jane");
      await setField(wrapper, "Last name", "Doe");
      await setField(wrapper, "Email", "jdoe@example.com");
      await setField(wrapper, "Password", "password1");
      await setField(wrapper, "Confirm password", "password1");
      await submitRegister(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(registerUser).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountRegister();

      await setField(wrapper, "First name", "Jane");
      await setField(wrapper, "Last name", "Doe");
      await setField(wrapper, "Email", "jdoe@example.com");
      await setField(wrapper, "Username", "jdoe");
      await setField(wrapper, "Password", "short");
      await setField(wrapper, "Confirm password", "short");
      await submitRegister(wrapper);

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(registerUser).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountRegister();

      await setField(wrapper, "First name", "Jane");
      await setField(wrapper, "Last name", "Doe");
      await setField(wrapper, "Email", "jdoe@example.com");
      await setField(wrapper, "Username", "jdoe");
      await setField(wrapper, "Password", "password1");
      await setField(wrapper, "Confirm password", "password2");
      await submitRegister(wrapper);

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(registerUser).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });
});
