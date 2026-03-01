/**
 * parse-wiki-content.mjs
 *
 * Build-time script that reads wiki HTML/MD files from the wiki-content repo,
 * parses metadata + body, rewrites image paths, and outputs structured JSON
 * files for the Aurelia 2 SPA to import.
 */

import { readdir, readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { join, basename, extname, dirname, relative } from 'node:path';
import { existsSync } from 'node:fs';
import { marked } from 'marked';

// ── Paths ────────────────────────────────────────────────────────────────────
const WIKI_ROOT = join(dirname(new URL(import.meta.url).pathname), '..', '..', 'wiki-content');
const OUT_DIR   = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'pages', 'wiki-data');
const STATIC_WIKI = join(dirname(new URL(import.meta.url).pathname), '..', 'static', 'wiki');

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4']);

const CLASS_NAMES = ['amazon', 'assassin', 'barbarian', 'druid', 'necromancer', 'paladin', 'sorceress'];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract title (and other fields) from an HTML metadata comment block. */
function parseHtmlMeta(raw) {
  const metaRegex = /^<!--\s*\n([\s\S]*?)-->\s*/;
  const match = raw.match(metaRegex);
  if (!match) return { title: '', content: raw, date: '' };

  const metaBlock = match[1];
  const content = raw.slice(match[0].length);

  const titleMatch = metaBlock.match(/^title:\s*(.+)$/m);
  const dateMatch  = metaBlock.match(/^date:\s*(.+)$/m);

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    date:  dateMatch  ? dateMatch[1].trim()  : '',
    content,
  };
}

/** Extract title (and other fields) from Markdown YAML frontmatter. */
function parseMdMeta(raw) {
  const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
  const match = raw.match(fmRegex);
  if (!match) return { title: '', content: raw, date: '' };

  const metaBlock = match[1];
  const content = raw.slice(match[0].length);

  const titleMatch = metaBlock.match(/^title:\s*(.+)$/m);
  const dateMatch  = metaBlock.match(/^date:\s*(.+)$/m);

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    date:  dateMatch  ? dateMatch[1].trim()  : '',
    content,
  };
}

/** Rewrite image src attributes from relative paths to /wiki/ paths. */
function rewriteImagePaths(html, subdir = '') {
  // First: rewrite absolute wiki paths (e.g. src="/somefile.png") to /wiki/ paths
  // but skip anything already under /wiki/ or external URLs
  html = html.replace(/src="\/(?!wiki\/|https?:\/\/)([^"]+)"/g, (full, absPath) => {
    return `src="/wiki/${absPath}"`;
  });

  // Second: rewrite relative paths (no leading /) to /wiki/ paths with subdir context
  html = html.replace(/src="(?!\/|https?:\/\/)([^"]+)"/g, (full, relPath) => {
    const newPath = subdir ? `/wiki/${subdir}/${relPath}` : `/wiki/${relPath}`;
    return `src="${newPath}"`;
  });

  return html;
}

/**
 * Strip inline color and background-color styles that assume a light background.
 * Preserves other inline styles (e.g. border, padding, width).
 */
function stripDarkOnLightStyles(html) {
  return html.replace(/style="([^"]*)"/g, (full, styleValue) => {
    // Remove color and background-color properties from the inline style
    const cleaned = styleValue
      .replace(/\bcolor\s*:\s*[^;]+;?/gi, '')
      .replace(/\bbackground-color\s*:\s*[^;]+;?/gi, '')
      .replace(/\bbackground\s*:\s*[^;]+;?/gi, '')
      .trim()
      .replace(/^;+|;+$/g, '')
      .trim();

    if (!cleaned) return '';  // Remove empty style attribute entirely
    return `style="${cleaned}"`;
  });
}

/** Convert a filename (without ext) to a kebab-case slug. */
function toSlug(filename) {
  return filename
    .replace(/([a-z])([A-Z])/g, '$1-$2')   // camelCase → camel-Case
    .replace(/[_\s]+/g, '-')                // underscores/spaces → hyphens
    .replace(/[^a-zA-Z0-9-]/g, '-')         // non-alphanumeric → hyphens
    .replace(/-+/g, '-')                     // collapse multiple hyphens
    .replace(/^-|-$/g, '')                   // trim leading/trailing hyphens
    .toLowerCase();
}

