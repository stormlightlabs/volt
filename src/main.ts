import { mount, signal } from "./index";

const count = signal(0);
const message = signal("Welcome to Volt.js!");
const isActive = signal(true);

const scope = {
  count,
  message,
  isActive,
  classes: signal({ active: true, highlight: false }),
};

const app = document.querySelector("#app");
if (app) {
  mount(app, scope);
}

globalThis.increment = () => {
  count.set(count.get() + 1);
};

globalThis.toggleActive = () => {
  isActive.set(!isActive.get());
};

globalThis.updateMessage = () => {
  message.set(`Count is now ${count.get()}`);
};
