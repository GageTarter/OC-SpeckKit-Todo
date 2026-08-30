import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import Utils from "./config/utils.js";

const publicRouteNames = new Set(["login", "register"]);

export const routes = [
  {
    path: "/",
    name: "home",
      component: Dashboard,
  },
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { public: true },
  },
  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { public: true },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "home" },
  },
];

export function authGuard(to) {
  const user = Utils.getStore("user");
  const hasSession = Boolean(user?.token);
  const isPublic = publicRouteNames.has(to.name);

  if (!hasSession && !isPublic) {
    return { name: "login" };
  }

  if (hasSession && to.name === "login") {
    return { name: "home" };
  }

  return true;
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(authGuard);

export default router;
