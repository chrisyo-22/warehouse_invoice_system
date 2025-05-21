<template>
  <div class="invoice-items" :class="{
    'split-columns': items.length > 20,
    'single-table': items.length <= 20
  }">
    <template v-if="items.length > 20">
      <div v-for="i in Math.ceil(itemChunks.length / 2)" :key="i" class="table-row">
        <div class="table-chunk">
          <el-table :data="itemChunks[(i-1)*2]" border style="width: 100%" size="small" :style="{ fontSize: props.fontSize + 'px' }">
            <!-- Checkbox Column -->
            <el-table-column width="40" align="center" header-align="center">
              <template #header>
                <div class="checkbox-header">✓</div>
              </template>
              <template #default>
                <div class="checkbox-cell">
                  <span class="checkbox">□</span>
                </div>
              </template>
            </el-table-column>

            <!-- Order Number -->
            <el-table-column label="#" width="40" align="center" header-align="center">
              <template #default="{ $index }">
                {{ $index + 1 + ((i-1)*2 * ITEMS_PER_PAGE) }}
              </template>
            </el-table-column>

            <!-- Product Name -->
            <el-table-column 
              prop="product_name" 
              label="Product Name" 
              width="140" 
              align="left" 
              header-align="left"
              show-overflow-tooltip
            />

            <!-- Quantity -->
            <el-table-column label="Qty" width="60" align="center" header-align="center">
              <template #default="{ row }">
                {{ row.quantity }} {{ row.unit || '' }}
              </template>
            </el-table-column>

            <!-- Description -->
            <el-table-column 
              prop="description" 
              label="Description" 
              min-width="100" 
              align="left" 
              header-align="left"
              show-overflow-tooltip
            />
          </el-table>
        </div>
        <div v-if="itemChunks[(i-1)*2 + 1]" class="table-chunk">
          <el-table :data="itemChunks[(i-1)*2 + 1]" border style="width: 100%" size="small" :style="{ fontSize: props.fontSize + 'px' }">
            <!-- Same columns as above -->
            <el-table-column width="40" align="center" header-align="center">
              <template #header>
                <div class="checkbox-header">✓</div>
              </template>
              <template #default>
                <div class="checkbox-cell">
                  <span class="checkbox">□</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="#" width="40" align="center" header-align="center">
              <template #default="{ $index }">
                {{ $index + 1 + (((i-1)*2 + 1) * ITEMS_PER_PAGE) }}
              </template>
            </el-table-column>

            <el-table-column 
              prop="product_name" 
              label="Product Name" 
              width="140" 
              align="left" 
              header-align="left"
              show-overflow-tooltip
            />

            <el-table-column label="Qty" width="60" align="center" header-align="center">
              <template #default="{ row }">
                {{ row.quantity }} {{ row.unit || '' }}
              </template>
            </el-table-column>

            <el-table-column 
              prop="description" 
              label="Description" 
              min-width="100" 
              align="left" 
              header-align="left"
              show-overflow-tooltip
            />
          </el-table>
        </div>
      </div>
    </template>

    <!-- Single table for 20 or fewer items -->
    <el-table 
      v-else
      :data="items" 
      border 
      size="small"
      :style="{ fontSize: props.fontSize + 'px' }"
    >
      <el-table-column width="40" align="center" header-align="center">
        <template #header>
          <div class="checkbox-header">✓</div>
        </template>
        <template #default>
          <div class="checkbox-cell">
            <span class="checkbox">□</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="#" width="40" align="center" header-align="center">
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </el-table-column>

      <el-table-column 
        prop="product_name" 
        label="Product Name" 
        width="200" 
        align="left" 
        header-align="left"
        show-overflow-tooltip
      />

      <el-table-column label="Qty" width="80" align="center" header-align="center">
        <template #default="{ row }">
          {{ row.quantity }} {{ row.unit || '' }}
        </template>
      </el-table-column>

      <el-table-column 
        prop="description" 
        label="Description" 
        min-width="200" 
        align="left" 
        header-align="left"
        show-overflow-tooltip
      />
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, computed } from 'vue';
import type { Item } from '../../types';

const ITEMS_PER_PAGE = 20;

const props = withDefaults(defineProps<{
  items: Item[];
  fontSize?: number;
}>(), {
  fontSize: 11
});

const itemChunks = computed(() => {
  const chunks = [];
  for (let i = 0; i < props.items.length; i += ITEMS_PER_PAGE) {
    chunks.push(props.items.slice(i, i + ITEMS_PER_PAGE));
  }
  return chunks;
});
</script>

<style scoped>
.invoice-items {
  margin: 20px 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.table-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 1mm;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.table-chunk {
  flex: 0 0 calc(50% - 0.5mm);
  width: calc(50% - 0.5mm);
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

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

:deep(.el-table--small) {
  /* font-size declaration removed */
}

:deep(.el-table--small td),
:deep(.el-table--small th) {
  padding: 0 !important;
  height: 18px !important;
  line-height: 1 !important;
}

:deep(.el-table__header) th {
  padding: 0 !important;
  height: 30px !important;
  line-height: 1 !important;
}

:deep(.cell) {
  line-height: 1 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 16px !important;
}

:deep(.el-table__inner-wrapper),
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper) {
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
  width: 100% !important;
}

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

:deep(.el-table__cell.is-center) .cell {
  justify-content: center !important;
  text-align: center !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

:deep(.el-table__cell:not(.is-center)) .cell {
  padding-left: 4px !important;
  padding-right: 4px !important;
}

.checkbox-header {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-size: 18px;
  font-weight: bold;
}

.checkbox-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.checkbox {
  font-family: monospace;
  font-size: 24px;
  line-height: 1;
  padding: 4px;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media print {
  .invoice-items {
    margin: 10px 0;
  }
  
  .checkbox {
    border-color: #000;
  }

  .table-row {
    gap: 2mm !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
  }

  .table-chunk {
    flex: 0 0 calc(50% - 1mm) !important;
    max-width: calc(50% - 1mm) !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
  }
}

.single-table {
  width: 100%;
}

.single-table :deep(.el-table) {
  width: 100% !important;
}

.split-columns :deep(.el-table) {
  width: 100% !important;
}
</style> 