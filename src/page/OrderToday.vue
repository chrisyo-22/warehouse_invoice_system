<template>
  <div>
    <div v-if="!selectedOrder">
      <div class="header-controls">
        <el-button type="success" @click="addNewOrder" :loading="isLoading">Add New Order</el-button>
        <el-button type="primary" @click="showCreateWithMessageDialog" :loading="isLoading">
          Create from Message
        </el-button>
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
        :data="orders" 
        v-loading="isLoading"
        empty-text="No orders found. Click 'Add New Order' to create one."
      >
        <el-table-column prop="id" label="Order ID" width="180" />
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
const user = computed(() => store.getters['auth/user']);

const orders = ref<Order[]>([]);
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

// Load orders on mount
onMounted(async () => {
  try {
    isLoading.value = true;
    const response = await fetchOrders();
    orders.value = response.data.orders;
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
    orders.value = orders.value.filter(order => order.id !== orderId);
    ElMessage.success('Order deleted successfully');
  } catch (error) {
    ElMessage.error('Failed to delete order');
    console.error('Error deleting order:', error);
  }
};

const addNewOrder = async () => {
  try {
    // Prompt for recipient
    const { value: recipient } = await ElMessageBox.prompt('Who is this order for?', 'New Order', {
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel',
      inputPlaceholder: 'Enter recipient name',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Recipient name cannot be empty';
        }
        return true;
      },
      beforeClose: (action, instance, done) => {
        if (action === 'confirm' && (!instance.inputValue || instance.inputValue.trim() === '')) {
          ElMessage.warning('Please enter a recipient name');
          return;
        }
        done();
      }
    });

    if (recipient && recipient.trim() !== '') {
      // Get current date in UTC
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const newOrder = {
        date: formattedDate,
        recipient: recipient.trim(),
        owner: user.value?.id,
        items: []
      };

      const response = await createOrder(newOrder);
      if (response.data) {
        orders.value.unshift(response.data);
        ElMessage.success('Order created successfully');
        viewOrder(response.data);
      }
    }
  } catch (error) {
    ElMessage.error('Failed to create order');
    console.error('Error creating order:', error);
  }
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
    const index = orders.value.findIndex(o => o.id === order.id);
    if (index !== -1) {
      orders.value[index].recipient = order.recipient;
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
    orders.value.push(result.data);
    ElMessage.success('Order created successfully');
    showMessageDialog.value = false;

  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to create order');
    console.error('Error creating order:', error);
  } finally {
    isCreating.value = false;
  }
};
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
