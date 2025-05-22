<template>
  <div>
    <!-- Back Button -->
    <div class="header-controls">
      <el-button @click="$emit('back')">Back</el-button>
      <el-button 
        v-if="props.order?.original_message"
        type="info"
        @click="showOriginalMessage = !showOriginalMessage"
      >
        {{ showOriginalMessage ? 'Hide Message' : 'Show Message' }}
      </el-button>
    </div>
    
    <!-- Add the draggable message box -->
    <div
      v-if="showOriginalMessage && props.order?.original_message"
      class="floating-message"
      ref="draggableBox"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      @mousedown="startDrag"
    >
      <div class="floating-message-header">
        <span>Original Message</span>
        <el-button
          type="text"
          @click="showOriginalMessage = false"
          class="close-button"
        >
          ×
        </el-button>
      </div>
      <pre class="floating-message-content">{{ props.order.original_message }}</pre>
    </div>
    
    <div class="order-list-container">
      <!-- Recipient and Date -->
      <div class="order-info">
        <div class="info-left">
          <div class="recipient">{{ recipient }}</div>
          <div class="item-count">Items: {{ items.length }}</div>
        </div>
        <div class="order-date">{{ formatDate(props.order.date) }}</div>
      </div>
      
      <el-table :data="items" border style="width: 100%;">
        <!-- Product Name -->
        <el-table-column prop="product_name" label="Product Name" :min-width="150" :resizable="true">
          <template #default="{ row, column }">
            <div :class="[
        'table-v2-inline-editing-trigger',
        { 'disable-hover': isCellEditing(row.id, column.property) }
      ]" @mouseenter="setHoveredCell(row.id, column.property)" @mouseleave="clearHoveredCell"
                @click="setEditingCell(row.id, column.property)">
              <span v-if="!isCellEditing(row.id, 'product_name') && row.product_name">
                {{ row.product_name }}
              </span>
              <el-input v-else v-model="row.product_name" placeholder="Enter product name" @blur="clearEditingCell"
                :class="{ 'red-highlight': isNameEmpty(row) }"></el-input>
            </div>
          </template>
        </el-table-column>
    
        <!-- Description -->
        <el-table-column prop="description" label="Description" :min-width="200" :resizable="true">
          <template #default="{ row, column }">
            <div :class="[
        'table-v2-inline-editing-trigger',
        { 'disable-hover': isCellEditing(row.id, 'description') }
      ]" @mouseenter="setHoveredCell(row.id, column.property)" @mouseleave="clearHoveredCell"
                @click="setEditingCell(row.id, column.property)">
              <span v-if="!isCellEditing(row.id, 'description') && row.description">
                {{ row.description }}
              </span>
              <el-input v-else v-model="row.description" placeholder="Enter description" @blur="clearEditingCell"></el-input>
            </div>
          </template>
        </el-table-column>

        <!-- Quantity -->
        <el-table-column prop="quantity" label="Quantity" :min-width="100" :resizable="true">
          <template #default="{ row }">
            <div class="quantity-cell">
              <!-- Editable input for quantity -->
              <el-input v-model.number="row.quantity" type="number" autofocus="true" class="editable-input"
                placeholder="Enter quantity" @input="validatePositive(row, 'quantity')" @blur="updateTotals"></el-input>
              <!-- Buttons for increment and decrement -->
              <div class="button-group">
                <el-button size="mini" type="danger" circle @click="decreaseQuantity(row)">-</el-button>
                <el-button size="mini" type="primary" circle @click="increaseQuantity(row)">+</el-button>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Unit -->
        <el-table-column prop="unit" label="Unit" width="120">
          <template #default="{ row }">
            <el-select 
              v-model="row.unit" 
              placeholder="Select unit"
              :empty-values="[null, undefined]"
              :value-on-clear="null"
              clearable
              @clear="row.unit = null"
            >
              <el-option
                v-for="option in unitOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <!-- Unit Price -->
        <el-table-column prop="unit_price" label="Unit Price" :min-width="100" :resizable="true">
          <template #default="{ row }">
            <el-input v-model.number="row.unit_price" type="number" placeholder="Enter unit price" @blur="updateTotals"
              class="editable-input" :controls=false></el-input>
          </template>
        </el-table-column>

        <!-- Subtotal -->
        <el-table-column prop="subtotal" label="Subtotal" :min-width="100" :resizable="true">
          <template #default="{ row }">
            <span>{{ calculateSubtotal(row) }}</span>
          </template>
        </el-table-column>

        <!-- Actions -->
        <el-table-column label="Actions" width="120">
          <template #default="{ row, $index }">
            <el-button
              type="danger"
              size="small"
              @click="deleteItem($index)"
              :disabled="isDeleting"
            >
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- Grand Total -->
      <div class="grand-total">
        Grand Total: {{ grandTotal }}
      </div>
      
      <!-- Save and Add New Row Buttons -->
      <div class="table-actions">
        <el-button 
          type="primary" 
          @click="saveItems"
          :loading="isSaving"
          class="save-button"
        >
          Save Changes
        </el-button>
        <el-button type="success" @click="addNewRow">Add New Row</el-button>
      </div>
      
      <!-- Action Buttons -->
      <div class="action-buttons">
        <el-button type="primary" @click="showPrintView">Print Invoice</el-button>
      </div>
      
      <!-- Add this for the print view -->
      <div v-if="showingPrintView" class="print-view">
        <Invoice
          :owner="props.order?.owner || 'Unknown'"
          :recipient="recipient"
          :date="formatDate(props.order.date)"
          :items="items"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, defineProps, h, onUnmounted } from "vue";
