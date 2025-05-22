<template>
  <div>
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

    <el-table 
      :data="pastOrdersToDisplay" 
      v-loading="isLoading"
      empty-text="No past orders found matching the criteria."
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
    <OrderList v-if="selectedOrder" :order="selectedOrder" @back="selectedOrder = null" />
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted, computed } from 'vue';
import OrderList from './OrderList.vue';
import type { Order } from '../types'; // Assuming path is correct, adjust if needed e.g., '../../types'
import { fetchOrders } from '../utils/apiClient'; // Assuming path is correct, adjust if needed e.g., '../../utils/apiClient'
import { ElMessage } from 'element-plus';

const allFetchedOrders = ref<Order[]>([]); // Renamed and will be fetched
const isLoading = ref(false);
const selectedOrder = ref<Order | null>(null);
const editingId = ref<string | null>(null);

// Status filter refs and options
const selectedStatusFilter = ref('');
const statusOptions = [
  { value: '', label: 'All Past Orders' },
  { value: 'completed', label: 'Completed' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
  // Add other statuses that might appear in "PastOrders" context like 'archived'
];

const getStatusTagType = (status: string): string => {
  if (!status) return 'info'; 
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'pending') return 'warning';
  if (lowerStatus === 'active' || lowerStatus === 'processing') return 'primary'; // 'primary' or 'info'
  if (lowerStatus === 'completed' || lowerStatus === 'paid') return 'success';
  if (lowerStatus === 'cancelled' || lowerStatus === 'failed') return 'danger';
  return 'info'; // Default for other statuses
};

onMounted(async () => {
  isLoading.value = true;
  try {
    const response = await fetchOrders(); // Assuming fetchOrders returns { data: { orders: [] } } or similar
    // Adjust access based on actual API response structure for fetchOrders
    if (response && response.data && Array.isArray(response.data.orders)) {
      allFetchedOrders.value = response.data.orders;
    } else if (response && Array.isArray(response.data)) { // If fetchOrders returns { data: [] }
      allFetchedOrders.value = response.data;
    } else if (Array.isArray(response)) { // If fetchOrders returns [] directly
        allFetchedOrders.value = response;
    } else {
      console.error('Unexpected response structure from fetchOrders:', response);
      allFetchedOrders.value = []; // Default to empty if structure is wrong
    }
  } catch (error) {
    ElMessage.error('Failed to load past orders.');
    console.error('Error fetching past orders:', error);
    allFetchedOrders.value = []; // Ensure it's an array in case of error
  } finally {
    isLoading.value = false;
  }
});

const pastStatuses = ['completed', 'paid'];

const pastOrdersToDisplay = computed(() => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0); 

  const basePastStatuses = ['completed', 'paid']; // Default statuses considered "past"

  return allFetchedOrders.value.filter(order => {
    if (!order.created_at || typeof order.status !== 'string') {
      return false;
    }
    try {
      const orderDate = new Date(order.created_at);
      if (isNaN(orderDate.getTime())) {
        return false;
      }

      const statusLower = order.status.toLowerCase();
      const isPastByDefault = basePastStatuses.includes(statusLower) || orderDate < threeDaysAgo;

      if (!isPastByDefault) { // If it doesn't meet the base criteria for being a "past order", exclude it.
        return false;
      }

      // Apply user-selected status filter (if any)
      if (selectedStatusFilter.value && statusLower !== selectedStatusFilter.value.toLowerCase()) {
        return false;
      }
      
      return true; // Passes all filters
    } catch (e) {
      return false;
    }
  }).sort((a, b) => { 
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
    return dateB.getTime() - dateA.getTime();
  });
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  
  return `${hours}:${minutes}, ${day}-${month}/${year}`;
};

const viewOrder = (order: Order) => {
  selectedOrder.value = order;
};

const deleteOrder = (orderId: number | string) => { // Assuming order.id might be number or string
  // This should ideally call an API and then refresh or filter allFetchedOrders
  allFetchedOrders.value = allFetchedOrders.value.filter(order => order.id !== orderId);
  ElMessage.success('Order removed locally. Implement API call for permanent deletion.');
};

const isEditing = (id: string | number) => editingId.value === id; // Adjusted for potential number ID

const startEditing = (id: string) => {
  editingId.value = id;
  // Focus the input on next tick after it's rendered
  nextTick(() => {
    const input = document.querySelector('.editing-recipient input') as HTMLInputElement;
    if (input) input.focus();
  });
};

const finishEditing = (order: Order) => {
  editingId.value = null;
  updateRecipient(order);
};

const updateRecipient = (order: Order) => {
  // This function will be useful when we connect to backend
  // For now it just updates the local state
  const index = allFetchedOrders.value.findIndex(o => o.id === order.id);
  if (index !== -1) {
    // This direct mutation might not always be ideal for reactivity with computed props
    // if not just recipient is changed. Consider re-fetching or deep cloning if issues arise.
    allFetchedOrders.value[index].recipient = order.recipient;
    ElMessage.success('Recipient updated locally. Implement API call for permanent update.');
  }
};
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
