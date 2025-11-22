/**
 * Generate a minimal VoltX.js project with declarative mode.
 */
export function generateMinimalHTML(projectName: string): string {
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

      <div class="counter">
        <button data-volt-on-click="count.set(count.get() - 1)">-</button>
        <span data-volt-text="count"></span>
        <button data-volt-on-click="count.set(count.get() + 1)">+</button>
      </div>

      <p class="hint">Edit this file to start building your app!</p>
    </div>
  </div>

  <script type="module">
    import { charge, registerPlugin, persistPlugin } from './voltx.min.js';

    registerPlugin('persist', persistPlugin);
    charge();
  </script>
</body>
</html>
`;
}

export function generateMinimalCSS(): string {
  return `/* Custom styles for your VoltX.js app */

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.container {
  max-width: 600px;
  margin: 4rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  margin: 0 0 2rem;
  color: #2563eb;
}

.counter {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
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
}

.hint {
  margin-top: 2rem;
  color: #666;
  font-size: 0.9rem;
}
`;
}

export function generateMinimalPackageJSON(projectName: string): string {
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

export function generateMinimalREADME(projectName: string): string {
  return `# ${projectName}

A minimal VoltX.js application.

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

## Project Structure

- \`index.html\` - Main HTML file with declarative VoltX.js markup
- \`styles.css\` - Custom styles
- \`voltx.min.js\` - VoltX.js framework (ES module)
- \`voltx.min.css\` - VoltX.js base styles

## Learn More

- [VoltX.js Documentation](https://stormlightlabs.github.io/volt)
- [API Reference](https://stormlightlabs.github.io/volt/api)
`;
}