import { useRouter } from 'vue-router';
import { useStore } from 'https://esm.sh/vuex@4.0.2?bundle';
import type { Order, Item } from '../types';
import Invoice from '../page/Invoice.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { updateOrder } from '../utils/apiClient';

const router = useRouter();
const store = useStore();

// Update unit options to handle empty state better
const unitOptions = [
  { value: 'lb', label: 'lb' },
  { value: 'boxes', label: 'boxes' },
  { value: 'pcs', label: 'pcs' },
  { value: 'skids', label: 'skids' }
];

// Define props to receive order data
const props = defineProps<{
  order: {
    id: string | number;
    date: string;
    recipient: string;
    owner: string;
    items: any[];
    created_at?: string;
    updated_at?: string;
    original_message?: string;
  };
}>();

// Initialize with empty arrays first
const items = ref<Item[]>([]);
const recipient = ref("");
const orderDate = ref<Date>(new Date());

// Set initial values
onMounted(() => {
  if (props.order) {
    recipient.value = props.order.recipient;
    orderDate.value = new Date(props.order.date);
    
    console.log('Raw order data:', props.order);
    
    // Initialize items array with at least one empty row if no items exist
    if (!props.order.items || props.order.items.length === 0) {
      items.value = [{
        id: 'row-1',
        name: '',
        description: '',
        quantity: 0,
        unit: null,
        unitPrice: 0,
        subtotal: 0
      }];
    } else {
      // Initialize existing items with proper structure
      items.value = props.order.items.map((item, index) => {
        console.log(`Raw item ${index}:`, JSON.stringify(item, null, 2));
        return {
          id: `row-${index + 1}`,
          product_name: item.product_name || '',
          description: item.description || '',
          quantity: Number(item.quantity) || 0,
          unit: item.unit,
          unit_price: Number(item.unit_price) || 0,
          subtotal: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
        };
      });
    }
  }
});

// Update the type definitions for hover and edit states
interface CellState {
  rowId: string | null;
  property: string | null;
}

const hoveredCell = ref<CellState>({ rowId: null, property: null });
const editingCell = ref<CellState>({ rowId: null, property: null });

// Functions to manage hover and edit states
const setHoveredCell = (rowId: string, property: string) => {
  hoveredCell.value = { rowId, property };
};

const clearHoveredCell = () => {
  hoveredCell.value = { rowId: null, property: null };
};

