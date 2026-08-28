/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

const loginUser = vi.hoisted(() => vi.fn());

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser,
    registerUser: vi.fn(),
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

async function submitLogin(wrapper) {
  await wrapper.find("form").trigger("submit.prevent");
  await flushPromises();
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    loginUser.mockReset();
    localStorage.clear();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      loginUser.mockRejectedValue({
        response: {
          status: 401,
          data: { message: "Invalid username or password." },
        },
      });

      const router = await createTestRouter("/login");
      const { wrapper } = await mountWithPlugins(Login, {
        router,
        attachTo: document.body,
      });

      await setField(wrapper, "Username", "jdoe");
      await setField(wrapper, "Password", "wrongpass");
      await submitLogin(wrapper);

      expect(loginUser).toHaveBeenCalled();
      expect(wrapper.findComponent({ name: "VAlert" }).exists()).toBe(true);
      expect(wrapper.text()).toContain("Invalid username or password.");
      expect(wrapper.vm.$router.currentRoute.value.name).toBe("login");
      wrapper.unmount();
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login, { attachTo: document.body });

      await setField(wrapper, "Password", "password1");
      await submitLogin(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(loginUser).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login, { attachTo: document.body });

      await setField(wrapper, "Username", "jdoe");
      await submitLogin(wrapper);

      expect(wrapper.text()).toContain("Password is required.");
      expect(loginUser).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });
});
