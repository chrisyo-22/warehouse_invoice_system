<template>
  <div class="items-section" :class="{
    'split-columns': items.length > 20,
    'single-table': items.length <= 20,
    'small-size': items.length <= 5,
    'medium-size': items.length > 5 && items.length <= 20
  }">
    <template v-if="items.length > 20">
      <!-- First Column - max 20 items -->
      <div class="table-wrapper">
        <el-table 
          :data="firstTableItems" 
          border 
          size="small"
        >
          <el-table-column 
            label="#" 
            width="25" 
            align="center"
            header-align="center"
          >
            <template #default="scope">
              {{ (scope.$index + 1).toString().padStart(2, '0') }}
            </template>
          </el-table-column>
          <el-table-column prop="product_name" label="Prod" width="100" align="left" header-align="left" />
          <el-table-column label="Qty" width="60" align="center" header-align="center">
            <template #default="scope">
              {{ scope.row.quantity }} {{ getUnitLabel(scope.row.unit) }}
            </template>
          </el-table-column>
          <el-table-column label="Price" width="60" align="center" header-align="center">
            <template #default="scope">
              ${{ (scope.row.unit_price || 0).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="Net Price" width="60" align="center" header-align="center">
            <template #default="scope">
              ${{ calculateSubtotal(scope.row).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="Desc" min-width="100" align="left" header-align="left" />
        </el-table>
      </div>
      
      <!-- Second Column - remaining items -->
      <div class="table-wrapper">
        <el-table 
          :data="secondTableItems" 
          border 
          size="small"
        >
          <el-table-column 
            label="#" 
            width="25" 
            align="center"
            header-align="center"
          >
            <template #default="scope">
              {{ scope.$index + firstTableItems.length + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="product_name" label="Prod" width="100" align="left" header-align="left" />
          <el-table-column label="Qty" width="60" align="center" header-align="center">
            <template #default="scope">
              {{ scope.row.quantity }} {{ getUnitLabel(scope.row.unit) }}
            </template>
          </el-table-column>
          <el-table-column label="Price" width="60" align="center" header-align="center">
            <template #default="scope">
              ${{ (scope.row.unit_price || 0).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="Net Price" width="60" align="center" header-align="center">
            <template #default="scope">
              ${{ calculateSubtotal(scope.row).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="Desc" min-width="100" align="left" header-align="left" />
        </el-table>
      </div>
    </template>
    
    <!-- Single Column for 20 or fewer items -->
    <el-table 
      v-else
      :data="items" 
      border 
      size="default"
    >
      <el-table-column 
        label="#" 
        width="65" 
        align="center"
        header-align="center"
      >
        <template #default="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="product_name" label="Prod" width="180" align="left" header-align="left" />
      <el-table-column label="Qty" width="100" align="center" header-align="center">
        <template #default="scope">
          {{ scope.row.quantity }} {{ getUnitLabel(scope.row.unit) }}
        </template>
      </el-table-column>
      <el-table-column label="Price" width="120" align="center" header-align="center">
        <template #default="scope">
          ${{ (scope.row.unit_price || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="Net Amt." width="120" align="center" header-align="center">
        <template #default="scope">
          ${{ calculateSubtotal(scope.row).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="Description" min-width="180" align="left" header-align="left" />
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, withDefaults } from 'vue';
import type { Item } from '../../types';

interface Props {
  items: Item[];
  fontSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  fontSize: 11
});

const getUnitLabel = (unit?: string) => {
  return unit || '';
};

const calculateSubtotal = (item: Item) => {
  if (item.quantity > 0 && item.unit_price > 0) {
    return item.quantity * item.unit_price;
  }
  return 0;
};

const firstTableItems = computed(() => {
  return props.items.slice(0, 20);
});

const secondTableItems = computed(() => {
  return props.items.slice(20);
});
</script>

<style scoped>
/* A4 optimization - remove all extra spacing */
.items-section {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

/* Split columns styles - minimize gaps */
.split-columns {
  display: flex;
  gap: 1mm;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

/* Table wrapper styles - remove padding */
.table-wrapper {
  flex: 0 0 calc(50% - 0.5mm);
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  overflow: hidden;
  max-width: calc(50% - 0.5mm);
}

/* Base table styles */
:deep(.el-table) {
  width: 100% !important;
  max-width: 100% !important;
  table-layout: fixed !important;
  margin: 0 !important;
  padding: 0 !important;
  border-spacing: 0 !important;
  overflow: hidden !important;
}

/* Reduce row spacing */
:deep(.el-table__row) {
  height: 18px !important;
}

:deep(.el-table--small td),
:deep(.el-table--small th) {
  padding: 0 !important;
  height: 30px !important;
  line-height: 1 !important;
}

:deep(.el-table__header) th {
  padding: 0 !important;
  height: 20px !important;
  line-height: 1 !important;
}

:deep(.cell) {
  line-height: 1 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 12px !important;
}

/* Remove any table padding */
:deep(.el-table__inner-wrapper),
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper) {
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
  width: 100% !important;
}

/* Center numeric columns */
:deep(.el-table__cell.is-center) .cell {
  justify-content: center !important;
  text-align: center !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* Keep minimal padding for text columns */
:deep(.el-table__cell:not(.is-center)) .cell {
  padding-left: 4px !important;
  padding-right: 4px !important;
}

/* Ensure description column stays within bounds */
:deep(.el-table__cell) {
  overflow: hidden !important;
  white-space: nowrap !important;
  text-overflow: ellipsis !important;
}

:deep(.el-table__cell .cell) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* Adjust column widths for better fit */
:deep(.el-table--small) {
  font-size: v-bind('props.fontSize + "px"') !important;
}

:deep(.el-table--small td),
:deep(.el-table--small th) {
  padding: 0 !important;
}

/* Print-specific styles */
@media print {
  .items-section {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .split-columns {
    gap: 2mm !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
  }

  .table-wrapper {
    flex: 0 0 calc(50% - 1mm) !important;
    max-width: calc(50% - 1mm) !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
  }
}

/* Dynamic font size based on prop */
.split-columns :deep(.el-table) {
  font-size: v-bind('props.fontSize + "px"');
}

.single-table :deep(.el-table) {
  font-size: v-bind('(props.fontSize + 3) + "px"');  /* Slightly larger for single table */
}

/* Header styles */
:deep(.el-table__header) {
  font-weight: bold;
  background-color: var(--el-fill-color-light);
}
</style> 