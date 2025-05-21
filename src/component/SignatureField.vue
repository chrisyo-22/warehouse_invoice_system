<template>
  <div class="signature-field">
    <div class="signature-label">Recipient:</div>
    <div class="signature-line">_____________________</div>
  </div>
</template>

<style scoped>
.signature-field {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 20px 15px;
  margin-bottom: 20px;
}

.signature-label {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.signature-line {
  font-size: 14px;
  color: var(--el-text-color-primary);
  letter-spacing: 2px;
  min-width: 150px;
}
</style> 