/** Read and parse a single wiki file (HTML or MD). Returns { title, content, date }. */
async function parseFile(filePath, imageSubdir = '') {
  const raw = await readFile(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  let parsed;
  if (ext === '.md') {
    parsed = parseMdMeta(raw);
    parsed.content = await marked(parsed.content);
  } else {
    parsed = parseHtmlMeta(raw);
  }

  parsed.content = rewriteImagePaths(parsed.content, imageSubdir);
  parsed.content = stripDarkOnLightStyles(parsed.content);
  return parsed;
}

/** Recursively list all files under a directory. */
async function listFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFiles(full)));
    } else {
      results.push(full);
    }
  }
  return results;
}

/** Write a JSON file, creating parent dirs as needed. */
async function writeJson(filePath, data) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✓ ${relative(process.cwd(), filePath)}`);
}

// ── Main build logic ─────────────────────────────────────────────────────────

async function buildClasses() {
  const result = {};
  for (const cls of CLASS_NAMES) {
    const fileName = cls.charAt(0).toUpperCase() + cls.slice(1) + '.html';
    const filePath = join(WIKI_ROOT, fileName);
    if (!existsSync(filePath)) {
      console.warn(`  ⚠ Missing class file: ${fileName}`);
      continue;
    }
    const parsed = await parseFile(filePath);
    result[cls] = { title: parsed.title, content: parsed.content };
  }
  await writeJson(join(OUT_DIR, 'classes.json'), result);
}

async function buildClassChanges() {
  const filePath = join(WIKI_ROOT, 'ClassChanges.html');
  const parsed = await parseFile(filePath);
  await writeJson(join(OUT_DIR, 'class-changes.json'), { title: parsed.title, content: parsed.content });
}

async function buildBuilds() {
  const result = {};
  for (const cls of CLASS_NAMES) {
    const capitalised = cls.charAt(0).toUpperCase() + cls.slice(1);

    // Parse the class builds index page (Builds/<Class>.html)
    const indexPath = join(WIKI_ROOT, 'Builds', `${capitalised}.html`);
    let index = { title: '', content: '' };
    if (existsSync(indexPath)) {
      const parsed = await parseFile(indexPath, `Builds`);
      index = { title: parsed.title, content: parsed.content };
    }

    // Parse individual build pages from Builds/<Class>/ subdirectory
    const buildsDir = join(WIKI_ROOT, 'Builds', capitalised);
    const builds = [];
    let buildFiles;
    try {
      buildFiles = await readdir(buildsDir);
    } catch {
      buildFiles = [];
    }

    for (const file of buildFiles) {
      const ext = extname(file).toLowerCase();
      if (ext !== '.html' && ext !== '.md') continue;

      const slug = toSlug(basename(file, ext));
      const parsed = await parseFile(join(buildsDir, file), `Builds/${capitalised}`);
      builds.push({
        slug,
        title: parsed.title,
        content: parsed.content,
      });
    }

    result[cls] = { index, builds };
  }
  await writeJson(join(OUT_DIR, 'builds.json'), result);
}

async function buildItems() {
  const itemFiles = ['Gems.html', 'Orbs.html', 'Potions.html', 'Keys.html', 'Charms.html', 'Runes.html', 'LootTable.html'];
  const result = {};
  for (const file of itemFiles) {
    const filePath = join(WIKI_ROOT, 'Items', file);
    if (!existsSync(filePath)) {
      console.warn(`  ⚠ Missing item file: ${file}`);
      continue;
    }
    const key = basename(file, '.html').toLowerCase();
    const parsed = await parseFile(filePath, 'Items');
    result[key] = { title: parsed.title, content: parsed.content };
  }
  await writeJson(join(OUT_DIR, 'items.json'), result);
}

async function buildPatchNotes() {
  const dir = join(WIKI_ROOT, 'Patch_Notes');
  const files = await readdir(dir);

  // Deduplicate: prefer .md over .html when both exist
  const fileMap = new Map();
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (ext !== '.html' && ext !== '.md') continue;
    const base = basename(file, ext);
    // If we already have an .md for this base, skip the .html
    if (fileMap.has(base) && extname(fileMap.get(base)).toLowerCase() === '.md') continue;
    fileMap.set(base, file);
  }

  // Parse the Patch_Notes index page
  const indexPath = join(WIKI_ROOT, 'Patch_Notes.html');
  let index = { title: '', content: '' };
  if (existsSync(indexPath)) {
    const parsed = await parseFile(indexPath);
    index = { title: parsed.title, content: parsed.content };
  }

  // Parse individual patch note files
  const notes = [];
  for (const [, file] of fileMap) {
    const parsed = await parseFile(join(dir, file), 'Patch_Notes');
    const slug = toSlug(basename(file, extname(file)));
    notes.push({
      slug,
      title: parsed.title,
      content: parsed.content,
      date: parsed.date,
    });
  }

  // Sort newest first by date
  notes.sort((a, b) => new Date(b.date) - new Date(a.date));

  await writeJson(join(OUT_DIR, 'patch-notes.json'), { index, notes });
}

async function buildGuides() {
  const guideFiles = [
    'new_player_guide.html',
    'Installs.html',
    'Updating_The_Mod.html',
    'QualityUpgrading.md',
    'CreateBuild.html',
  ];
  const result = {};
  for (const file of guideFiles) {
    const filePath = join(WIKI_ROOT, file);
    if (!existsSync(filePath)) {
      console.warn(`  ⚠ Missing guide file: ${file}`);
      continue;
    }
    const key = toSlug(basename(file, extname(file)));
    const parsed = await parseFile(filePath);
    result[key] = { title: parsed.title, content: parsed.content };
  }
  await writeJson(join(OUT_DIR, 'guides.json'), result);
}

async function buildRecipes() {
  const recipeFiles = ['Crafting.html', 'CubeRecipes.html', 'ISCStatLimits.html', 'ItemEnchants.html'];
  const result = {};
  for (const file of recipeFiles) {
    const filePath = join(WIKI_ROOT, 'recipes', file);
    if (!existsSync(filePath)) {
      console.warn(`  ⚠ Missing recipe file: ${file}`);
      continue;
    }
    const key = toSlug(basename(file, '.html'));
    const parsed = await parseFile(filePath, 'recipes');
    result[key] = { title: parsed.title, content: parsed.content };
  }
  await writeJson(join(OUT_DIR, 'recipes.json'), result);
}

async function buildAreaLevels() {
  // Prefer .md if it exists, otherwise .html
  let filePath = join(WIKI_ROOT, 'AreaLevels.md');
  if (!existsSync(filePath)) {
    filePath = join(WIKI_ROOT, 'AreaLevels.html');
  }
  const parsed = await parseFile(filePath);
  await writeJson(join(OUT_DIR, 'area-levels.json'), { title: parsed.title, content: parsed.content });
}

async function buildHirelings() {
  const filePath = join(WIKI_ROOT, 'Hirelings.html');
  const parsed = await parseFile(filePath);
  await writeJson(join(OUT_DIR, 'hirelings.json'), { title: parsed.title, content: parsed.content });
}

async function buildWikiHome() {
  const filePath = join(WIKI_ROOT, 'home.html');
  const parsed = await parseFile(filePath);
  await writeJson(join(OUT_DIR, 'wiki-home.json'), { title: parsed.title, content: parsed.content });
}

// ── Copy images ──────────────────────────────────────────────────────────────

async function copyImages() {
  console.log('\nCopying images to static/wiki/ ...');
  const allFiles = await listFiles(WIKI_ROOT);
  let count = 0;
  for (const file of allFiles) {
    const ext = extname(file).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;

    const rel = relative(WIKI_ROOT, file);
    const dest = join(STATIC_WIKI, rel);
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(file, dest);
    count++;
  }
  console.log(`  ✓ Copied ${count} image/media files`);
}

// ── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Parsing wiki content...\n');
  await mkdir(OUT_DIR, { recursive: true });

  await buildClasses();
  await buildClassChanges();
  await buildBuilds();
  await buildItems();
  await buildPatchNotes();
  await buildGuides();
  await buildRecipes();
  await buildAreaLevels();
  await buildHirelings();
  await buildWikiHome();
  await copyImages();

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Failed to parse wiki content:', err);
  process.exit(1);
});
