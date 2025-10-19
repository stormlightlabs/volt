import { persistPlugin } from "$plugins/persist";
import { scrollPlugin } from "$plugins/scroll";
import { urlPlugin } from "$plugins/url";
import { computed, effect, mount, registerPlugin, signal } from "$volt";

registerPlugin("persist", persistPlugin);
registerPlugin("scroll", scrollPlugin);
registerPlugin("url", urlPlugin);

const count = signal(0);
const message = signal("Welcome to Volt.js!");
const isActive = signal(true);
const inputValue = signal("");
const scrollPos = signal(0);
const section1Visible = signal(false);
const section2Visible = signal(false);

const doubled = computed(() => count.get() * 2);

effect(() => {
  console.log("Count changed:", count.get());
});

const scope = {
  count,
  doubled,
  message,
  isActive,
  inputValue,
  scrollPos,
  section1Visible,
  section2Visible,
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
