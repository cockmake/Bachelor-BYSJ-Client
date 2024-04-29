import {createApp} from 'vue'
import App from './App.vue'
import axios from "axios";
import 'element-plus/dist/index.css'
import router from "./routers.js";

axios.defaults.baseURL = "http://127.0.0.1:8001"

const app = createApp(App)
app.use(router)
app.mount('#app')