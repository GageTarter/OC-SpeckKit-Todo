<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const error = ref("");
const username = ref("");
const password = ref("");

const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [(value) => !!value?.trim() || "Password is required."];

const canSubmit = computed(() => !loading.value);

async function onSubmit() {
  error.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await AuthServices.loginUser({
      username: username.value.trim(),
      password: password.value,
    });
    Utils.setStore("user", res.data);
    await router.push({ name: "home" });
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to sign in.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5">Sign in</v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
            <v-form ref="form" @submit.prevent="onSubmit">
              <v-text-field
                v-model="username"
                label="Username"
                autocomplete="username"
                :rules="usernameRules"
                class="mb-2"
              />
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                autocomplete="current-password"
                :rules="passwordRules"
                class="mb-2"
              />
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                class="oc-cta"
                :loading="loading"
                :disabled="!canSubmit"
                block
              >
                Sign in
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="justify-center">
            <router-link :to="{ name: 'register' }">Create an account</router-link>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
