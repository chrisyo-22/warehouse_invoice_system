import { createApp } from "vue";
import router from "./router/index.ts";
import ElementPlus from 'element-plus';
import "./style.css";
import App from "./App.vue";
import 'element-plus/dist/index.css';
import store from './store';

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.use(store);
app.mount("#app");
