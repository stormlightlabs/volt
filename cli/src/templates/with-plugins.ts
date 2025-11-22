/**
 * Generate a VoltX.js project with all plugins pre-registered.
 */
export function generatePluginsHTML(projectName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <link rel="stylesheet" href="voltx.min.css">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div data-volt data-volt-state='{"count": 0, "message": "Hello VoltX!"}'>
    <div class="container">
      <h1 data-volt-text="message"></h1>

      <!-- Persist plugin demo -->
      <div class="card">
        <h2>Persist Plugin</h2>
        <p>This counter persists to localStorage:</p>
        <div class="counter">
          <button data-volt-on-click="count.set(count.get() - 1)">-</button>
          <span data-volt-text="count" data-volt-persist="count"></span>
          <button data-volt-on-click="count.set(count.get() + 1)">+</button>
        </div>
        <p class="hint">Refresh the page - your count is saved!</p>
      </div>

      <!-- Scroll plugin demo -->
      <div class="card">
        <h2>Scroll Plugin</h2>
        <p>Smooth scroll to sections:</p>
        <button data-volt-scroll-to="#section-1">Scroll to Section 1</button>
        <button data-volt-scroll-to="#section-2">Scroll to Section 2</button>
      </div>

      <!-- URL plugin demo -->
      <div class="card">
        <h2>URL Plugin</h2>
        <p>State synced with URL params:</p>
        <input type="text" data-volt-model="message" data-volt-url-param="msg">
        <p class="hint">Your message is in the URL!</p>
      </div>

      <!-- Surge plugin demo -->
      <div class="card">
        <h2>Surge Plugin (Animations)</h2>
        <button data-volt-on-click="$scope.toggle('showBox', !$scope.get('showBox'))">
          Toggle Box
        </button>
        <div
          data-volt-if="$scope.get('showBox')"
          data-volt-surge="fade"
          class="animated-box"
        >
          I fade in and out!
        </div>
      </div>

      <div id="section-1" class="section">
        <h3>Section 1</h3>
        <p>This is a scrollable section.</p>
      </div>

      <div id="section-2" class="section">
        <h3>Section 2</h3>
        <p>Scroll here with smooth animations!</p>
      </div>
    </div>
  </div>

  <script type="module">
    import {
      charge,
      registerPlugin,
      persistPlugin,
      scrollPlugin,
      urlPlugin,
      surgePlugin,
      navigatePlugin
    } from './voltx.min.js';

    // Register all plugins
    registerPlugin('persist', persistPlugin);
    registerPlugin('scroll', scrollPlugin);
    registerPlugin('url', urlPlugin);
    registerPlugin('surge', surgePlugin);
    registerPlugin('navigate', navigatePlugin);

    charge();
  </script>
</body>
</html>
`;
}

export function generatePluginsCSS(): string {
  return `/* Custom styles for your VoltX.js app */

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 3rem;
  color: #2563eb;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.card h2 {
  margin-top: 0;
  color: #1e40af;
}

.counter {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin: 1.5rem 0;
}

.counter button {
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
  border: 2px solid #2563eb;
  background: white;
  color: #2563eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.counter button:hover {
  background: #2563eb;
  color: white;
}

.counter span {
  font-size: 2rem;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

button:not(.counter button) {
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.5rem;
}

button:not(.counter button):hover {
  background: #1e40af;
}

input[type="text"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin: 1rem 0;
}

input[type="text"]:focus {
  outline: none;
  border-color: #2563eb;
}

.hint {
  color: #666;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.animated-box {
  margin-top: 1.5rem;
  padding: 2rem;
  background: #dbeafe;
  border: 2px solid #2563eb;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  color: #1e40af;
}

.section {
  margin-top: 3rem;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 300px;
}

.section h3 {
  margin-top: 0;
  color: #2563eb;
}
`;
}

export function generatePluginsPackageJSON(projectName: string): string {
  return JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      type: "module",
      scripts: { dev: "voltx dev", build: "voltx build" },
      devDependencies: { "create-voltx": "^0.1.0" },
    },
    null,
    2,
  );
}

export function generatePluginsREADME(projectName: string): string {
  return `# ${projectName}

A VoltX.js application with all plugins pre-registered.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

3. Open your browser to the URL shown in the terminal.

## Included Plugins

This project includes all VoltX.js plugins:

- **Persist Plugin**: Save state to localStorage/sessionStorage
- **Scroll Plugin**: Smooth scrolling and scroll restoration
- **URL Plugin**: Sync state with URL parameters
- **Surge Plugin**: Declarative animations (fade, slide, scale)
- **Navigate Plugin**: Client-side routing

## Learn More

- [VoltX.js Documentation](https://stormlightlabs.github.io/volt)
- [Plugin Reference](https://stormlightlabs.github.io/volt/plugins)
`;
}
