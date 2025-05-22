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
import { ref } from 'vue';

const categories = ref([
  { id: 1, name: 'Frozen Foods' },
  { id: 2, name: 'Fresh Produce' },
  { id: 3, name: 'Bakery' },
  { id: 4, name: 'Beverages' },
  { id: 5, name: 'Dry Goods' }
]);

const selectedCategoryId = ref<number | null>(null);

const emit = defineEmits<{
  (e: 'category-selected', categoryId: number): void;
}>();

const selectCategory = (categoryId: number) => {
  selectedCategoryId.value = categoryId;
  emit('category-selected', categoryId);
};
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
