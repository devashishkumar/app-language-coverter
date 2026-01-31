import { GoogleGenerativeAI } from "@google/generative-ai";
import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Get argument: repo URL
const repoUrl = process.argv[2];

if (!repoUrl) {
  console.log('Usage: node angular-to-react-converter.js <repo-url>');
  process.exit(1);
}

const tempDir = path.join(__dirname, 'temp-repo');
const outputDir = path.join(__dirname, 'converted-code');

/**
 * Clones a Git repository to a specified directory.
 * @param {string} url - The URL of the Git repository to clone.
 * @param {string} dir - The directory path where the repository should be cloned.
 */
async function cloneRepo(url, dir) {
  const git = simpleGit();
  await git.clone(url, dir);
}

/**
 * Checks if the given directory contains an Angular project.
 * @param {string} dir - The directory path to check.
 * @returns {boolean} True if it's an Angular project, false otherwise.
 */
function isAngularProject(dir) {
  const angularJson = path.join(dir, 'angular.json');
  const packageJson = path.join(dir, 'package.json');
  if (fs.existsSync(angularJson)) return true;
  if (fs.existsSync(packageJson)) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return Object.keys(deps).some(dep => dep.startsWith('@angular/'));
  }
  return false;
}

/**
 * Finds all Angular components in the given directory.
 * @param {string} dir - The directory path to search for components.
 * @returns {Array} An array of component objects with ts, html, and css properties.
 */
function findAngularComponents(dir) {
  const components = [];
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.component.ts')) {
        const componentDir = path.dirname(fullPath);
        const baseName = item.replace('.component.ts', '');
        const htmlFile = path.join(componentDir, `${baseName}.component.html`);
        const cssFile = path.join(componentDir, `${baseName}.component.css`);
        const scssFile = path.join(componentDir, `${baseName}.component.scss`);
        components.push({
          ts: fullPath,
          html: fs.existsSync(htmlFile) ? htmlFile : null,
          css: fs.existsSync(cssFile) ? cssFile : (fs.existsSync(scssFile) ? scssFile : null)
        });
      }
    }
  }
  traverse(dir);
  return components;
}

/**
 * Converts an Angular component to a React component using AI.
 * @param {Object} component - The component object with ts, html, and css paths.
 * @returns {string} The converted React component code.
 */
async function convertComponent(component) {
  let content = fs.readFileSync(component.ts, 'utf-8');
  if (component.html) {
    content += '\n\n// Template:\n' + fs.readFileSync(component.html, 'utf-8');
  }
  if (component.css) {
    content += '\n\n// Styles:\n' + fs.readFileSync(component.css, 'utf-8');
  }

  const prompt = `Convert this Angular component to a React functional component using TypeScript and JSX. Include hooks if needed. Provide only the converted code without explanations.

Angular Component:
${content}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    if (error.status === 429) {
      console.log('Rate limit exceeded. Waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await convertComponent(component);
    } else {
      throw error;
    }
  }
}

/**
 * Gets other TypeScript/JavaScript files in the directory (excluding components and specs).
 * @param {string} dir - The directory path to search.
 * @returns {Array} An array of file paths.
 */
function getOtherFiles(dir) {
  const files = [];
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (['.ts', '.js'].includes(ext) && !item.includes('.component.') && !item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  }
  traverse(dir);
  return files;
}

/**
 * Converts a TypeScript/JavaScript file to React-compatible code using AI.
 * @param {string} filePath - The path to the file to convert.
 * @returns {string} The converted code.
 */
async function convertFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const prompt = `Convert this Angular/TypeScript code to React/TypeScript. Provide only the converted code.

Code:
${content}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    if (error.status === 429) {
      console.log('Rate limit exceeded. Waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await convertFile(filePath);
    } else {
      throw error;
    }
  }
}

/**
 * Creates a basic package.json file for a React TypeScript project.
 */
async function createReactPackageJson() {
  const reactPkg = {
    "name": "converted-react-app",
    "version": "1.0.0",
    "private": true,
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "typescript": "^4.9.5"
    },
    "scripts": {
      "start": "react-app start",
      "build": "react-app build",
      "test": "react-app test",
      "eject": "react-app eject"
    },
    "eslintConfig": {
      "extends": [
        "react-app",
        "react-app/jest"
      ]
    },
    "browserslist": {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    }
  };
  fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(reactPkg, null, 2));
}

/**
 * Main function that orchestrates the conversion process.
 */
async function main() {
  try {
    // Clean up
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true });
    fs.mkdirSync(outputDir);

    console.log('Cloning repository...');
    await cloneRepo(repoUrl, tempDir);

    if (!isAngularProject(tempDir)) {
      console.log('The repository does not appear to be an Angular project.');
      process.exit(1);
    }

    console.log('Finding Angular components...');
    const components = findAngularComponents(tempDir);

    console.log(`Found ${components.length} components.`);

    for (const component of components) {
      console.log(`Converting component: ${component.ts}`);
      const converted = await convertComponent(component);
      const relativePath = path.relative(tempDir, component.ts);
      const newPath = path.join(outputDir, 'src', relativePath.replace('.component.ts', '.tsx'));
      const newDir = path.dirname(newPath);
      if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
      fs.writeFileSync(newPath, converted);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('Converting other TypeScript files...');
    const otherFiles = getOtherFiles(tempDir);
    for (const file of otherFiles) {
      console.log(`Converting ${file}`);
      const converted = await convertFile(file);
      const relativePath = path.relative(tempDir, file);
      const newPath = path.join(outputDir, 'src', relativePath.replace('.ts', '.tsx'));
      const newDir = path.dirname(newPath);
      if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
      fs.writeFileSync(newPath, converted);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('Creating React package.json...');
    await createReactPackageJson();

    console.log('Conversion complete. Converted code is in the "converted-code" directory.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
  }
}

main();