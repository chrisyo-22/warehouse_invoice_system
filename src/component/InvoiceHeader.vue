<template>
  <div class="invoice-header">
    <div class="company-info">
      <h1>{{ companyName }}</h1>
      <div class="company-details">
        <el-text class="company-line">{{ address }}</el-text>
        <el-text class="company-line">{{ postalCode }}, {{ province }}</el-text>
        <el-text class="company-line">TEL: {{ telephone }}</el-text>
      </div>
    </div>
    <div class="invoice-title">
      <h2>INVOICE</h2>
      <div class="invoice-details">
        <el-text class="invoice-line">No. {{ invoiceNumber }}</el-text>
        <el-text class="invoice-line">Date: {{ formattedDate }}</el-text>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  invoiceNumber: string;
  date: string;
  companyName: string;
  address: string;
  postalCode: string;
  province: string;
  telephone: string;
}>();

const formattedDate = computed(() => {
  if (!props.date) return '';
  
  try {
    const date = new Date(props.date);
    if (isNaN(date.getTime())) {
      return props.date;
    }
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}-${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return props.date;
  }
});
</script>

<style scoped>
.invoice-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--el-border-color);
  width: 100%;
}

.company-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  text-align: left;
  flex: 1;
}

.company-info h1 {
  margin: 0 0 5px 0;
  font-size: 18px;
  padding: 0;
  font-weight: bold;
  text-align: left;
  width: 100%;
}

.company-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10px;
  text-align: left;
  align-items: flex-start;
  width: 100%;
}

:deep(.company-line) {
  display: block;
  padding: 0;
  margin: 0;
  line-height: 1.2;
  text-indent: 0;
  white-space: pre;
  text-align: left !important;
  width: 100%;
  &.el-text {
    justify-content: flex-start;
  }
  &::before {
    content: none;
  }
  &::after {
    content: none;
  }
}

.invoice-title {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 200px;
  align-items: flex-end;
  margin-right: 15px;
}

.invoice-title h2 {
  margin: 0;
  font-size: 20px;
  margin-right: 15px;
}

.invoice-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10px;
  text-align: right;
  width: 100%;
  margin-right: 15px;
}

:deep(.invoice-line) {
  display: block;
  padding: 0;
  margin: 0;
  line-height: 1.2;
  text-indent: 0;
  white-space: pre;
  text-align: right !important;
  width: 100%;
  &.el-text {
    justify-content: flex-end;
  }
  &::before {
    content: none;
  }
  &::after {
    content: none;
  }
}
</style> 