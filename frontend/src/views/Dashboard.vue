<script setup>
import { computed, onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";
import TodoServices from "../services/todoServices.js";
import {
  formatDueDate,
  isTodoOverdue,
  optionalDueDateRules,
  toDateInputValue,
} from "../config/validation.js";

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

const itemsOpen = ref(false);
const itemsLoading = ref(false);
const itemsError = ref("");
const todos = ref([]);
const addItemOpen = ref(false);
const editItemOpen = ref(false);
const deleteItemOpen = ref(false);
const addItemForm = ref(null);
const editItemForm = ref(null);
const newTitle = ref("");
const newDueDate = ref("");
const editTitle = ref("");
const editDueDate = ref("");
const activeTodo = ref(null);

const nameRules = [(value) => !!value?.trim() || "List name is required."];
const titleRules = [(value) => !!value?.trim() || "Todo title is required."];

const isEmpty = computed(() => !loading.value && lists.value.length === 0);
const todosEmpty = computed(() => !itemsLoading.value && todos.value.length === 0);

function sortLists(rows) {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

function sortTodos(rows) {
  return [...rows].sort((a, b) => {
    if (Boolean(a.completed) !== Boolean(b.completed)) {
      return a.completed ? 1 : -1;
    }
    return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
  });
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

async function loadTodos() {
  if (!activeList.value) {
    return;
  }

  itemsLoading.value = true;
  itemsError.value = "";
  try {
    const res = await TodoServices.getAll(activeList.value.id);
    todos.value = sortTodos(res.data || []);
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to load todos.";
    todos.value = [];
  } finally {
    itemsLoading.value = false;
  }
}

async function openItems(list) {
  activeList.value = list;
  itemsOpen.value = true;
  await loadTodos();
}

function closeItems() {
  itemsOpen.value = false;
  addItemOpen.value = false;
  editItemOpen.value = false;
  deleteItemOpen.value = false;
  todos.value = [];
}

function openAddItem() {
  newTitle.value = "";
  newDueDate.value = "";
  itemsError.value = "";
  addItemOpen.value = true;
}

async function createTodo() {
  const { valid } = await addItemForm.value.validate();
  if (!valid) {
    return;
  }

  itemsError.value = "";
  const payload = { title: newTitle.value.trim() };
  if (newDueDate.value) {
    payload.dueDate = newDueDate.value;
  }

  try {
    const res = await TodoServices.create(activeList.value.id, payload);
    todos.value = sortTodos([...todos.value, res.data]);
    addItemOpen.value = false;
    newTitle.value = "";
    newDueDate.value = "";
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to create todo.";
  }
}

async function toggleComplete(todo, completed) {
  itemsError.value = "";
  try {
    const res = await TodoServices.update(todo.id, { completed: Boolean(completed) });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === res.data.id ? res.data : item))
    );
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to update todo.";
  }
}

function openEditItem(todo) {
  activeTodo.value = todo;
  editTitle.value = todo.title;
  editDueDate.value = toDateInputValue(todo.dueDate);
  itemsError.value = "";
  editItemOpen.value = true;
}

async function saveTodoTitle() {
  const { valid } = await editItemForm.value.validate();
  if (!valid) {
    return;
  }

  itemsError.value = "";
  try {
    const res = await TodoServices.update(activeTodo.value.id, {
      title: editTitle.value.trim(),
      dueDate: editDueDate.value || null,
    });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === res.data.id ? res.data : item))
    );
    editItemOpen.value = false;
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to update todo.";
  }
}

function openDeleteItem(todo) {
  activeTodo.value = todo;
  itemsError.value = "";
  deleteItemOpen.value = true;
}

async function confirmDeleteItem() {
  itemsError.value = "";
  try {
    await TodoServices.remove(activeTodo.value.id);
    todos.value = todos.value.filter((item) => item.id !== activeTodo.value.id);
    deleteItemOpen.value = false;
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to delete todo.";
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
            :aria-label="`View items for ${list.name}`"
            variant="text"
            @click="openItems(list)"
          >
            <v-icon>mdi-format-list-checks</v-icon>
          </v-btn>
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

    <v-dialog v-model="itemsOpen" max-width="640">
      <v-card>
        <v-card-item>
          <v-card-title>{{ activeList?.name }} — Items</v-card-title>
          <template #append>
            <v-btn color="primary" class="oc-cta" @click="openAddItem">+ Add Item</v-btn>
          </template>
        </v-card-item>
        <v-card-text>
          <v-alert v-if="itemsError" type="error" class="mb-4">{{ itemsError }}</v-alert>
          <v-skeleton-loader v-if="itemsLoading" type="list-item@3" />
          <p v-else-if="todosEmpty" class="text-body-1">No todos in this list yet.</p>
          <v-list v-else>
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  hide-details
                  density="compact"
                  :aria-label="`Toggle ${todo.title}`"
                  @update:model-value="(value) => toggleComplete(todo, value)"
                />
              </template>
              <v-list-item-title :class="{ 'text-decoration-line-through text-medium-emphasis': todo.completed }">
                {{ todo.title }}
              </v-list-item-title>
              <v-list-item-subtitle
                v-if="todo.dueDate"
                :class="{ 'text-error': isTodoOverdue(todo) }"
              >
                {{ formatDueDate(todo.dueDate) }}
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon
                  size="small"
                  aria-label="Edit todo"
                  variant="text"
                  @click="openEditItem(todo)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  aria-label="Delete todo"
                  variant="text"
                  @click="openDeleteItem(todo)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeItems">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addItemOpen" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>Add Item</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-form ref="addItemForm">
            <v-text-field v-model="newTitle" label="Todo title" :rules="titleRules" class="mb-2" />
            <v-text-field
              v-model="newDueDate"
              label="Due date"
              type="date"
              :rules="optionalDueDateRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addItemOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" @click="createTodo">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editItemOpen" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>Edit Item</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-form ref="editItemForm">
            <v-text-field v-model="editTitle" label="Todo title" :rules="titleRules" class="mb-2" />
            <v-text-field
              v-model="editDueDate"
              label="Due date"
              type="date"
              :rules="optionalDueDateRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editItemOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" @click="saveTodoTitle">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteItemOpen" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>Delete Item</v-card-title>
        </v-card-item>
        <v-card-text>
          Delete {{ activeTodo?.title }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteItemOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" @click="confirmDeleteItem">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
