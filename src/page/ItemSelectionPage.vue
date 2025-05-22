<template>
  <div class="item-selection-page">
    <div class="mobile-toggles">
      <button @click="showSidebar = !showSidebar" class="mobile-toggle-btn">
        {{ showSidebar ? 'Hide' : 'Show' }} Categories
      </button>
      <button @click="showOrderSummary = !showOrderSummary" class="mobile-toggle-btn summary-toggle-btn">
        {{ showOrderSummary ? 'Hide' : 'Show' }} Order
      </button>
    </div>

    <div class="sidebar-container" :class="{ 'is-visible': showSidebar }">
      <button @click="showSidebar = false" class="close-btn mobile-only">X</button>
      <CategorySidebar @category-selected="handleCategorySelected" />
    </div>

    <div class="product-list-container">
      <ProductList :category-id="selectedCategoryId" @add-to-order="handleAddToOrder" />
    </div>

    <div class="order-summary-container" :class="{ 'is-visible': showOrderSummary }">
      <button @click="showOrderSummary = false" class="close-btn mobile-only">X</button>
      <h3>Order Details</h3>
      <div class="order-details-form">
        <div class="form-item">
          <label for="recipientName">Recipient Name:</label>
          <el-input id="recipientName" v-model="recipientName" placeholder="Enter recipient name" clearable />
        </div>
        <div class="form-item">
          <label for="orderDate">Order Date:</label>
          <el-date-picker 
            id="orderDate"
            v-model="orderDate" 
            type="date" 
            placeholder="Select order date" 
            format="YYYY-MM-DD" 
            value-format="YYYY-MM-DD"
            style="width: 100%;" 
          />
        </div>
      </div>

      <h3>Current Items</h3> <!-- Changed title for clarity -->
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
        <h4>Total: ${{ calculateOrderTotal.toFixed(2) }}</h4> <!-- Corrected: calculateOrderTotal is a computed ref -->
      </div>
      <button 
        @click="saveOrder" 
        class="save-order-button" 
        :disabled="currentOrderItems.length === 0 || isSaving || !recipientName.trim() || !orderDate"
      >
        {{ isSaving ? 'Saving...' : 'Save Order' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import CategorySidebar from '../component/CategorySidebar.vue';
import ProductList from '../component/ProductList.vue';
import { createOrder } from '../../utils/apiClient'; // Added createOrder import
import { ElMessage } from 'element-plus'; // Added ElMessage import

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
const isSaving = ref(false);

// Responsive state
const windowWidth = ref(window.innerWidth);
const showSidebar = ref(window.innerWidth > 1024); // Visible by default on desktop
const showOrderSummary = ref(window.innerWidth > 1024); // Visible by default on desktop

const isMobileOrTablet = computed(() => windowWidth.value <= 1024);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  if (!isMobileOrTablet.value) {
    // On desktop, ensure panels are visible
    showSidebar.value = true;
    showOrderSummary.value = true;
  } else {
    // On mobile/tablet, hide them initially when resizing to these views,
    // user can toggle them. Or, preserve their current toggled state if preferred.
    // For simplicity here, we'll hide them if resizing TO mobile/tablet view.
    // A more complex solution could remember their last toggled state.
    showSidebar.value = false;
    showOrderSummary.value = false;
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize(); // Initial check
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// New refs for order details
const recipientName = ref('');
const getTodaysDateFormatted = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const orderDate = ref(getTodaysDateFormatted()); // Initialize with today's date formatted

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

const saveOrder = async () => {
  if (currentOrderItems.value.length === 0) {
    ElMessage.warning('Your order is empty. Please add items before saving.');
    return;
  }

  isSaving.value = true;

  // Use values from the new input fields
  const itemsToSave = currentOrderItems.value.map(item => ({
    product_id: item.productId, // Assuming currentOrderItems have productId
    quantity: item.quantity,
    // Backend will fetch name, price, etc., based on product_id
  }));

  const orderPayload = {
    recipient: recipientName.value.trim(), // Use recipientName ref
    date: orderDate.value, // Use orderDate ref (already formatted)
    items: itemsToSave,
  };

  try {
    await createOrder(orderPayload);
    ElMessage.success('Order created successfully!');
    currentOrderItems.value = []; // Clear the current order
    selectedCategoryId.value = null; 
    recipientName.value = ''; // Clear recipient name
    orderDate.value = getTodaysDateFormatted(); // Reset date to today
    // router.push({ name: 'OrderToday' }); 
  } catch (error) {
    console.error('Error creating order:', error);
    ElMessage.error('Failed to create order: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.item-selection-page {
  display: flex;
  height: 100vh; /* Full viewport height */
  font-family: Arial, sans-serif;
  background-color: #eef1f5; /* Consistent light background */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Consistent font */
}

.mobile-toggles {
    display: none; /* Hidden by default, shown on small screens via media query */
    padding: 10px 15px; /* Adjusted padding */
    background-color: #2c3e50; /* Match AppHeader */
  width: 100%;
  box-sizing: border-box;
  gap: 10px;
}

.mobile-toggle-btn {
    background-color: #007bff; 
  color: white;
  border: none;
    font-size: 0.9em; /* Adjusted font size */
    margin-right: 10px; /* Added margin */
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}
.mobile-toggle-btn.summary-toggle-btn {
  background-color: #28a745;
}


.sidebar-container,
.order-summary-container {
  background-color: #ffffff; 
  overflow-y: auto;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1); /* Subtle shadow */
  z-index: 1000; 
}

.sidebar-container {
  width: 240px; 
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0; 
}

.product-list-container {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: transparent; 
}

.order-summary-container {
  width: 320px;
  flex-shrink: 0;
  padding: 25px; /* Increased padding */
  border-left: 1px solid #e0e0e0; 
  background-color: #f7f9fc; /* Slightly different light background */
  display: flex;
  flex-direction: column;
  gap: 20px; /* Spacing for direct children */
  /* overflow-y: auto; /* This was for the whole container, list needs its own */
}

.close-btn {
  display: none; /* Hidden by default */
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ccc;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  line-height: 24px;
  text-align: center;
  cursor: pointer;
  z-index: 1010;
}
.mobile-only { /* Helper class to show elements only in mobile/tablet toggle view */
    /* display: none; by default, shown by media queries */
}


/* Tablet and Mobile common styles for panels */
@media (max-width: 1024px) { /* Tablet and below */
  .mobile-toggles {
    display: flex; /* Show toggle buttons */
    position: sticky; /* Stick to top below AppHeader */
    top: 0; /* Adjust if AppHeader has a fixed height, e.g., top: 60px; */
    background-color: #2c3e50; /* Match AppHeader */
    z-index: 999; /* Below panels but above product list */
  }

  .item-selection-page {
    flex-direction: row; /* Keep horizontal layout for product list */
    /* If AppHeader is fixed, add padding-top to item-selection-page
       to prevent mobile-toggles from being obscured by AppHeader */
    /* padding-top: 50px; Adjust based on AppHeader height */
  }
  
  .sidebar-container,
  .order-summary-container {
    position: fixed; /* Off-canvas */
    top: 0; /* Align with viewport top */
    /* If AppHeader is fixed and mobile-toggles are not sticky, adjust top:
       Example: top: var(--app-header-height, 60px); 
       And mobile-toggles would also need this offset or be part of AppHeader.
       For simplicity, assuming mobile-toggles are sticky or AppHeader isn't fixed. */
    height: 100vh; /* Full viewport height */
    box-shadow: 0 0 20px rgba(0,0,0,0.25);
  }

  .sidebar-container {
    left: 0;
    transform: translateX(-105%); /* Hide completely */
  }

  .order-summary-container {
    right: 0;
    transform: translateX(105%); /* Hide completely */
  }

  .sidebar-container.is-visible,
  .order-summary-container.is-visible {
    transform: translateX(0);
  }

  .product-list-container {
    margin-left: 0; 
    margin-right: 0;
    width: 100%; /* Ensure product list takes full width */
  }

  .close-btn.mobile-only {
    display: block;
  }
}

@media (max-width: 768px) { /* Mobile specific */
  .sidebar-container {
    width: 85%; /* Take more width on mobile */
    max-width: 300px;
  }
  .order-summary-container {
    width: 90%; /* Take more width on mobile */
    max-width: 320px; 
  }
  .product-list-container {
    padding: 10px; /* Further reduce padding */
  }
  .mobile-toggles {
    padding: 8px 10px; /* Adjust padding */
  }
  .mobile-toggle-btn {
    padding: 6px 10px;
    font-size: 0.85em;
  }
}


.order-details-form {
  /* margin-bottom will be handled by parent gap if this is a direct child */
  padding-bottom: 15px; /* Adjusted padding */
  border-bottom: 1px solid #e0e0e0; /* Lighter border */
}

.order-details-form .form-item {
  margin-bottom: 15px;
}
.order-details-form .form-item:last-child {
  margin-bottom: 0; /* Remove margin for the last form item */
}

.order-details-form .form-item label {
  display: block;
  margin-bottom: 6px; /* Increased space */
  font-weight: 500; /* Element Plus uses 500 for labels by default */
  font-size: 0.9em;
  color: #495057; /* Darker, more readable gray */
}

.order-summary-container h3 {
  margin-top: 0;
  color: #2c3e50; /* Consistent with AppHeader title color */
  text-align: center;
  border-bottom: 1px solid #e0e0e0; /* Lighter separator */
  padding-bottom: 12px;
  margin-bottom: 0; /* Gap will handle spacing, or adjust if h3 is not direct child */
  font-size: 1.3em; /* Slightly larger */
}

.empty-order p {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 20px 0; /* Add some padding if list is empty */
}

.order-items-list {
  list-style-type: none;
  padding: 10px; /* Padding inside the scrollable area */
  margin: 0; 
  flex-grow: 1; 
  max-height: 280px; /* Max height for scrollability */
  overflow-y: auto; 
  border: 1px solid #e0e0e0; 
  border-radius: 4px; 
  background-color: #ffffff; 
}

.order-item {
  display: grid;
  grid-template-columns: 1fr auto; /* Name+Price | Quantity+Subtotal */
  grid-template-rows: auto auto;
  gap: 2px 15px; /* Small row gap, larger column gap */
  padding: 12px 8px; /* Increased padding */
  border-bottom: 1px solid #f0f0f0; 
  font-size: 0.9em;
  align-items: center;
}
.order-item:last-child {
  border-bottom: none;
}

.item-details { /* New wrapper for name and price */
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 600; 
  color: #333;
  word-break: break-word; 
}

.item-price { 
  font-size: 0.85em;
  color: #777;
}

.item-qty-subtotal { /* New wrapper for quantity and subtotal */
  text-align: right;
}

.item-quantity {
  font-size: 0.9em;
  color: #555;
  display: block; /* Ensure it's on its own line if needed or adjust grid */
}

.item-subtotal {
  font-weight: 600; 
  color: #333;
  font-size: 0.95em; /* Slightly larger subtotal */
}

.order-total {
  /* margin-top is handled by parent gap */
  padding-top: 15px;
  border-top: 2px solid #007bff; /* Use primary color */
  text-align: right;
}

.order-total h4 {
  margin: 0;
  font-size: 1.25em; 
  color: #007bff; /* Primary color for total */
  font-weight: 600;
}

.save-order-button {
  background-color: #28a745; 
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  text-transform: uppercase;
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  /* margin-top is handled by parent gap */
  width: 100%; /* Full width */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.save-order-button:hover:not(:disabled) {
  background-color: #218838; 
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.save-order-button:disabled {
  background-color: #ced4da; /* Lighter gray for disabled */
  color: #6c757d;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