const setEditingCell = (rowId: string, property: string) => {
  editingCell.value = { rowId, property };
};

const clearEditingCell = () => {
  editingCell.value = { rowId: null, property: null };
};

// Check if a cell is being edited
const isCellEditing = (rowId: string, property: string) => {
  return editingCell.value?.rowId === rowId && editingCell.value?.property === property;
};

// Check if the name field is empty
const isNameEmpty = (row: any) => {
  return !row.product_name || row.product_name.trim() === '';
};

// Update the validate function with proper typing
const validatePositive = (row: Item, field: 'quantity' | 'unitPrice') => {
  const value = row[field];
  if (typeof value === 'number' && value < 0) {
    row[field] = 0;
  }
};

// Increase quantity
const increaseQuantity = (row: Item) => {
  row.quantity += 1;
  updateTotals();
};

// Decrease quantity
const decreaseQuantity = (row: Item) => {
  if (row.quantity > 0) {
    row.quantity -= 1;
    updateTotals();
  }
};

// Calculate subtotal for each row
const calculateSubtotal = (row: any) => {
  if (!row) return 0;
  
  if (typeof row.quantity === 'number' && 
      typeof row.unit_price === 'number' && 
      row.quantity > 0 && 
      row.unit_price > 0) {
    return row.quantity * row.unit_price;
  }
  return 0;
};

// Calculate grand total
const grandTotal = computed(() => {
  // Filter out null items and sum only valid items
  return items.value
    .filter((item): item is Item => item !== null)
    .reduce((sum, item) => sum + calculateSubtotal(item), 0);
});

// Update totals after changes
const updateTotals = () => {
  items.value.forEach(item => {
    item.subtotal = calculateSubtotal(item);
  });
};

// Function to add a new row
const addNewRow = () => {
  const newRow = {
    id: `row-${items.value.length + 1}`,
    product_name: '',
    description: '',
    quantity: 0,
    unit_price: 0,
    unit: null,
    subtotal: 0
  };
  items.value = [...items.value, newRow];
  updateTotals();
}; 

const showingPrintView = ref(false);

