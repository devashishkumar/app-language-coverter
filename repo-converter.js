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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Updated to current available model

// Get arguments: repo URL and target language
const repoUrl = process.argv[2];
const targetLanguage = process.argv[3];

if (!repoUrl || !targetLanguage) {
  console.log('Usage: node repo-converter.js <repo-url> <target-language>');
  process.exit(1);
}

const tempDir = path.join(__dirname, 'temp-repo');
const outputDir = path.join(__dirname, 'converted-code');

async function cloneRepo(url, dir) {
  const git = simpleGit();
  await git.clone(url, dir);
}

async function getCodeFiles(dir) {
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
        // Add extensions for common languages
        if (['.js', '.ts', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  traverse(dir);
  return files;
}

async function convertCode(content, sourceLang, targetLang) {
  const prompt = `Convert the following code from ${sourceLang} to ${targetLang}. Provide only the converted code without any explanations or markdown formatting.`;
  const result = await model.generateContent(`${prompt}\n\n${content}`);
  return result.response.text();
}

// in case of rate limiting, we add a retry mechanism
async function convertCodeWithRetry(content, sourceLang, targetLang) {
  const prompt = `Convert the following code from ${sourceLang} to ${targetLang}. Provide only the converted code without any explanations or markdown formatting.`;
  try {
    const result = await model.generateContent(`${prompt}\n\n${content}`);
    return result.response.text();
  } catch (error) {
    if (error.status === 429) {
      console.log('Rate limit exceeded. Waiting 60 seconds before retrying...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
      return await convertCode(content, sourceLang, targetLang); // Retry
    } else {
      throw error;
    }
  }
}

function getLanguageFromExt(ext) {
  const langMap = {
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.py': 'Python',
    '.java': 'Java',
    '.cpp': 'C++',
    '.c': 'C',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust'
  };
  return langMap[ext] || 'Unknown';
}

async function main() {
  try {
    // Clean up previous runs
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true });
    fs.mkdirSync(outputDir);

    console.log('Cloning repository...');
    await cloneRepo(repoUrl, tempDir);

    console.log('Finding code files...');
    const codeFiles = await getCodeFiles(tempDir);

    for (const file of codeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const ext = path.extname(file);
      const sourceLang = getLanguageFromExt(ext);
      if (sourceLang === 'Unknown') continue;

      console.log(`Converting ${file}...`);
      const converted = await convertCode(content, sourceLang, targetLanguage);

      // Determine new extension based on target language
      const newExt = getExtFromLanguage(targetLanguage);
      const relativePath = path.relative(tempDir, file);
      const newFilePath = path.join(outputDir, relativePath.replace(ext, newExt));
      const newDir = path.dirname(newFilePath);
      if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
      fs.writeFileSync(newFilePath, converted);

      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between conversions
    }

    console.log('Conversion complete. Converted code is in the "converted-code" directory.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up temp dir
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
  }
}

function getExtFromLanguage(lang) {
  const extMap = {
    'JavaScript': '.js',
    'TypeScript': '.ts',
    'Python': '.py',
    'Java': '.java',
    'C++': '.cpp',
    'C': '.c',
    'PHP': '.php',
    'Ruby': '.rb',
    'Go': '.go',
    'Rust': '.rs'
  };
  return extMap[lang] || '.txt';
}

main();