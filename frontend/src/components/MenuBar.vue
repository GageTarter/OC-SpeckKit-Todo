<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import UserServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const menuOpen = ref(false);
const editOpen = ref(false);
const editForm = ref(null);
const saving = ref(false);
const error = ref("");
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const firstNameRules = [(value) => !!value?.trim() || "First name is required."];
const lastNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = computed(() => [
  (value) => value === password.value || "Passwords do not match.",
]);

const fullName = computed(() => {
  const current = user.value;
  if (!current) {
    return "";
  }
  return [current.fName, current.lName].filter(Boolean).join(" ");
});

function refreshUser() {
  user.value = Utils.getStore("user");
}

function fillForm(profile) {
  fName.value = profile?.fName || "";
  lName.value = profile?.lName || "";
  email.value = profile?.email || "";
  username.value = profile?.username || "";
  password.value = "";
  confirmPassword.value = "";
}

async function openEdit() {
  error.value = "";
  fillForm(user.value);
  editOpen.value = true;
  menuOpen.value = false;

  try {
    const res = await UserServices.getUser(user.value.userId);
    fillForm(res.data);
  } catch {
    fillForm(user.value);
  }
}

async function saveProfile() {
  error.value = "";
  const { valid } = await editForm.value.validate();
  if (!valid) {
    return;
  }

  const payload = {
    fName: fName.value.trim(),
    lName: lName.value.trim(),
    email: email.value.trim(),
    username: username.value.trim(),
  };

  if (password.value) {
    payload.password = password.value;
  }

  saving.value = true;
  try {
    const res = await UserServices.updateUser(user.value.userId, payload);
    const current = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...current,
      userId: res.data.id,
      fName: res.data.fName,
      lName: res.data.lName,
      email: res.data.email,
      username: res.data.username,
      role: res.data.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    refreshUser();
    editOpen.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to update profile.";
  } finally {
    saving.value = false;
  }
}

function cancelEdit() {
  editOpen.value = false;
  error.value = "";
}

async function logOut() {
  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    await router.push({ name: "login" });
  }
}

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <v-menu v-model="menuOpen">
      <template #activator="{ props }">
        <v-btn icon v-bind="props" aria-label="Open profile menu" variant="text">
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item :title="fullName">
          <v-list-item-subtitle>{{ user?.username }}</v-list-item-subtitle>
          <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <v-btn color="primary" class="oc-cta" @click="openEdit">Edit Profile</v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn variant="text" @click="logOut">Log out</v-btn>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editOpen" max-width="480">
    <v-card>
      <v-card-item>
        <v-card-title>Edit Profile</v-card-title>
      </v-card-item>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        <v-form ref="editForm">
          <v-text-field v-model="fName" label="First name" :rules="firstNameRules" class="mb-2" />
          <v-text-field v-model="lName" label="Last name" :rules="lastNameRules" class="mb-2" />
          <v-text-field v-model="email" label="Email" type="email" :rules="emailRules" class="mb-2" />
          <v-text-field v-model="username" label="Username" :rules="usernameRules" class="mb-2" />
          <v-text-field
            v-model="password"
            label="New password"
            type="password"
            :rules="passwordRules"
            class="mb-2"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            :rules="confirmPasswordRules"
            class="mb-2"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="cancelEdit">Cancel</v-btn>
        <v-btn color="primary" class="oc-cta" :loading="saving" @click="saveProfile">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
