<template>
  <div>
    <div class="print-controls" v-if="!isPrinting">
      <div class="font-controls">
        <span>Table Font Size:</span>
        <el-button-group>
          <el-button size="small" @click="decreaseFontSize">-</el-button>
          <el-button size="small" @click="increaseFontSize">+</el-button>
        </el-button-group>
        <span>{{ tableFontSize }}px</span>
      </div>
      <div class="action-buttons">
        <el-radio-group v-model="viewType" size="small">
          <el-radio-button label="invoice">Invoice</el-radio-button>
          <el-radio-button label="picker">Picker List</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="print">Print</el-button>
        <el-button @click="goBack">Back</el-button>
      </div>
    </div>
    
    <div class="invoice-container">
      <div class="invoice-content">
        <InvoiceHeader
          :invoice-number="invoiceNumber"
          :date="date"
          :company-name="companyInfo?.company_name"
          :address="companyInfo?.address"
          :postal-code="companyInfo?.postal_code"
          :province="companyInfo?.province"
          :telephone="companyInfo?.telephone"
        />
        
        <CustomerInfo
          :recipient="recipient"
        />
        
        <InvoiceItems
          v-if="viewType === 'invoice'"
          :items="items"
          :font-size="tableFontSize"
        />
        
        <PickerItems
          v-else
          :items="items"
          :font-size="tableFontSize"
        />
        
        <div v-if="viewType === 'invoice'" class="invoice-footer">
          <SignatureField />
          <InvoiceTotals
            :sub-total="grandTotal"
            :tax="0"
            :total="grandTotal"
          />
        </div>
      </div>
      
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import type { Item } from '../../types';
import InvoiceHeader from '../component/InvoiceHeader.vue';
import CustomerInfo from '../component/CustomerInfo.vue';
import InvoiceItems from '../component/InvoiceItems.vue';
import InvoiceTotals from '../component/InvoiceTotals.vue';
import SignatureField from '../component/SignatureField.vue';
import PickerItems from '../component/PickerItems.vue';

const router = useRouter();
const store = useStore();
const invoiceData = computed(() => {
  const data = store.getters.getInvoiceData;
  return data;
});

const owner = computed(() => invoiceData.value.owner);
const recipient = computed(() => invoiceData.value.recipient);
const date = computed(() => invoiceData.value.date);
const items = computed(() => invoiceData.value.items);
const companyInfo = computed(() => store.getters['auth/user']);
const invoiceNumber = computed(() => {
  return invoiceData.value.invoice_number;
});

const isPrinting = ref(false);
const tableFontSize = ref(11); // Default font size

const increaseFontSize = () => {
  if (tableFontSize.value < 35) {
    tableFontSize.value++;
  }
};

const decreaseFontSize = () => {
  if (tableFontSize.value > 3) {
    tableFontSize.value--;
  }
};

const print = () => {
  isPrinting.value = true;
  window.print();
  isPrinting.value = false;
};

const goBack = () => {
  router.back();
};

const grandTotal = computed(() => {
  return items.value.reduce((sum: number, item: Item) => {
    if (item.quantity > 0 && item.unit_price > 0) {
      return sum + (item.quantity * item.unit_price);
    }
    return sum;
  }, 0);
});

const viewType = ref<'invoice' | 'picker'>('invoice');
</script>

<style scoped>
@media print {
  @page {
    margin: 0.3cm;
    size: A4;
  }
  
  /* Hide print controls */
  .print-controls {
    display: none !important;
  }

  /* Hide any other controls */
  .el-button,
  .font-controls,
  .action-buttons {
    display: none !important;
  }

  /* Force single page */
  .invoice-container {
    page-break-before: avoid;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
}

.invoice-container {
  max-width: 210mm;
  margin: 10px auto;
  padding: 5px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 100px);
  box-sizing: border-box;
}

.invoice-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.invoice-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
  width: 100%;
}

.print-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  justify-content: flex-end;
  align-items: center;
}

.font-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}
</style> 