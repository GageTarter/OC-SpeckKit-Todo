<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user"));
const displayName = computed(() => {
  const current = user.value;
  if (!current) {
    return "";
  }

  const fullName = [current.fName, current.lName].filter(Boolean).join(" ");
  return fullName || current.username || "";
});

async function signOut() {
  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    await router.push({ name: "login" });
  }
}
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <span class="me-4">{{ displayName }}</span>
    <v-btn variant="text" class="oc-cta" @click="signOut">Sign out</v-btn>
  </v-app-bar>
</template>
