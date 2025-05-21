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
        <p class="price">${{ product.price.toFixed(2) }}</p>
        <button @click="addToOrder(product)">Add to Order</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue';

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

const allProducts = ref<Product[]>([
  { id: 1, categoryId: 1, name: 'Frozen Peas', description: 'Sweet and tender frozen green peas.', price: 2.99, image_url: 'https://via.placeholder.com/150/92c952' },
  { id: 2, categoryId: 1, name: 'Ice Cream', description: 'Rich vanilla bean ice cream.', price: 5.49, image_url: 'https://via.placeholder.com/150/771796' },
  { id: 3, categoryId: 1, name: 'Frozen Pizza', description: 'Classic pepperoni pizza with a crispy crust.', price: 7.99, image_url: 'https://via.placeholder.com/150/24f355' },
  { id: 4, categoryId: 2, name: 'Apples', description: 'Crisp and juicy red apples, perfect for snacking.', price: 3.50, image_url: 'https://via.placeholder.com/150/d32776' },
  { id: 5, categoryId: 2, name: 'Bananas', description: 'Ripe yellow bananas, sold by the bunch.', price: 1.99, image_url: 'https://via.placeholder.com/150/f66b97' },
  { id: 6, categoryId: 2, name: 'Carrots', description: 'Fresh organic carrots, great for cooking or raw.', price: 2.20, image_url: 'https://via.placeholder.com/150/f69b97' },
  { id: 7, categoryId: 3, name: 'Sourdough Bread', description: 'Artisan sourdough bread with a tangy flavor.', price: 4.50, image_url: 'https://via.placeholder.com/150/56a8c2' },
  { id: 8, categoryId: 3, name: 'Croissants', description: 'Buttery and flaky croissants, baked fresh daily.', price: 1.75, image_url: 'https://via.placeholder.com/150/b0f7cc' },
  { id: 9, categoryId: 4, name: 'Orange Juice', description: 'Freshly squeezed orange juice, 1 liter.', price: 3.99, image_url: 'https://via.placeholder.com/150/fb0000' },
  { id: 10, categoryId: 4, name: 'Sparkling Water', description: 'Natural sparkling mineral water, 750ml.', price: 1.50, image_url: 'https://via.placeholder.com/150/289781' },
  { id: 11, categoryId: 5, name: 'Pasta', description: 'Imported Italian spaghetti, 500g.', price: 2.10, image_url: 'https://via.placeholder.com/150/808080' },
  { id: 12, categoryId: 5, name: 'Rice', description: 'Long-grain white rice, 1kg bag.', price: 3.00, image_url: 'https://via.placeholder.com/150/000000' }
]);

const filteredProducts = computed(() => {
  if (props.categoryId === undefined || props.categoryId === null) {
    return allProducts.value; // Show all products if no categoryId is provided
  }
  return allProducts.value.filter(product => product.categoryId === props.categoryId);
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
  flex-grow: 1; /* Allows description to take available space */
  margin-bottom: 10px;
}

.price {
  font-size: 1em;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 10px;
}

.product-item button {
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: auto; /* Pushes button to the bottom of the card */
}

.product-item button:hover {
  background-color: #0056b3;
}

.no-products {
  text-align: center;
  padding: 20px;
  color: #777;
}
</style>
