<template>
  <div>
    <div v-if="!selectedOrder">
      <div class="header-controls">
        <el-button type="success" @click="addNewOrder">Add New Order</el-button> <!-- Removed :loading="isLoading" -->
        <el-button type="primary" @click="showCreateWithMessageDialog" :loading="isLoading">
          Create from Message
        </el-button>
      </div>

      <div class="filters-container" style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
        <el-select 
          v-model="selectedStatusFilter" 
          placeholder="Filter by Status" 
          clearable 
          class="status-filter-dropdown"
          style="width: 200px;"
        >
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <!-- Add other filters here if needed -->
      </div>
      
      <!-- Create from Message Dialog -->
      <el-dialog
        v-model="showMessageDialog"
        title="Create Order from Message"
        width="50%"
      >
        <el-form :model="messageForm" label-position="top">
          <el-form-item label="Original Message" required>
            <el-input
              v-model="messageForm.original_message"
              type="textarea"
              :rows="4"
              placeholder="Enter the original message"
            />
          </el-form-item>
          <el-form-item label="Recipient" required>
            <el-input
              v-model="messageForm.recipient"
              placeholder="Enter recipient name"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showMessageDialog = false">Cancel</el-button>
            <el-button type="primary" @click="createOrderWithMessage" :loading="isCreating">
              Create
            </el-button>
          </span>
        </template>
      </el-dialog>

      <el-table 
        :data="ordersToDisplay"
        v-loading="isLoading"
        empty-text="No orders matching criteria (status: pending/active, created in last 3 days)."
      >
        <el-table-column prop="id" label="Order ID" width="180" />
        <el-table-column prop="status" label="Status" width="120"> <!-- Adjusted width -->
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" disable-transitions>
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Date" width="180">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column label="Recipient" width="180">
          <template #default="{ row }">
            <div v-if="!isEditing(row.id)" @click="startEditing(row.id)" class="recipient-text">
              {{ row.recipient || 'Click to edit' }}
            </div>
            <el-input
              v-else
              v-model="row.recipient"
              placeholder="Enter recipient"
              size="small"
              ref="recipientInput"
              @blur="finishEditing(row)"
              @keyup.enter="finishEditing(row)"
              clearable
            />
          </template>
        </el-table-column>
        <el-table-column prop="total" label="Total" width="180" />
        <el-table-column label="Actions" width="200">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="mini" @click="viewOrder(row)">View</el-button>
              <el-popconfirm
                title="Are you sure to delete this order?"
                @confirm="deleteOrder(row.id)"
                confirm-button-text="Yes"
                cancel-button-text="No"
              >
                <template #reference>
                  <el-button type="danger" size="mini">Delete</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <OrderList v-if="selectedOrder" :order="selectedOrder" @back="selectedOrder = null" />
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'; // Added useRouter
import OrderList from './OrderList.vue';
import type { Order } from '../types';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  createOrder, 
  fetchOrders, 
  deleteOrder as deleteOrderApi, 
  updateOrder, 
  fetchOrderById,
  createOrderFromMessage 
} from '../utils/apiClient';

const store = useStore();
const router = useRouter(); 
const user = computed(() => store.getters['auth/user']);

const allFetchedOrders = ref<Order[]>([]); 
const selectedOrder = ref<Order | null>(null);
const editingId = ref<string | null>(null);
const isLoading = ref(false);

// Add new refs for message dialog
const showMessageDialog = ref(false);
const isCreating = ref(false);
const messageForm = ref({
  original_message: '',
  recipient: ''
});

// Status filter refs and options
const selectedStatusFilter = ref('');
const statusOptions = [
  { value: '', label: 'All Today\'s Orders' }, // Clarified label
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  // Add other relevant statuses if they can appear in "OrderToday" context
];

const getStatusTagType = (status: string): string => {
  if (!status) return 'info'; // Default for undefined/empty status
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'pending') return 'warning';
  if (lowerStatus === 'active' || lowerStatus === 'processing') return 'primary';
  if (lowerStatus === 'completed' || lowerStatus === 'paid') return 'success';
  if (lowerStatus === 'cancelled' || lowerStatus === 'failed') return 'danger';
  return 'info'; 
};

// Load orders on mount
onMounted(async () => {
  try {
    isLoading.value = true;
    const response = await fetchOrders();
    allFetchedOrders.value = response.data.orders; // Updated to use allFetchedOrders
  } catch (error) {
    ElMessage.error('Failed to load orders');
    console.error('Error loading orders:', error);
  } finally {
    isLoading.value = false;
  }
});

const getEasternTime = () => {
  const date = new Date();
  const options = { timeZone: "America/Toronto" };
  const easternDate = new Date(date.toLocaleString("en-US", options));
  return easternDate;
};

