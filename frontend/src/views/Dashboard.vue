<script setup>
import { computed, onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";

const lists = ref([]);
const loading = ref(false);
const error = ref("");

const addOpen = ref(false);
const renameOpen = ref(false);
const deleteOpen = ref(false);
const addForm = ref(null);
const renameForm = ref(null);
const newName = ref("");
const renameName = ref("");
const activeList = ref(null);

const nameRules = [(value) => !!value?.trim() || "List name is required."];

const isEmpty = computed(() => !loading.value && lists.value.length === 0);

function sortLists(rows) {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

async function loadLists() {
  loading.value = true;
  error.value = "";
  try {
    const res = await ListServices.getAll();
    lists.value = sortLists(res.data || []);
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load lists.";
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  newName.value = "";
  error.value = "";
  addOpen.value = true;
}

async function createList() {
  const { valid } = await addForm.value.validate();
  if (!valid) {
    return;
  }

  error.value = "";
  try {
    const res = await ListServices.create({ name: newName.value.trim() });
    lists.value = sortLists([...lists.value, res.data]);
    addOpen.value = false;
    newName.value = "";
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to create list.";
  }
}

function openRename(list) {
  activeList.value = list;
  renameName.value = list.name;
  error.value = "";
  renameOpen.value = true;
}

async function saveRename() {
  const { valid } = await renameForm.value.validate();
  if (!valid) {
    return;
  }

  error.value = "";
  try {
    const res = await ListServices.update(activeList.value.id, {
      name: renameName.value.trim(),
    });
    lists.value = sortLists(
      lists.value.map((list) => (list.id === res.data.id ? res.data : list))
    );
    renameOpen.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to rename list.";
  }
}

function openDelete(list) {
  activeList.value = list;
  error.value = "";
  deleteOpen.value = true;
}

async function confirmDelete() {
  error.value = "";
  try {
    await ListServices.remove(activeList.value.id);
    lists.value = lists.value.filter((list) => list.id !== activeList.value.id);
    deleteOpen.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to delete list.";
  }
}

onMounted(loadLists);
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">My Lists</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAdd">
          + New List
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-skeleton-loader v-if="loading" type="list-item-two-line@3" />

    <p v-else-if="isEmpty" class="text-body-1">No lists yet. Create your first list.</p>

    <v-list v-else>
      <v-list-item v-for="list in lists" :key="list.id">
        <v-list-item-title>{{ list.name }}</v-list-item-title>
        <template #append>
          <v-btn
            icon
            size="small"
            aria-label="Edit list"
            variant="text"
            @click="openRename(list)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            aria-label="Delete list"
            variant="text"
            @click="openDelete(list)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="addOpen" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>New List</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-form ref="addForm">
            <v-text-field v-model="newName" label="List name" :rules="nameRules" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" @click="createList">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameOpen" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>Rename List</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-form ref="renameForm">
            <v-text-field v-model="renameName" label="List name" :rules="nameRules" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="renameOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" @click="saveRename">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>Delete List</v-card-title>
        </v-card-item>
        <v-card-text>
          Delete {{ activeList?.name }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
