<template>
  <nav class="sidebar">
    <h3>Categories</h3>
    <div v-if="isLoading" class="loading-message">Loading categories...</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <ul v-if="!isLoading && !errorMessage && categories.length > 0">
      <li
        v-for="category in categories"
        :key="category.id"
        @click="selectCategory(category.id)"
        :class="{ selected: category.id === selectedCategoryId }"
      >
        {{ category.name }}
      </li>
    </ul>
    <div v-if="!isLoading && !errorMessage && categories.length === 0" class="empty-message">
      No categories found.
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchCategories } from '../../utils/apiClient'; // Adjusted path

interface Category {
  id: number;
  name: string;
  description?: string; // Optional based on your API
}

const categories = ref<Category[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const selectedCategoryId = ref<number | null>(null);

const emit = defineEmits<{
  (e: 'category-selected', categoryId: number): void;
}>();

const selectCategory = (categoryId: number) => {
  selectedCategoryId.value = categoryId;
  emit('category-selected', categoryId);
};

onMounted(async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    // Assuming fetchCategories returns the array of categories directly
    // If it returns { data: { categories: [] } } or similar, adjust access:
    // const response = await fetchCategories();
    // categories.value = response.data.categories (or response.data if it's the array)
    const fetchedData = await fetchCategories();
    if (Array.isArray(fetchedData)) { // Simple check if it's an array
        categories.value = fetchedData;
    } else if (fetchedData && Array.isArray(fetchedData.data)) { // Common structure { data: [] }
        categories.value = fetchedData.data;
    } else if (fetchedData && fetchedData.data && Array.isArray(fetchedData.data.categories)) { // Common { data: { categories: [] } }
        categories.value = fetchedData.data.categories;
    }
     else {
        console.error('Unexpected data structure from fetchCategories:', fetchedData);
        categories.value = []; // Default to empty array on unexpected structure
        errorMessage.value = 'Could not load categories (unexpected format).';
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
    errorMessage.value = (err instanceof Error ? err.message : 'An unknown error occurred');
    if (errorMessage.value && errorMessage.value.toLowerCase().includes('network error')) {
        errorMessage.value = 'Network Error: Could not connect to server.';
    } else if (!errorMessage.value) {
        errorMessage.value = 'Failed to fetch categories.';
    }
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.sidebar {
  /* width is controlled by .sidebar-container in parent for responsiveness */
  height: 100%; /* Ensure it fills the container height */
  padding: 20px; /* Increased padding */
  background-color: #ffffff; /* Cleaner background */
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Consistent font */
  display: flex;
  flex-direction: column;
}

.sidebar h3 {
  margin-top: 0;
  font-size: 1.3em; /* Slightly larger title */
  color: #2c3e50; /* Match AppHeader's dark blue for title */
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0; /* Subtle separator */
  margin-bottom: 15px; 
}

.loading-message,
.empty-message {
  padding: 15px;
  text-align: center;
  color: #777; /* Softer text color */
  font-style: italic;
}

.error-message {
  padding: 10px;
  text-align: center;
  color: #D32F2F; /* Material Design error color */
  background-color: #FFCDD2; /* Material Design error background */
  border: 1px solid #D32F2F;
  border-radius: 4px;
  margin: 10px 0;
}

ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  overflow-y: auto; /* Allow scrolling for long lists */
  flex-grow: 1; /* Takes available space in flex column */
}

li {
  padding: 10px 15px; /* Increased padding */
  cursor: pointer;
  border-radius: 5px; /* Slightly more rounded corners */
  margin-bottom: 8px; /* Increased margin */
  color: #333; /* Darker text for better readability */
  font-size: 0.95em;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.1s ease; /* Smooth transitions */
}

li:hover {
  background-color: #f0f4f8; /* Lighter blueish-gray hover */
  color: #2c3e50; /* Dark blue text on hover */
  transform: translateX(2px); /* Slight move effect */
}

li.selected {
  background-color: #007bff; /* Element Plus primary blue or #409EFF */
  color: white;
  font-weight: 600; /* Semi-bold for selected */
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2); /* Subtle shadow for selected item */
}
</style>
