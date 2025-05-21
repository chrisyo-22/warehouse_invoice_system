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
        <li v-for="(item, idx) in currentOrderItems" :key="item.productId + '-' + (item.unit || 'none')" class="order-item">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-quantity">Qty: {{ item.quantity }}</span>
          <span class="item-unit">
            Unit:
            <select v-model="item.unit">
              <option v-for="unit in unitOptions" :key="unit" :value="unit">{{ unit }}</option>
            </select>
          </span>
        </li>
      </ul>
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
import { createOrder } from '../utils/apiClient';
import { ElMessage } from 'element-plus';
import { useStore } from 'vuex';

// Define interfaces for Product (as emitted by ProductList) and OrderItem
interface Product {
  id: number;
  name: string;
  price: number;
  // Assuming ProductList emits products with at least these fields
  // Add other fields if necessary, e.g., categoryId, description
  unit?: string | null;
}

interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  unit?: string | null;
}

const unitOptions = ['skids', 'boxes', 'kg', 'pcs', 'bunch', 'loaf', '1L', '750ml', '500g', 'cake'];

const selectedCategoryId = ref<number | null>(null);
const currentOrderItems = ref<OrderItem[]>([]);
const store = useStore();
const user = computed(() => store.getters['auth/user']);

const handleCategorySelected = (categoryId: number) => {
  selectedCategoryId.value = categoryId;
};

const handleAddToOrder = (product: Product & { unit: string }) => {
  // Check if the same product with the same unit exists
  const existingItem = currentOrderItems.value.find(item => item.productId === product.id && item.unit === product.unit);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    currentOrderItems.value.push({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unit: product.unit
    });
  }
};

const saveOrder = async () => {
  if (currentOrderItems.value.length === 0) {
    ElMessage.error('Cannot save an empty order.');
    return;
  }
  try {
    // Prompt for recipient and date (for demo, use today and a prompt)
    const recipient = prompt('Enter recipient name:');
    if (!recipient || recipient.trim() === '') {
      ElMessage.error('Recipient is required.');
      return;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    // Prepare order data for backend
    const orderData = {
      date: formattedDate,
      recipient: recipient.trim(),
      owner: user.value?.id,
      items: currentOrderItems.value.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        unit: item.unit || null
      }))
    };
    await createOrder(orderData);
    ElMessage.success('Order created successfully!');
    // Optionally clear order after saving
    currentOrderItems.value = [];
    selectedCategoryId.value = null;
  } catch (error) {
    ElMessage.error('Failed to create order.');
    console.error('Error creating order:', error);
  }
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

.item-unit {
  flex-basis: 20%;
  text-align: right;
  color: #555;
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
