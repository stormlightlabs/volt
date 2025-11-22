/**
 * Generate a VoltX.js project with router plugin.
 */
export function generateRouterHTML(projectName: string): string {
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
  <div data-volt>
    <nav class="nav">
      <a href="/" data-volt-navigate>Home</a>
      <a href="/about" data-volt-navigate>About</a>
      <a href="/contact" data-volt-navigate>Contact</a>
    </nav>

    <main class="container">
      <!-- Home page -->
      <div data-volt-url="/" data-volt-url-exact>
        <h1>Home</h1>
        <p>Welcome to ${projectName}!</p>
        <p>This is a VoltX.js app with client-side routing.</p>
      </div>

      <!-- About page -->
      <div data-volt-url="/about">
        <h1>About</h1>
        <p>This project demonstrates VoltX.js routing capabilities.</p>
        <ul>
          <li>Client-side navigation</li>
          <li>Clean URLs with History API</li>
          <li>Declarative route matching</li>
        </ul>
      </div>

      <!-- Contact page -->
      <div data-volt-url="/contact">
        <h1>Contact</h1>
        <p>Get in touch with us!</p>
        <form>
          <label>
            Name:
            <input type="text" placeholder="Your name">
          </label>
          <label>
            Email:
            <input type="email" placeholder="your@email.com">
          </label>
          <label>
            Message:
            <textarea rows="4" placeholder="Your message"></textarea>
          </label>
          <button type="submit">Send</button>
        </form>
      </div>

      <!-- 404 page -->
      <div data-volt-url-fallback>
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/" data-volt-navigate>Go back home</a>
      </div>
    </main>
  </div>

  <script type="module">
    import { charge, registerPlugin, navigatePlugin, urlPlugin } from './voltx.min.js';

    registerPlugin('navigate', navigatePlugin);
    registerPlugin('url', urlPlugin);
    charge();
  </script>
</body>
</html>
`;
}

export function generateRouterCSS(): string {
  return `/* Custom styles for your VoltX.js app */

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.nav {
  background: #2563eb;
  padding: 1rem 2rem;
  display: flex;
  gap: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav a:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav a[aria-current="page"] {
  background: rgba(255, 255, 255, 0.2);
}

.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-top: 0;
  color: #2563eb;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 500;
}

input,
textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #2563eb;
}

button[type="submit"] {
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  align-self: flex-start;
}

button[type="submit"]:hover {
  background: #1e40af;
}
`;
}

export function generateRouterPackageJSON(projectName: string): string {
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

export function generateRouterREADME(projectName: string): string {
  return `# ${projectName}

A VoltX.js application with client-side routing.

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

## Features

This project demonstrates:

- Client-side routing with the History API
- Declarative route matching with \`data-volt-url\`
- Navigation with \`data-volt-navigate\`
- 404 fallback pages
- Clean URLs without hash routing

## Project Structure

- \`index.html\` - Main HTML file with routes
- \`styles.css\` - Custom styles
- \`voltx.min.js\` - VoltX.js framework with router
- \`voltx.min.css\` - VoltX.js base styles

## Learn More

- [VoltX.js Documentation](https://stormlightlabs.github.io/volt)
- [Routing Guide](https://stormlightlabs.github.io/volt/guides/routing)
`;
}