const formatDate = (dateString: string) => {
  if (!dateString) {
    return '';
  }

  try {
    // Parse the UTC date and adjust for timezone
    const date = new Date(dateString);
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    
    const year = utcDate.getFullYear();
    const month = String(utcDate.getMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getDate()).padStart(2, '0');
    
    return `${month}-${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

const viewOrder = async (order: Order) => {
  try {
    // Ensure we have a valid order ID
    const orderId = typeof order.id === 'string' ? parseInt(order.id) : order.id;
    if (isNaN(orderId)) {
      throw new Error('Invalid order ID');
    }

    // Fetch the full order details including items from the backend
    const response = await fetchOrderById(orderId);
    console.log('Backend response:', response.data);
    
    if (response.data) {
      // Map the backend items to our frontend structure
      const mappedItems = response.data.items.map((item: any, index: number) => ({
        id: `row-${index + 1}`,
        product_name: item.product_name || '',
        description: item.description || '',
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
        unit: item.unit,  // Include the unit field
        subtotal: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
      }));

      console.log('Mapped items:', mappedItems);

      // Create the order object with mapped items
      selectedOrder.value = {
        ...response.data,
        items: mappedItems
      };
    }
  } catch (error) {
    ElMessage.error('Failed to load order details');
    console.error('Error loading order details:', error);
  }
};

const deleteOrder = async (orderId: number) => {
  try {
    await deleteOrderApi(orderId);
    allFetchedOrders.value = allFetchedOrders.value.filter(order => order.id !== orderId); // Update allFetchedOrders
    ElMessage.success('Order deleted successfully');
  } catch (error) {
    ElMessage.error('Failed to delete order');
    console.error('Error deleting order:', error);
  }
};

const addNewOrder = () => { // Changed to non-async, removed old logic
  router.push({ name: 'ItemSelectionPage' });
};

const isEditing = (id: string) => editingId.value === id;

const startEditing = (id: string) => {
  editingId.value = id;
  nextTick(() => {
    const input = document.querySelector('.editing-recipient input') as HTMLInputElement;
    if (input) input.focus();
  });
};

const finishEditing = (order: Order) => {
  editingId.value = null;
  updateRecipient(order);
};

const updateRecipient = async (order: Order) => {
  try {
    await updateOrder(Number(order.id), { recipient: order.recipient });
    const index = allFetchedOrders.value.findIndex(o => o.id === order.id); // Update allFetchedOrders
    if (index !== -1) {
      // To ensure reactivity, especially if computed properties depend on nested object properties,
      // it's often better to replace the item or ensure the change is detectable.
      // A simple property assignment might be fine, but if `status` or `created_at` were part of this update
      // and came from the server, re-fetching the item or the list would be more robust.
      // For now, this direct update of recipient should be fine for recipient-only changes.
      allFetchedOrders.value[index].recipient = order.recipient;
    }
    ElMessage.success('Recipient updated successfully');
  } catch (error) {
    ElMessage.error('Failed to update recipient');
    console.error('Error updating recipient:', error);
  }
};

// Add new functions for message dialog
const showCreateWithMessageDialog = () => {
  messageForm.value = {
    original_message: '',
    recipient: ''
  };
  showMessageDialog.value = true;
};

const createOrderWithMessage = async () => {
  try {
    if (!messageForm.value.original_message.trim()) {
      ElMessage.warning('Please enter a message');
      return;
    }

    isCreating.value = true;

    // Call the AI parser endpoint to create the order
    const result = await createOrderFromMessage(
      messageForm.value.original_message,
      messageForm.value.recipient.trim() || undefined
    );

    // Add the new order to the list
    allFetchedOrders.value.push(result.data); // Update allFetchedOrders
    ElMessage.success('Order created successfully');
    showMessageDialog.value = false;

  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to create order');
    console.error('Error creating order:', error);
  } finally {
    isCreating.value = false;
  }
};

const displayStatuses = ['pending', 'active'];

const ordersToDisplay = computed(() => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0); 

  const defaultDisplayStatuses = ['pending', 'active']; // Base statuses for "Order Today"

  return allFetchedOrders.value.filter(order => {
    if (!order.created_at || typeof order.status !== 'string') {
      return false;
    }
    try {
      const orderDate = new Date(order.created_at);
      if (isNaN(orderDate.getTime())) {
        return false; 
      }

      const isRecent = orderDate >= threeDaysAgo;
      const statusLower = order.status.toLowerCase();
      const isDefaultStatus = defaultDisplayStatuses.includes(statusLower);
      
      // Apply default page filters (recent and specific statuses)
      if (!isRecent || !isDefaultStatus) {
        return false;
      }

      // Apply user-selected filter (if any)
      if (selectedStatusFilter.value && statusLower !== selectedStatusFilter.value.toLowerCase()) {
        return false;
      }
      
      return true; // Passes all filters
    } catch (e) {
      return false; 
    }
  }).sort((a, b) => {
    // Sort by newest first; ensure created_at is valid before sorting
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0; // Keep original order if dates are invalid
    }
    return dateB.getTime() - dateA.getTime();
  });
});
</script>

<style scoped>
.header-controls {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
