<template>
  <nav class="sidebar">
    <h3>Categories</h3>
    <ul>
      <li
        v-for="category in categories"
        :key="category.id"
        @click="selectCategory(category.id)"
        :class="{ selected: category.id === selectedCategoryId }"
      >
        {{ category.name }}
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const categories = ref<{ id: number; name: string; description?: string }[]>([]);
const selectedCategoryId = ref<number | null>(null);

const emit = defineEmits<{
  (e: 'category-selected', categoryId: number): void;
}>();

const selectCategory = (categoryId: number) => {
  selectedCategoryId.value = categoryId;
  emit('category-selected', categoryId);
};

onMounted(async () => {
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    categories.value = await res.json();
  } catch (e) {
    categories.value = [];
  }
});
</script>

<style scoped>
.sidebar {
  width: 200px;
  padding: 15px;
  background-color: #f4f4f4;
  border-right: 1px solid #ddd;
}

.sidebar h3 {
  margin-top: 0;
  font-size: 1.2em;
  color: #333;
}

ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 5px;
  color: #555;
}

li:hover {
  background-color: #e9e9e9;
  color: #000;
}

li.selected {
  background-color: #007bff;
  color: white;
  font-weight: bold;
}
</style>
