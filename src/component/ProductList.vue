<template>
  <div class="product-list">
    <h2>Products</h2>
    <div v-if="isLoading" class="loading-message">Loading products...</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="!isLoading && !errorMessage && products.length === 0" class="no-products">
      <p>No products to display.</p>
    </div>
    <div v-if="!isLoading && !errorMessage && products.length > 0" class="product-grid">
      <div v-for="product in products" :key="product.id" class="product-item">
        <img :src="product.image_url" :alt="product.name" class="product-image" />
        <h3>{{ product.name }}</h3>
        <p class="description">{{ product.description }}</p>
        <p class="price">${{ product.price.toFixed(2) }}</p>
        <el-button type="primary" @click="addToOrder(product)" class="add-to-order-btn">Add to Order</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, defineProps, defineEmits } from 'vue'; // Removed computed, added watch, onMounted
import { fetchProducts } from '../../utils/apiClient'; // Added fetchProducts import

interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

const props = defineProps<{
  categoryId?: number | null;
}>();

const products = ref<Product[]>([]); // Renamed from allProducts, initialized empty
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const loadProducts = async (currentCategoryId?: number | null) => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    // Assuming fetchProducts returns the array of products directly
    // If it returns { data: { products: [] } } or similar, adjust access:
    // const response = await fetchProducts(currentCategoryId);
    // products.value = response.data.products (or response.data if it's the array)
    const fetchedData = await fetchProducts(currentCategoryId);
     if (Array.isArray(fetchedData)) { // Simple check
        products.value = fetchedData;
    } else if (fetchedData && Array.isArray(fetchedData.data)) { // Common { data: [] }
        products.value = fetchedData.data;
    } else if (fetchedData && fetchedData.data && Array.isArray(fetchedData.data.products)) { // Common { data: { products: [] } }
        products.value = fetchedData.data.products;
    }
     else {
        console.error('Unexpected data structure from fetchProducts:', fetchedData);
        products.value = []; // Default to empty array
        errorMessage.value = 'Could not load products (unexpected format).';
    }
  } catch (err) {
    console.error('Error fetching products:', err);
    errorMessage.value = (err instanceof Error ? err.message : 'An unknown error occurred');
     if (errorMessage.value && errorMessage.value.toLowerCase().includes('network error')) {
        errorMessage.value = 'Network Error: Could not connect to server.';
    } else if (!errorMessage.value) {
        errorMessage.value = 'Failed to fetch products.';
    }
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.categoryId, (newCategoryId) => {
  loadProducts(newCategoryId);
});

onMounted(() => {
  loadProducts(props.categoryId);
});

const emit = defineEmits<{
  (e: 'add-to-order', product: Product): void;
}>();

const addToOrder = (product: Product) => {
  emit('add-to-order', product);
};
</script>

<style scoped>
.product-list {
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Consistent font */
}

.product-list h2 {
  margin-top: 0;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.product-item {
  border: 1px solid #e0e0e0; /* Lighter border */
  border-radius: 8px;
  padding: 15px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08); /* Slightly softer shadow */
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 320px; /* Ensure some consistency in card height */
  transition: box-shadow 0.3s ease;
}

.product-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.product-image {
  width: 100%; /* Make image responsive within its container */
  max-width: 160px; /* Max width of the image */
  height: 160px; /* Fixed height */
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.product-item h3 {
  font-size: 1.1em;
  margin: 10px 0;
  color: #444;
}

.description {
  font-size: 0.9em;
  color: #555; /* Darker gray for better readability */
  flex-grow: 1; 
  margin-bottom: 12px;
  line-height: 1.4;
  /* For text truncation: */
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Max 3 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: calc(1.4em * 3); /* Approx height for 3 lines, adjust based on actual line-height */
}

.price {
  font-size: 1.1em; /* Slightly larger price */
  font-weight: 600; /* Semi-bold */
  color: #333; /* Darker price color */
  margin-bottom: 12px;
}

.add-to-order-btn {
  /* el-button will have its own styling, this class is for potential overrides or if not using el-button */
  width: 100%; /* Make button take full width of its container (within padding of card) */
  margin-top: auto; /* Pushes button to the bottom of the card */
}

.no-products {
  text-align: center;
  padding: 20px;
  color: #777;
}

.loading-message,
.error-message {
  padding: 10px;
  text-align: center;
  color: #555;
  margin-bottom: 15px;
}

.error-message {
  color: #e74c3c; /* Red for errors */
  background-color: #fdd; /* Light red background */
  border: 1px solid #e74c3c;
  border-radius: 4px;
}

/* Responsive adjustments for product grid */
@media (max-width: 768px) { /* Mobile */
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); /* Smaller min for 2 columns if possible */
    gap: 15px;
  }
  .product-item {
    min-height: 280px; /* Adjust min-height for smaller cards */
    padding: 10px;
  }
  .product-list {
    padding: 15px; /* Reduce overall padding */
  }
  .product-image {
    max-width: 120px;
    height: 120px;
  }
  .product-item h3 {
    font-size: 1em;
  }
  .description {
    font-size: 0.85em;
    min-height: calc(1.4em * 2); /* Show 2 lines on mobile */
    -webkit-line-clamp: 2;
  }
  .price {
    font-size: 1em;
  }
}

@media (max-width: 480px) { /* Smaller Mobile */
  .product-grid {
    grid-template-columns: 1fr; /* Single column */
  }
   .product-item {
    min-height: auto; /* Auto height for single column items */
  }
}
</style>
