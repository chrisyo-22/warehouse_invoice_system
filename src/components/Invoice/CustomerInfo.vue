<template>
  <div class="customer-info">
    <div class="info-box">
      <span class="info-label">SOLD TO:</span>
      <div class="info-content">
        <div class="info-line">{{ recipient }}</div>
      </div>
    </div>
    <div class="info-box">
      <span class="info-label">SHIP TO:</span>
      <div class="info-content">
        <div class="info-line">{{ recipient }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  recipient: string;
}>();
</script>

<style scoped>
.customer-info {
  display: flex;
  justify-content: space-between;
  margin: 15px 15px;
  gap: 20px;
  width: calc(100% - 30px);
}

.info-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  border: 1px solid var(--el-border-color);
  padding: 10px;
  border-radius: 4px;
  flex: 1;
  text-align: left;
}

.info-label {
  color: var(--el-text-color-secondary);
  font-weight: bold;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color);
  padding-bottom: 5px;
  margin-bottom: 5px;
  text-align: left;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-line {
  font-size: 12px;
  color: var(--el-text-color-primary);
  padding: 0 5px;
  text-align: left;
  line-height: 1.4;
}
</style> 