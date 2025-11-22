/**
 * Generate a styles-only project with VoltX.js CSS but no JavaScript framework.
 */
export function generateStylesHTML(projectName: string): string {
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
  <div class="container">
    <h1>Welcome to ${projectName}</h1>

    <div class="card">
      <h2>VoltX.js CSS</h2>
      <p>This project uses VoltX.js CSS utility classes without the reactive framework.</p>
      <p>Style your HTML with utility classes and semantic CSS variables.</p>
    </div>

    <div class="button-group">
      <button class="btn btn-primary">Primary</button>
      <button class="btn btn-secondary">Secondary</button>
      <button class="btn btn-danger">Danger</button>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Card 1</h3>
        <p>Build with semantic CSS.</p>
      </div>
      <div class="card">
        <h3>Card 2</h3>
        <p>No JavaScript required.</p>
      </div>
      <div class="card">
        <h3>Card 3</h3>
        <p>Just HTML and CSS.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export function generateStylesCSS(): string {
  return `/* Custom styles for your project */

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 3rem;
  color: #2563eb;
}

.card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.card h2,
.card h3 {
  margin-top: 0;
  color: #1e40af;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1e40af;
}

.btn-secondary {
  background: #64748b;
  color: white;
}

.btn-secondary:hover {
  background: #475569;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.grid .card {
  margin-bottom: 0;
}
`;
}

export function generateStylesPackageJSON(projectName: string): string {
  return JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      scripts: { dev: "voltx dev", build: "voltx build" },
      devDependencies: { "create-voltx": "^0.1.0" },
    },
    null,
    2,
  );
}

export function generateStylesREADME(projectName: string): string {
  return `# ${projectName}

A styles-only project using VoltX.js CSS utilities.

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

## What's Included

This project uses VoltX.js CSS for styling without the reactive framework:

- Utility classes for common patterns
- CSS custom properties for theming
- Semantic HTML with clean CSS

## Adding VoltX.js Reactivity

To add reactivity to this project later:

\`\`\`bash
# Add data-volt attributes to your HTML
# Import and initialize VoltX.js in a script tag
\`\`\`

See the [VoltX.js Documentation](https://stormlightlabs.github.io/volt) for more information.
`;
}
