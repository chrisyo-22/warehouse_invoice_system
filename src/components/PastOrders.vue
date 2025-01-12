<template>
  <div>
    <el-table :data="pastOrders">
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
    <OrderList v-if="selectedOrder" :order="selectedOrder" @back="selectedOrder = null" />
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick } from 'vue';
import OrderList from './OrderList.vue';
import type { Order } from '../types';

const pastOrders = ref<Order[]>([]);
const selectedOrder = ref<Order | null>(null);
const editingId = ref<string | null>(null);

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

const deleteOrder = (orderId: string) => {
  pastOrders.value = pastOrders.value.filter(order => order.id !== orderId);
};

const isEditing = (id: string) => editingId.value === id;

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
  const index = pastOrders.value.findIndex(o => o.id === order.id);
  if (index !== -1) {
    pastOrders.value[index].recipient = order.recipient;
  }
};
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
