<template>
  <div class="totals-wrapper">
    <div class="totals-section">
      <div class="total-row">
        <div class="total-label">Sub-Total:</div>
        <div class="total-amount">${{ subTotal.toFixed(2) }}</div>
      </div>
      <div class="total-row">
        <div class="total-label">Tax:</div>
        <div class="total-amount">${{ tax.toFixed(2) }}</div>
      </div>
      <div class="total-row final">
        <div class="total-label">Total:</div>
        <div class="total-amount">${{ total.toFixed(2) }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  subTotal: number;
  tax: number;
  total: number;
}>();
</script>

<style scoped>
.totals-wrapper {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  padding: 15px 15px;
  padding-right: 75px;
  margin-bottom: 20px;
}

.totals-section {
  width: 300px;
  border: 1px solid var(--el-border-color);
  margin-right: 60px;
  margin-bottom: 0;
}

.total-row {
  display: flex;
  align-items: center;
  height: 45px;
  border-bottom: 1px solid var(--el-border-color);
  font-size: 14px;
}

.total-row:last-child {
  border-bottom: none;
}

.total-label {
  flex: 0 0 150px;
  background-color: var(--el-fill-color-light);
  padding: 0 15px;
  height: 100%;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--el-border-color);
  font-size: 14px;
}

.total-amount {
  flex: 1;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 14px;
}

.total-row.final {
  font-weight: bold;
  font-size: 16px;
}

@media print {
  .totals-section {
    page-break-inside: avoid;
  }
}
</style> 