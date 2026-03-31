import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import { messages } from "./locales";
import "./styles/global.css";

const saved =
  typeof localStorage !== "undefined" ? localStorage.getItem("locale") : null;
const locale = saved === "en" || saved === "zh" ? saved : "zh";

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: "en",
  messages,
});

createApp(App).use(i18n).mount("#app");
