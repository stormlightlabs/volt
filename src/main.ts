import { computed, effect, mount, signal } from "./index";

const count = signal(0);
const message = signal("Welcome to Volt.js!");
const isActive = signal(true);
const inputValue = signal("");

const doubled = computed(() => count.get() * 2, [count]);

effect(() => {
  console.log("Count changed:", count.get());
}, [count]);

const scope = {
  count,
  doubled,
  message,
  isActive,
  inputValue,
  classes: signal({ active: true, highlight: false }),
  increment: () => {
    count.set(count.get() + 1);
  },
  decrement: () => {
    count.set(count.get() - 1);
  },
  reset: () => {
    count.set(0);
  },
  toggleActive: () => {
    isActive.set(!isActive.get());
  },
  updateMessage: () => {
    message.set(`Count is now ${count.get()}`);
  },
  handleInput: (event: Event) => {
    const target = event.target as HTMLInputElement;
    inputValue.set(target.value);
  },
};

const app = document.querySelector("#app");
if (app) {
  mount(app, scope);
}