const showPrintView = () => {
  // Check for zero prices or quantities
  const hasZeroValues = items.value.some(item => 
    item.quantity === 0 || item.unit_price === 0 || !item.unit_price
  );

  // Prepare invoice data
  const invoiceData = {
    owner: props.order?.owner || 'Unknown',
    recipient: recipient.value,
    date: formatDate(props.order.date),
    invoice_number: props.order.invoice_number,
    items: items.value
  };

  console.log('Saving invoice data to Vuex:', invoiceData); // Debug log

  if (hasZeroValues) {
    ElMessageBox.confirm(
      'Some items have zero quantities or prices. Do you want to continue to print view?',
      'Warning',
      {
        confirmButtonText: 'Yes, Continue',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    ).then(() => {
      // Save invoice data to Vuex store
      store.dispatch('saveInvoiceData', invoiceData);
      
      // Navigate to invoice preview
      router.push({ name: 'InvoicePreview' });
    }).catch(() => {
      // User cancelled
    });
  } else {
    // Save invoice data to Vuex store
    store.dispatch('saveInvoiceData', invoiceData);
    
    // Navigate to invoice preview
    router.push({ name: 'InvoicePreview' });
  }
};

// Add formattedDate computed property
const formattedDate = computed(() => {
  return orderDate.value.toLocaleDateString();
});

// Add these new refs
const isSaving = ref(false);
const isDeleting = ref(false);
const deletedItems = ref<number[]>([]);

// Add these new functions
const deleteItem = (index: number) => {
  items.value.splice(index, 1);
  deletedItems.value.push(index);
  updateTotals();
};

// Add validation function
const validateItems = () => {
  const invalidItems = items.value.map((item, index) => {
    const errors = [];
    if (!item.product_name || item.product_name.trim() === '') {
      errors.push('Product name is required');
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    // Remove unit price validation since it's optional
    return { index: index + 1, errors };
  }).filter(item => item.errors.length > 0);

  return invalidItems;
};

// Update the saveItems function to handle order ID type
const saveItems = async () => {
  try {
    // Validate items before saving
    const invalidItems = validateItems();
    if (invalidItems.length > 0) {
      // Create error message
      const errorMessages = invalidItems.map(item => 
        `Row ${item.index}: ${item.errors.join(', ')}`
      );
      
      ElMessage.error({
        message: h('div', {}, [
          h('div', 'Please fix the following errors:'),
          h('div', { style: 'margin-top: 10px' }, 
            errorMessages.map(msg => h('div', { style: 'color: #F56C6C' }, msg))
          )
        ]),
        duration: 5000
      });
      return;
    }

    isSaving.value = true;
    
    // Prepare the data for the backend
    const orderData = {
      items: items.value.map(item => ({
        product_name: item.product_name,
        description: item.description || '',
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        unit: item.unit,
        subtotal: calculateSubtotal(item)
      }))
    };

    // Convert order ID to number if it's a string
    const orderId = typeof props.order.id === 'string' ? parseInt(props.order.id) : props.order.id;
    
    // Call the backend API to update the order
    await updateOrder(orderId, orderData);
    
    // Clear the deleted items array after successful save
    deletedItems.value = [];
    
    // Show success message
    ElMessage.success('Changes saved successfully');
  } catch (error) {
    ElMessage.error('Failed to save changes');
    console.error('Error saving items:', error);
  } finally {
    isSaving.value = false;
  }
};

// Add the formatDate function
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

// Add these new refs and functions for drag functionality
const draggableBox = ref<HTMLElement | null>(null);
const position = ref({ x: 20, y: 20 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const startDrag = (e: MouseEvent) => {
  if (!draggableBox.value) return;
  
  isDragging.value = true;
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  };

  // Add event listeners
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  
  position.value = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// Clean up event listeners when component is unmounted
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});

// Add these new refs and functions for drag functionality
const showOriginalMessage = ref(false);
</script >

<style scoped>
.order-list-container {
  max-width: 100%; /* Ensure container does not exceed body width */
  margin: 0 auto; /* Center the container */
  padding: 20px; /* Add some padding for aesthetics */
  box-sizing: border-box; /* Include padding and border in element's total width and height */
}

.order-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.info-left {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.recipient {
  font-size: 1.5em;
  font-weight: bold;
}

.item-count {
  font-size: 1em;
  color: #666;
}

.order-date {
  font-size: 1em;
  color: #666;
}

.el-table {
  width: 100%; /* Ensure table takes full width of container */
  box-sizing: border-box; /* Include padding and border in element's total width and height */
}

.grand-total, .add-row-button {
  margin-top: 10px;
  text-align: right;
  font-weight: bold;
  padding-right: 10px; /* Add padding to align with table */
  box-sizing: border-box; /* Include padding and border in element's total width and height */
}

.quantity-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.button-group {
  display: flex;
  gap: 5px;
}

.red-highlight {
  border: 1px solid red !important;
  background-color: #ffe6e6; /* Light red background */
  --el-color-primary: none;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

/* Hide the print view by default */
.print-view {
  display: none;
}

/* Show only the print view when printing */
@media print {
  .print-view {
    display: block;
  }
  
  /* Hide everything else when printing */
  .order-list-container,
  .action-buttons {
    display: none;
  }
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 20px;
}

.save-button {
  background-color: #409EFF;
  color: white;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.floating-message {
  position: fixed;
  z-index: 1000;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  min-width: 300px;
  max-width: 500px;
  cursor: move;
  resize: both;
  overflow: auto;
}

.floating-message-header {
  padding: 8px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}

.floating-message-content {
  padding: 16px;
  white-space: pre-wrap;
  font-family: monospace;
  margin: 0;
  min-height: 100px;
  max-height: 400px;
  overflow-y: auto;
}

.close-button {
  font-size: 20px;
  line-height: 1;
  color: #909399;
}

.close-button:hover {
  color: #409EFF;
}
</style>

