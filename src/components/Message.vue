<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      messages: [] as { from: string; body: string }[], // Define the message array
    };
  },
  async mounted() {
    try {
      const res = await fetch("http://localhost:8000/messages");
      this.messages = await res.json();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  },
});
</script>

<template>
  <div>
    <h1>Received Messages</h1>
    <ul>
      <li v-for="(message, index) in messages" :key="index">
        <strong>From:</strong> {{ message.from }} <br />
        <strong>Message:</strong> {{ message.body }}
      </li>
    </ul>
  </div>
</template>
