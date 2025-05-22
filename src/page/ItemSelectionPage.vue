<template>
  <div class="item-selection-page">
    <div class="sidebar-container">
      <CategorySidebar @category-selected="handleCategorySelected" />
    </div>

    <div class="product-list-container">
      <ProductList :category-id="selectedCategoryId" @add-to-order="handleAddToOrder" />
    </div>

    <div class="order-summary-container">
      <h3>Current Order</h3>
      <div v-if="currentOrderItems.length === 0" class="empty-order">
        <p>Your order is empty. Add items from the product list.</p>
      </div>
      <ul v-else class="order-items-list">
        <li v-for="item in currentOrderItems" :key="item.productId" class="order-item">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-quantity">Qty: {{ item.quantity }}</span>
          <span class="item-price">@ ${{ item.price.toFixed(2) }}</span>
          <span class="item-subtotal">Subtotal: ${{ item.subtotal.toFixed(2) }}</span>
        </li>
      </ul>
      <div class="order-total" v-if="currentOrderItems.length > 0">
        <h4>Total: ${{ calculateOrderTotal().toFixed(2) }}</h4>
      </div>
      <button @click="saveOrder" class="save-order-button" :disabled="currentOrderItems.length === 0">
        Save Order
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CategorySidebar from '../component/CategorySidebar.vue';
import ProductList from '../component/ProductList.vue';

// Define interfaces for Product (as emitted by ProductList) and OrderItem
interface Product {
  id: number;
  name: string;
  price: number;
  // Assuming ProductList emits products with at least these fields
  // Add other fields if necessary, e.g., categoryId, description
}

interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number; // Price per unit
  subtotal: number;
}

const selectedCategoryId = ref<number | null>(null);
const currentOrderItems = ref<OrderItem[]>([]);

const handleCategorySelected = (categoryId: number) => {
  selectedCategoryId.value = categoryId;
};

const handleAddToOrder = (product: Product) => {
  const existingItem = currentOrderItems.value.find(item => item.productId === product.id);

  if (existingItem) {
    existingItem.quantity++;
    existingItem.subtotal = existingItem.quantity * existingItem.price;
  } else {
    currentOrderItems.value.push({
      productId: product.id,
      name: product.name,
      quantity: 1,
      price: product.price,
      subtotal: product.price, // Initially subtotal is just the price for quantity 1
    });
  }
};

const calculateOrderTotal = computed(() => {
  return currentOrderItems.value.reduce((total, item) => total + item.subtotal, 0);
});

const saveOrder = () => {
  if (currentOrderItems.value.length === 0) {
    console.warn('Cannot save an empty order.');
    // Optionally, provide user feedback (e.g., alert or notification)
    return;
  }
  console.log('Saving order:', JSON.parse(JSON.stringify(currentOrderItems.value))); // Deep copy for logging
  // Here, you would typically send the order to a backend API
  // For now, just logging. You might want to clear the order or give feedback.
  alert('Order saved to console! (Mock implementation)');
  // currentOrderItems.value = []; // Optionally clear order after saving
  // selectedCategoryId.value = null; // Optionally reset category selection
};
</script>

<style scoped>
.item-selection-page {
  display: flex;
  height: 100vh; /* Full viewport height */
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
}

.sidebar-container {
  width: 220px; /* Fixed width for sidebar */
  flex-shrink: 0; /* Prevent sidebar from shrinking */
  border-right: 1px solid #ccc;
  background-color: #fff;
  overflow-y: auto; /* Scroll if content overflows */
}

.product-list-container {
  flex-grow: 1; /* Takes up remaining space */
  padding: 20px;
  overflow-y: auto; /* Scroll if content overflows */
  background-color: #fff;
  margin-left: 10px; /* Spacing between sidebar and product list */
  margin-right: 10px; /* Spacing between product list and order summary */
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

.order-summary-container {
  width: 300px; /* Fixed width for order summary */
  flex-shrink: 0; /* Prevent summary from shrinking */
  padding: 20px;
  border-left: 1px solid #ccc;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.order-summary-container h3 {
  margin-top: 0;
  color: #333;
  text-align: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.empty-order p {
  text-align: center;
  color: #777;
  font-style: italic;
}

.order-items-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  flex-grow: 1; /* Allows list to take available space */
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9em;
}

.order-item:last-child {
  border-bottom: none;
}

.item-name {
  flex-basis: 40%;
  font-weight: bold;
  color: #555;
}

.item-quantity {
  flex-basis: 15%;
  text-align: center;
  color: #555;
}

.item-price {
  flex-basis: 20%;
  text-align: right;
  color: #555;
}

.item-subtotal {
  flex-basis: 25%;
  text-align: right;
  font-weight: bold;
  color: #333;
}

.order-total {
  margin-top: auto; /* Pushes total to the bottom */
  padding-top: 15px;
  border-top: 2px solid #ddd;
  text-align: right;
}

.order-total h4 {
  margin: 0;
  font-size: 1.2em;
  color: #2c3e50;
}

.save-order-button {
  background-color: #28a745; /* Green */
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  text-transform: uppercase;
  transition: background-color 0.2s ease-in-out;
  margin-top: 20px; /* Space above the button */
}

.save-order-button:hover {
  background-color: #218838; /* Darker green */
}

.save-order-button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}
</style>
