<template>
  <div class="product-list">
    <h2>Products</h2>
    <div v-if="filteredProducts.length === 0" class="no-products">
      <p>No products found for this category.</p>
    </div>
    <div v-else class="product-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-item">
        <img :src="product.image_url" :alt="product.name" class="product-image" />
        <h3>{{ product.name }}</h3>
        <p class="description">{{ product.description }}</p>
        <div class="unit-action-row">
          <select v-model="unitSelections[product.id]" class="unit-select">
            <option v-for="unit in unitOptions" :key="unit" :value="unit">{{ unit }}</option>
          </select>
          <button @click="addToOrderWithUnit(product)" class="add-to-order-btn">Add to Order</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch, onMounted } from 'vue';

interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  unit?: string;
}

const props = defineProps<{
  categoryId?: number | null;
}>();

const allProducts = ref<Product[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const unitOptions = ['skids', 'boxes', 'kg', 'pcs', 'bunch', 'loaf', '1L', '750ml', '500g', 'cake'];
const unitSelections = ref<{ [productId: number]: string }>({});

const fetchProducts = async (categoryId?: number | null) => {
  loading.value = true;
  error.value = null;
  try {
    let url = '/api/products';
    if (categoryId) {
      url += `?category_id=${categoryId}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    allProducts.value = data.map((p: any) => ({
      ...p,
      price: Number(p.price)
    }));
    // Set default unit selection for each product
    data.forEach((p: any) => {
      if (!unitSelections.value[p.id]) {
        unitSelections.value[p.id] = unitOptions[0];
      }
    });
  } catch (e: any) {
    error.value = e.message || 'Unknown error';
    allProducts.value = [];
  } finally {
    loading.value = false;
  }
};

watch(() => props.categoryId, (newVal) => {
  fetchProducts(newVal);
}, { immediate: true });

onMounted(() => {
  fetchProducts(props.categoryId);
});

const filteredProducts = computed(() => {
  return allProducts.value;
});

const emit = defineEmits<{
  (e: 'add-to-order', product: Product & { unit: string }): void;
}>();

const addToOrderWithUnit = (product: Product) => {
  const unit = unitSelections.value[product.id] || unitOptions[0];
  emit('add-to-order', { ...product, unit });
};
</script>

<style scoped>
.product-list {
  padding: 20px;
  font-family: Arial, sans-serif;
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
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.product-image {
  width: 150px;
  height: 150px;
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
  color: #666;
  flex-grow: 1;
  margin-bottom: 10px;
}

.unit-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.unit-select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 1em;
}

.add-to-order-btn {
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-to-order-btn:hover {
  background-color: #0056b3;
}

.no-products {
  text-align: center;
  padding: 20px;
  color: #777;
}
</style>
