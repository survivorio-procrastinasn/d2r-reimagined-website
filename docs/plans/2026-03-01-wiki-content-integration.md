# Wiki Content Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate all wiki content from the `wiki-content` repository into the Aurelia 2 website, replacing the external wiki entirely.

**Architecture:** A build-time Node script parses wiki HTML/MD files into clean JSON data files. A shared `wiki-content` Aurelia custom element renders this JSON content with Tailwind prose styling and game-term color highlighting. A new hamburger sidebar menu provides navigation to all wiki pages. New routes are added for each content category.

**Tech Stack:** Aurelia 2, Vite, Tailwind CSS, Node.js (build script), `marked` (markdown-to-HTML conversion)

---

### Task 1: Install `marked` dependency for Markdown parsing

**Files:**
- Modify: `package.json`

**Step 1: Install marked**

Run: `cd /Users/jonnguy/Documents/d2rr/d2r-reimagined-website && pnpm add marked`

**Step 2: Verify installation**

Run: `pnpm ls marked`
Expected: `marked` listed in dependencies

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add marked dependency for wiki markdown parsing"
```

---

### Task 2: Create the build-time wiki content parser script

This script reads all wiki HTML and MD files from `../wiki-content/`, strips metadata comments/frontmatter, extracts the content body, resolves image paths, and outputs clean JSON files to `src/pages/wiki-data/`.

**Files:**
- Create: `scripts/parse-wiki-content.mjs`
- Create: `src/pages/wiki-data/` (output directory, generated files)

**Step 1: Write the parser script**

```javascript
// scripts/parse-wiki-content.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, cpSync } from 'fs';
import { join, basename, extname, relative } from 'path';
import { marked } from 'marked';

const WIKI_DIR = join(import.meta.dirname, '..', '..', 'wiki-content');
const OUT_DIR = join(import.meta.dirname, '..', 'src', 'pages', 'wiki-data');
const STATIC_WIKI_DIR = join(import.meta.dirname, '..', 'static', 'wiki');

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(STATIC_WIKI_DIR, { recursive: true });

// --- Helpers ---

/** Strip HTML comment metadata block from wiki HTML files */
function stripHtmlMeta(raw) {
  const metaMatch = raw.match(/^<!--\s*([\s\S]*?)-->/);
  let title = '';
  let content = raw;
  if (metaMatch) {
    content = raw.slice(metaMatch[0].length).trim();
    const titleMatch = metaMatch[1].match(/title:\s*(.+)/);
    if (titleMatch) title = titleMatch[1].trim();
  }
  return { title, content };
}

/** Strip YAML frontmatter from markdown files */
function stripMdFrontmatter(raw) {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  let title = '';
  let content = raw;
  if (fmMatch) {
    content = raw.slice(fmMatch[0].length).trim();
    const titleMatch = fmMatch[1].match(/title:\s*(.+)/);
    if (titleMatch) title = titleMatch[1].trim();
  }
  return { title, content };
}

/** Rewrite wiki image src paths to point to /wiki/ static directory */
function rewriteImagePaths(html, sourceDir) {
  // Handle relative src paths like src="somefile.png" or src="./subdir/file.png"
  // Also handle wiki-style paths like src="/somefile.png"
  return html.replace(
    /src="(?!https?:\/\/|\/\/|data:)([^"]+)"/g,
    (match, path) => {
      // Strip leading / or ./
      const cleaned = path.replace(/^\.?\//, '');
      return `src="/wiki/${cleaned}"`;
    }
  );
}

/** Process a single HTML wiki file */
function processHtml(filePath, relPath) {
  const raw = readFileSync(filePath, 'utf-8');
  const { title, content } = stripHtmlMeta(raw);
  const rewritten = rewriteImagePaths(content, relPath);
  return { title, content: rewritten };
}

/** Process a single Markdown wiki file */
function processMd(filePath, relPath) {
  const raw = readFileSync(filePath, 'utf-8');
  const { title, content } = stripMdFrontmatter(raw);
  const html = marked.parse(content);
  const rewritten = rewriteImagePaths(html, relPath);
  return { title, content: rewritten };
}

/** Process a file based on extension */
function processFile(filePath) {
  const relPath = relative(WIKI_DIR, filePath);
  const ext = extname(filePath).toLowerCase();
  if (ext === '.html') return processHtml(filePath, relPath);
  if (ext === '.md') return processMd(filePath, relPath);
  return null;
}

/** Recursively find all .html and .md files in a directory */
function findContentFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findContentFiles(full));
    } else {
      const ext = extname(entry).toLowerCase();
      if (ext === '.html' || ext === '.md') {
        results.push(full);
      }
    }
  }
  return results;
}

// --- Content categories ---

const output = {
  // Classes
  classes: {},
  classChanges: null,
  // Builds (nested by class)
  builds: {},
  // Items
  items: {},
  // Patch Notes
  patchNotes: [],
  patchNotesIndex: null,
  // Guides
  guides: {},
  // Other
  areaLevels: null,
  hirelings: null,
  recipes: {},
  home: null,
};

// --- Process root-level pages ---

const classNames = ['Amazon', 'Assassin', 'Barbarian', 'Druid', 'Necromancer', 'Paladin', 'Sorceress'];

for (const cls of classNames) {
  const htmlPath = join(WIKI_DIR, `${cls}.html`);
  if (existsSync(htmlPath)) {
    output.classes[cls.toLowerCase()] = processFile(htmlPath);
  }
}

// ClassChanges
const classChangesPath = join(WIKI_DIR, 'ClassChanges.html');
if (existsSync(classChangesPath)) output.classChanges = processFile(classChangesPath);

// Builds - process each class subdirectory
const buildsDir = join(WIKI_DIR, 'Builds');
for (const cls of classNames) {
  const clsDir = join(buildsDir, cls);
  output.builds[cls.toLowerCase()] = { index: null, builds: [] };

  // Class index page (e.g. Builds/Amazon.html)
  const indexPath = join(buildsDir, `${cls}.html`);
  if (existsSync(indexPath)) {
    output.builds[cls.toLowerCase()].index = processFile(indexPath);
  }

  // Individual builds
  if (existsSync(clsDir)) {
    const buildFiles = findContentFiles(clsDir);
    for (const bf of buildFiles) {
      const data = processFile(bf);
      if (data) {
        const slug = basename(bf, extname(bf))
          .replace(/([A-Z])/g, '-$1').toLowerCase()
          .replace(/^-/, '')
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-');
        output.builds[cls.toLowerCase()].builds.push({ slug, ...data });
      }
    }
  }
}

// Items
const itemsDir = join(WIKI_DIR, 'Items');
const itemPages = ['Gems', 'Orbs', 'Potions', 'Keys', 'Charms', 'LootTable', 'Runes', 'Affixes', 'ArmorBases', 'WeaponBases'];
for (const item of itemPages) {
  const itemPath = join(itemsDir, `${item}.html`);
  if (existsSync(itemPath)) {
    const slug = item.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    output.items[slug] = processFile(itemPath);
  }
}

// Patch Notes
const patchDir = join(WIKI_DIR, 'Patch_Notes');
const pnIndexPath = join(WIKI_DIR, 'Patch_Notes.html');
if (existsSync(pnIndexPath)) output.patchNotesIndex = processFile(pnIndexPath);

if (existsSync(patchDir)) {
  const patchFiles = findContentFiles(patchDir);
  for (const pf of patchFiles) {
    const data = processFile(pf);
    if (data) {
      const slug = basename(pf, extname(pf));
      output.patchNotes.push({ slug, ...data });
    }
  }
  // Sort by version descending (newest first)
  output.patchNotes.sort((a, b) => b.slug.localeCompare(a.slug, undefined, { numeric: true }));
}

// Guides
const guideMap = {
  'new-player': join(WIKI_DIR, 'new_player_guide.html'),
  'installation': join(WIKI_DIR, 'Installs.html'),
  'updating': join(WIKI_DIR, 'Updating_The_Mod.html'),
  'quality-upgrading': join(WIKI_DIR, 'QualityUpgrading.md'),
  'create-build': join(WIKI_DIR, 'CreateBuild.html'),
};
for (const [slug, path] of Object.entries(guideMap)) {
  if (existsSync(path)) output.guides[slug] = processFile(path);
}

// Recipes
const recipesDir = join(WIKI_DIR, 'recipes');
const recipePages = ['Crafting', 'CubeRecipes', 'ISCStatLimits', 'ItemEnchants'];
for (const recipe of recipePages) {
  const recipePath = join(recipesDir, `${recipe}.html`);
  if (existsSync(recipePath)) {
    const slug = recipe.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    output.recipes[slug] = processFile(recipePath);
  }
}

// Area Levels
const areaPath = join(WIKI_DIR, 'AreaLevels.html');
if (existsSync(areaPath)) output.areaLevels = processFile(areaPath);

// Hirelings
const hirelingsPath = join(WIKI_DIR, 'Hirelings.html');
if (existsSync(hirelingsPath)) output.hirelings = processFile(hirelingsPath);

// Home (wiki home)
const homePath = join(WIKI_DIR, 'home.html');
if (existsSync(homePath)) output.home = processFile(homePath);

// --- Write output JSON files ---
// Split into separate files per category for code-splitting

writeFileSync(join(OUT_DIR, 'classes.json'), JSON.stringify(output.classes, null, 2));
writeFileSync(join(OUT_DIR, 'class-changes.json'), JSON.stringify(output.classChanges, null, 2));
writeFileSync(join(OUT_DIR, 'builds.json'), JSON.stringify(output.builds, null, 2));
writeFileSync(join(OUT_DIR, 'items.json'), JSON.stringify(output.items, null, 2));
writeFileSync(join(OUT_DIR, 'patch-notes.json'), JSON.stringify({ index: output.patchNotesIndex, notes: output.patchNotes }, null, 2));
writeFileSync(join(OUT_DIR, 'guides.json'), JSON.stringify(output.guides, null, 2));
writeFileSync(join(OUT_DIR, 'recipes.json'), JSON.stringify(output.recipes, null, 2));
writeFileSync(join(OUT_DIR, 'area-levels.json'), JSON.stringify(output.areaLevels, null, 2));
writeFileSync(join(OUT_DIR, 'hirelings.json'), JSON.stringify(output.hirelings, null, 2));
writeFileSync(join(OUT_DIR, 'wiki-home.json'), JSON.stringify(output.home, null, 2));

// --- Copy images to static/wiki/ ---
function copyImages(srcDir, destDir) {
  if (!existsSync(srcDir)) return;
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4'];
  for (const entry of readdirSync(srcDir)) {
    const full = join(srcDir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      // Recurse but flatten into dest (or preserve structure)
      const subDest = join(destDir, entry);
      mkdirSync(subDest, { recursive: true });
      copyImages(full, subDest);
    } else if (imageExts.includes(extname(entry).toLowerCase())) {
      const destFile = join(destDir, entry);
      cpSync(full, destFile, { force: true });
    }
  }
}

copyImages(WIKI_DIR, STATIC_WIKI_DIR);

console.log('Wiki content parsed and written to', OUT_DIR);
console.log('Wiki images copied to', STATIC_WIKI_DIR);
```

**Step 2: Run the parser and verify output**

Run: `cd /Users/jonnguy/Documents/d2rr/d2r-reimagined-website && node scripts/parse-wiki-content.mjs`
Expected: JSON files created in `src/pages/wiki-data/`, images copied to `static/wiki/`

**Step 3: Verify a JSON output file looks correct**

Run: `head -50 src/pages/wiki-data/classes.json`
Expected: JSON with `amazon`, `assassin`, etc. keys, each with `title` and `content` fields

**Step 4: Add parse-wiki script to package.json**

Add to `scripts` in `package.json`:
```json
"parse-wiki": "node scripts/parse-wiki-content.mjs",
"build": "pnpm run parse-wiki && rimraf docs/assets && vite build && cp docs/index.html docs/404.html"
```

**Step 5: Commit**

```bash
git add scripts/parse-wiki-content.mjs src/pages/wiki-data/ package.json
git commit -m "feat: add build-time wiki content parser script"
```

---

### Task 3: Create the game-term highlighting utility

Port the `wiki_formatting.js` color highlighting logic into a TypeScript utility function that runs on rendered HTML content.

**Files:**
- Create: `src/utilities/game-term-highlight.ts`

**Step 1: Write the highlighting utility**

```typescript
// src/utilities/game-term-highlight.ts

const rarityColors: Record<string, string> = {
  Magic: '#1770ff',
  Rare: '#ffee00',
  Unique: '#c48300',
  Set: '#009102',
  Crafted: '#c44500',
  Ethereal: '#9400ab',
};

const items = [
  'Item', 'Jewel', 'Jewelry', 'Amulet', 'Ring', 'Charm',
  'Armor', 'Shield', 'Weapon', 'Belt', 'Boot', 'Glove', 'Helm', 'Circlet',
];

const runes = [
  'EL', 'ELD', 'TIR', 'NEF', 'ETH', 'ITH', 'TAL', 'RAL',
  'ORT', 'THUL', 'AMN', 'SOL', 'SHAEL', 'DOL', 'HEL', 'IO', 'LUM',
  'KO', 'FAL', 'LEM', 'PUL', 'UM', 'MAL', 'IST', 'GUL',
  'VEX', 'OHM', 'LO', 'SUR', 'BER', 'JAH', 'CHAM', 'ZOD',
];

const gems = ['Amethyst', 'Sapphire', 'Ruby', 'Emerald', 'Topaz', 'Diamond', 'Skull'];

const orbColors: Record<string, string> = {
  Conversion: '#e67e22',
  Assemblage: '#109001',
  Infusion: '#dadd00',
  Corruption: '#cd0000',
  Socketing: '#0025cd',
  Shadows: '#9200a1',
};

function bold(text: string, color: string): string {
  return `<span style="color:${color};font-weight:bold;">${text}</span>`;
}

function highlightItems(text: string): string {
  let result = text;
  for (const rarity of Object.keys(rarityColors)) {
    const color = rarityColors[rarity];
    for (const item of items) {
      const re = new RegExp(`\\b${rarity}\\s+${item}s?\\b`, 'gi');
      result = result.replace(re, (m) => bold(m, color));
    }
    // Rarity in brackets
    const bracketRe = new RegExp(`\\(${rarity}\\)`, 'gi');
    result = result.replace(bracketRe, bold(`(${rarity})`, color));
    // Standalone Ethereal
    if (rarity === 'Ethereal') {
      const ethRe = new RegExp(`\\b${rarity}\\b`, 'gi');
      result = result.replace(ethRe, bold(rarity, color));
    }
  }
  return result;
}

function highlightRunes(text: string): string {
  let result = text;
  for (const rune of runes) {
    const re = new RegExp(`\\b${rune} Rune\\b`, 'gi');
    result = result.replace(re, bold(`${rune} Rune`, 'orange'));
  }
  return result;
}

function highlightGems(text: string): string {
  let result = text;
  for (const gem of gems) {
    const re = new RegExp(`\\b${gem}\\b`, 'gi');
    result = result.replace(re, bold(gem, 'turquoise'));
  }
  result = result.replace(/Gem \(Any\)/gi, bold('Gem (Any)', 'turquoise'));
  result = result.replace(/Gems \(Any\)/gi, bold('Gems (Any)', 'turquoise'));
  result = result.replace(/Gem Bag \(\d+ (Gem|Gems)\)/gi, (m) => bold(m, 'turquoise'));
  return result;
}

function highlightOrbs(text: string): string {
  let result = text;
  for (const [orbType, color] of Object.entries(orbColors)) {
    const keyword = `Orb of ${orbType}`;
    const re = new RegExp(`\\b${keyword}\\b`, 'gi');
    result = result.replace(re, bold(keyword, color));
  }
  return result;
}

/**
 * Apply game-term color highlighting to an HTML container element.
 * Traverses text nodes and replaces matching terms with colored spans.
 */
export function applyGameTermHighlighting(container: HTMLElement): void {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node);
  }
  for (const tn of textNodes) {
    let text = tn.nodeValue || '';
    const original = text;
    text = highlightItems(text);
    text = highlightRunes(text);
    text = highlightGems(text);
    text = highlightOrbs(text);
    if (text !== original) {
      const span = document.createElement('span');
      span.innerHTML = text;
      tn.parentNode?.replaceChild(span, tn);
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/utilities/game-term-highlight.ts
git commit -m "feat: add game-term color highlighting utility"
```

---

### Task 4: Create the shared `wiki-content` custom element

This reusable component receives a title and HTML content string, renders it safely, and applies game-term highlighting after attachment.

**Files:**
- Create: `src/resources/elements/wiki-content/wiki-content.ts`
- Create: `src/resources/elements/wiki-content/wiki-content.html`

**Step 1: Write the wiki-content component TypeScript**

```typescript
// src/resources/elements/wiki-content/wiki-content.ts
import { bindable, ICustomElementViewModel } from 'aurelia';
import { applyGameTermHighlighting } from '../../../utilities/game-term-highlight';

export class WikiContent implements ICustomElementViewModel {
  @bindable title: string = '';
  @bindable content: string = '';

  private contentRef: HTMLElement | null = null;

  attached() {
    this.highlightContent();
  }

  propertyChanged(name: string) {
    if (name === 'content') {
      // Re-apply highlighting when content changes
      // Use queueMicrotask to ensure DOM has updated
      queueMicrotask(() => this.highlightContent());
    }
  }

  private highlightContent() {
    if (this.contentRef) {
      applyGameTermHighlighting(this.contentRef);
    }
  }
}
```

**Step 2: Write the wiki-content component template**

```html
<!-- src/resources/elements/wiki-content/wiki-content.html -->
<div class="container mx-auto mt-5 max-w-5xl p-5">
    <h1 if.bind="title" class="text-2xl unique-text text-center mb-6">${title}</h1>
    <div ref="contentRef"
         class="wiki-body type-text"
         innerhtml.bind="content">
    </div>
</div>
```

**Step 3: Commit**

```bash
git add src/resources/elements/wiki-content/
git commit -m "feat: add wiki-content reusable custom element"
```

---

### Task 5: Add wiki content Tailwind styles

Add CSS rules so wiki HTML content (tables, images, headers, lists, links) renders cleanly with the site's dark theme.

**Files:**
- Modify: `src/styles/tailwind.css`

**Step 1: Add wiki-body styles to tailwind.css**

Append the following at the end of `src/styles/tailwind.css`:

```css
/* Wiki content body styles */
.wiki-body {
  @apply text-base leading-relaxed;

  h1 { @apply text-2xl unique-text mt-6 mb-3; }
  h2 { @apply text-xl unique-text mt-5 mb-2; }
  h3 { @apply text-lg unique-text mt-4 mb-2; }
  h4 { @apply text-base unique-text mt-3 mb-1; }
  h5, h6 { @apply text-base unique-text mt-2 mb-1; }

  p { @apply mb-3; }

  a { @apply link-text underline; }
  a:hover { @apply unique-text; }

  ul { @apply list-disc list-inside mb-3 ml-4; }
  ol { @apply list-decimal list-inside mb-3 ml-4; }
  li { @apply mb-1; }

  img {
    @apply max-w-full h-auto rounded-lg my-3 mx-auto block;
  }

  figure {
    @apply my-4 text-center;
  }

  figcaption {
    @apply text-sm base-text mt-1;
  }

  table {
    @apply w-full border-collapse my-4;
  }

  th {
    @apply bg-gray-700 border border-gray-600 px-3 py-2 text-left type-text;
  }

  td {
    @apply border border-gray-600 px-3 py-2 bg-gray-800;
  }

  tr:hover td {
    @apply bg-gray-700;
  }

  blockquote {
    @apply border-l-4 border-gray-600 pl-4 my-3 italic base-text;
  }

  code {
    @apply bg-gray-700 px-1 py-0.5 rounded text-sm;
  }

  pre {
    @apply bg-gray-900 border border-gray-600 rounded-lg p-4 overflow-x-auto my-4;
  }

  pre code {
    @apply bg-transparent p-0;
  }

  hr {
    @apply border-gray-600 my-6;
  }

  /* Override any inline wiki styles that conflict with dark theme */
  mark {
    @apply bg-transparent;
  }
}
```

**Step 2: Commit**

```bash
git add src/styles/tailwind.css
git commit -m "feat: add wiki content body styles for dark theme"
```

---

### Task 6: Create wiki page components — Classes

Create the class pages that load and display class content from the parsed JSON.

**Files:**
- Create: `src/pages/wiki/classes/wiki-classes.ts`
- Create: `src/pages/wiki/classes/wiki-classes.html`
- Create: `src/pages/wiki/classes/wiki-class-detail.ts`
- Create: `src/pages/wiki/classes/wiki-class-detail.html`

**Step 1: Write the classes index page**

```typescript
// src/pages/wiki/classes/wiki-classes.ts
import classChangesJson from '../../wiki-data/class-changes.json';

interface IWikiPage { title: string; content: string; }

const classLinks = [
  { slug: 'amazon', label: 'Amazon' },
  { slug: 'assassin', label: 'Assassin' },
  { slug: 'barbarian', label: 'Barbarian' },
  { slug: 'druid', label: 'Druid' },
  { slug: 'necromancer', label: 'Necromancer' },
  { slug: 'paladin', label: 'Paladin' },
  { slug: 'sorceress', label: 'Sorceress' },
];

export class WikiClasses {
  classChanges = classChangesJson as IWikiPage | null;
  classLinks = classLinks;
}
```

```html
<!-- src/pages/wiki/classes/wiki-classes.html -->
<template>
    <div class="container mx-auto mt-5 max-w-5xl p-5">
        <h1 class="text-2xl unique-text text-center mb-6">Class Changes</h1>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <a repeat.for="cls of classLinks"
               href="/classes/${cls.slug}"
               class="block text-center p-4 bg-gray-800 border border-gray-600 rounded-lg link-text text-lg hover:bg-gray-700">
                ${cls.label}
            </a>
        </div>
        <wiki-content if.bind="classChanges"
                      title=""
                      content.bind="classChanges.content">
        </wiki-content>
    </div>
</template>
```

**Step 2: Write the class detail page**

```typescript
// src/pages/wiki/classes/wiki-class-detail.ts
import { IRouteableComponent, Parameters } from '@aurelia/router';
import classesJson from '../../wiki-data/classes.json';

interface IWikiPage { title: string; content: string; }

export class WikiClassDetail implements IRouteableComponent {
  page: IWikiPage | null = null;
  className: string = '';

  loading(params: Parameters) {
    const slug = params.class as string;
    this.className = slug;
    const classes = classesJson as Record<string, IWikiPage>;
    this.page = classes[slug] || null;
  }
}
```

```html
<!-- src/pages/wiki/classes/wiki-class-detail.html -->
<template>
    <wiki-content if.bind="page"
                  title.bind="page.title"
                  content.bind="page.content">
    </wiki-content>
    <div if.bind="!page" class="container mx-auto mt-5 max-w-5xl p-5 text-center">
        <p class="text-lg base-text">Class not found.</p>
        <a href="/classes" class="link-text underline">Back to Classes</a>
    </div>
</template>
```

**Step 3: Commit**

```bash
git add src/pages/wiki/classes/
git commit -m "feat: add wiki class pages (index + detail)"
```

---

### Task 7: Create wiki page components — Builds

**Files:**
- Create: `src/pages/wiki/builds/wiki-builds.ts`
- Create: `src/pages/wiki/builds/wiki-builds.html`
- Create: `src/pages/wiki/builds/wiki-build-detail.ts`
- Create: `src/pages/wiki/builds/wiki-build-detail.html`

**Step 1: Write the builds index page**

```typescript
// src/pages/wiki/builds/wiki-builds.ts
import buildsJson from '../../wiki-data/builds.json';

interface IBuildEntry { slug: string; title: string; content: string; }
interface IClassBuilds { index: { title: string; content: string } | null; builds: IBuildEntry[]; }

const classOrder = ['amazon', 'assassin', 'barbarian', 'druid', 'necromancer', 'paladin', 'sorceress'];

export class WikiBuilds {
  classes = classOrder.map(cls => ({
    slug: cls,
    label: cls.charAt(0).toUpperCase() + cls.slice(1),
    builds: ((buildsJson as Record<string, IClassBuilds>)[cls]?.builds || []),
  }));
}
```

```html
<!-- src/pages/wiki/builds/wiki-builds.html -->
<template>
    <div class="container mx-auto mt-5 max-w-5xl p-5">
        <h1 class="text-2xl unique-text text-center mb-6">Community Builds</h1>
        <div repeat.for="cls of classes" class="mb-6">
            <h2 class="text-xl unique-text mb-3">${cls.label}</h2>
            <div if.bind="cls.builds.length === 0" class="base-text ml-4">No builds yet.</div>
            <ul if.bind="cls.builds.length > 0" class="list-disc list-inside ml-4">
                <li repeat.for="build of cls.builds" class="mb-1">
                    <a href="/builds/${cls.slug}/${build.slug}" class="link-text text-lg">
                        ${build.title || build.slug}
                    </a>
                </li>
            </ul>
        </div>
    </div>
</template>
```

**Step 2: Write the build detail page**

```typescript
// src/pages/wiki/builds/wiki-build-detail.ts
import { IRouteableComponent, Parameters } from '@aurelia/router';
import buildsJson from '../../wiki-data/builds.json';

interface IBuildEntry { slug: string; title: string; content: string; }
interface IClassBuilds { index: { title: string; content: string } | null; builds: IBuildEntry[]; }

export class WikiBuildDetail implements IRouteableComponent {
  page: IBuildEntry | null = null;

  loading(params: Parameters) {
    const cls = params.class as string;
    const buildSlug = params.build as string;
    const classData = (buildsJson as Record<string, IClassBuilds>)[cls];
    if (classData) {
      this.page = classData.builds.find(b => b.slug === buildSlug) || null;
    }
  }
}
```

```html
<!-- src/pages/wiki/builds/wiki-build-detail.html -->
<template>
    <wiki-content if.bind="page"
                  title.bind="page.title"
                  content.bind="page.content">
    </wiki-content>
    <div if.bind="!page" class="container mx-auto mt-5 max-w-5xl p-5 text-center">
        <p class="text-lg base-text">Build not found.</p>
        <a href="/builds" class="link-text underline">Back to Builds</a>
    </div>
</template>
```

**Step 3: Commit**

```bash
git add src/pages/wiki/builds/
git commit -m "feat: add wiki build pages (index + detail)"
```

---

### Task 8: Create wiki page components — Items, Guides, Patch Notes, Area Levels, Hirelings, Recipes

**Files:**
- Create: `src/pages/wiki/items/wiki-items.ts` + `.html`
- Create: `src/pages/wiki/items/wiki-item-detail.ts` + `.html`
- Create: `src/pages/wiki/guides/wiki-guide.ts` + `.html`
- Create: `src/pages/wiki/patch-notes/wiki-patch-notes.ts` + `.html`
- Create: `src/pages/wiki/patch-notes/wiki-patch-note-detail.ts` + `.html`
- Create: `src/pages/wiki/area-levels/wiki-area-levels.ts` + `.html`
- Create: `src/pages/wiki/hirelings/wiki-hirelings.ts` + `.html`
- Create: `src/pages/wiki/recipes/wiki-recipes.ts` + `.html`
- Create: `src/pages/wiki/recipes/wiki-recipe-detail.ts` + `.html`

**Step 1: Items index + detail**

```typescript
// src/pages/wiki/items/wiki-items.ts
import itemsJson from '../../wiki-data/items.json';

interface IWikiPage { title: string; content: string; }

const itemList = [
  { slug: 'gems', label: 'Gems' },
  { slug: 'orbs', label: 'Orbs' },
  { slug: 'potions', label: 'Potions' },
  { slug: 'keys', label: 'Keys' },
  { slug: 'charms', label: 'Charms' },
  { slug: 'runes', label: 'Runes' },
  { slug: 'loot-table', label: 'Loot Table' },
];

export class WikiItems {
  items = itemList;
}
```

```html
<!-- src/pages/wiki/items/wiki-items.html -->
<template>
    <div class="container mx-auto mt-5 max-w-5xl p-5">
        <h1 class="text-2xl unique-text text-center mb-6">Items</h1>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a repeat.for="item of items"
               href="/wiki-items/${item.slug}"
               class="block text-center p-4 bg-gray-800 border border-gray-600 rounded-lg link-text text-lg hover:bg-gray-700">
                ${item.label}
            </a>
        </div>
    </div>
</template>
```

```typescript
// src/pages/wiki/items/wiki-item-detail.ts
import { IRouteableComponent, Parameters } from '@aurelia/router';
import itemsJson from '../../wiki-data/items.json';

interface IWikiPage { title: string; content: string; }

export class WikiItemDetail implements IRouteableComponent {
  page: IWikiPage | null = null;

  loading(params: Parameters) {
    const slug = params.item as string;
    this.page = (itemsJson as Record<string, IWikiPage>)[slug] || null;
  }
}
```

```html
<!-- src/pages/wiki/items/wiki-item-detail.html -->
<template>
    <wiki-content if.bind="page"
                  title.bind="page.title"
                  content.bind="page.content">
    </wiki-content>
    <div if.bind="!page" class="container mx-auto mt-5 max-w-5xl p-5 text-center">
        <p class="text-lg base-text">Item page not found.</p>
        <a href="/wiki-items" class="link-text underline">Back to Items</a>
    </div>
</template>
```

**Step 2: Guides page (single page with slug param)**

```typescript
// src/pages/wiki/guides/wiki-guide.ts
import { IRouteableComponent, Parameters } from '@aurelia/router';
import guidesJson from '../../wiki-data/guides.json';

interface IWikiPage { title: string; content: string; }

export class WikiGuide implements IRouteableComponent {
  page: IWikiPage | null = null;

  loading(params: Parameters) {
    const slug = params.guide as string;
    this.page = (guidesJson as Record<string, IWikiPage>)[slug] || null;
  }
}
```

```html
<!-- src/pages/wiki/guides/wiki-guide.html -->
<template>
    <wiki-content if.bind="page"
                  title.bind="page.title"
                  content.bind="page.content">
    </wiki-content>
    <div if.bind="!page" class="container mx-auto mt-5 max-w-5xl p-5 text-center">
        <p class="text-lg base-text">Guide not found.</p>
    </div>
</template>
```

**Step 3: Patch Notes index + detail**

```typescript
// src/pages/wiki/patch-notes/wiki-patch-notes.ts
import patchNotesJson from '../../wiki-data/patch-notes.json';

interface IPatchNote { slug: string; title: string; content: string; }
interface IPatchData { index: { title: string; content: string } | null; notes: IPatchNote[]; }

export class WikiPatchNotes {
  notes: IPatchNote[] = (patchNotesJson as IPatchData).notes;
}
```

```html
<!-- src/pages/wiki/patch-notes/wiki-patch-notes.html -->
<template>
    <div class="container mx-auto mt-5 max-w-5xl p-5">
        <h1 class="text-2xl unique-text text-center mb-6">Patch Notes</h1>
        <ul class="space-y-2">
            <li repeat.for="note of notes">
                <a href="/patch-notes/${note.slug}"
                   class="block p-3 bg-gray-800 border border-gray-600 rounded-lg link-text text-lg hover:bg-gray-700">
                    ${note.title || note.slug}
                </a>
            </li>
        </ul>
    </div>
</template>
```

```typescript
// src/pages/wiki/patch-notes/wiki-patch-note-detail.ts
import { IRouteableComponent, Parameters } from '@aurelia/router';
import patchNotesJson from '../../wiki-data/patch-notes.json';

interface IPatchNote { slug: string; title: string; content: string; }
interface IPatchData { index: { title: string; content: string } | null; notes: IPatchNote[]; }

export class WikiPatchNoteDetail implements IRouteableComponent {
  page: IPatchNote | null = null;

  loading(params: Parameters) {
    const slug = params.version as string;
    this.page = (patchNotesJson as IPatchData).notes.find(n => n.slug === slug) || null;
  }
}
```

```html
<!-- src/pages/wiki/patch-notes/wiki-patch-note-detail.html -->
<template>
    <wiki-content if.bind="page"
                  title.bind="page.title"
                  content.bind="page.content">
    </wiki-content>
    <div if.bind="!page" class="container mx-auto mt-5 max-w-5xl p-5 text-center">
        <p class="text-lg base-text">Patch notes not found.</p>
        <a href="/patch-notes" class="link-text underline">Back to Patch Notes</a>
    </div>
</template>
```

**Step 4: Area Levels**

```typescript
// src/pages/wiki/area-levels/wiki-area-levels.ts
import areaLevelsJson from '../../wiki-data/area-levels.json';

interface IWikiPage { title: string; content: string; }

export class WikiAreaLevels {
  page = areaLevelsJson as IWikiPage;
}
```

```html
<!-- src/pages/wiki/area-levels/wiki-area-levels.html -->
<template>
    <wiki-content title.bind="page.title"
                  content.bind="page.content">
    </wiki-content>
</template>
```

**Step 5: Hirelings**

```typescript
// src/pages/wiki/hirelings/wiki-hirelings.ts
import hirelingsJson from '../../wiki-data/hirelings.json';

interface IWikiPage { title: string; content: string; }

export class WikiHirelings {
  page = hirelingsJson as IWikiPage;
}
```

```html
<!-- src/pages/wiki/hirelings/wiki-hirelings.html -->
<template>
    <wiki-content title.bind="page.title"
                  content.bind="page.content">
    </wiki-content>
</template>
```

**Step 6: Recipes index + detail**

```typescript
// src/pages/wiki/recipes/wiki-recipes.ts
const recipeList = [
  { slug: 'crafting', label: 'Crafting' },
  { slug: 'cube-recipes', label: 'Cube Recipes' },
  { slug: 'i-s-c-stat-limits', label: 'ISC Stat Limits' },
  { slug: 'item-enchants', label: 'Item Enchants' },
];

export class WikiRecipes {
  recipes = recipeList;
}
```

```html
<!-- src/pages/wiki/recipes/wiki-recipes.html -->
<template>
    <div class="container mx-auto mt-5 max-w-5xl p-5">
        <h1 class="text-2xl unique-text text-center mb-6">Recipes & Crafting</h1>
        <div class="grid grid-cols-2 gap-3">
            <a repeat.for="r of recipes"
               href="/recipes/${r.slug}"
               class="block text-center p-4 bg-gray-800 border border-gray-600 rounded-lg link-text text-lg hover:bg-gray-700">
                ${r.label}
            </a>
        </div>
    </div>
</template>
```

```typescript
// src/pages/wiki/recipes/wiki-recipe-detail.ts
import { IRouteableComponent, Parameters } from '@aurelia/router';
import recipesJson from '../../wiki-data/recipes.json';

interface IWikiPage { title: string; content: string; }

export class WikiRecipeDetail implements IRouteableComponent {
  page: IWikiPage | null = null;

  loading(params: Parameters) {
    const slug = params.recipe as string;
    this.page = (recipesJson as Record<string, IWikiPage>)[slug] || null;
  }
}
```

```html
<!-- src/pages/wiki/recipes/wiki-recipe-detail.html -->
<template>
    <wiki-content if.bind="page"
                  title.bind="page.title"
                  content.bind="page.content">
    </wiki-content>
    <div if.bind="!page" class="container mx-auto mt-5 max-w-5xl p-5 text-center">
        <p class="text-lg base-text">Recipe page not found.</p>
        <a href="/recipes" class="link-text underline">Back to Recipes</a>
    </div>
</template>
```

**Step 7: Commit**

```bash
git add src/pages/wiki/
git commit -m "feat: add all wiki page components (items, guides, patches, areas, hirelings, recipes)"
```

---

### Task 9: Add routes to app.ts

Register all new wiki pages in the Aurelia router configuration.

**Files:**
- Modify: `src/app.ts:3-46` (route config)

**Step 1: Add new routes after existing routes**

Add these routes inside the `routes` array in `src/app.ts`, after the existing `affixes` route (line 45):

```typescript
// Wiki: Classes
{
    path: 'classes',
    component: import('./pages/wiki/classes/wiki-classes'),
    title: 'Classes',
},
{
    path: 'classes/:class',
    component: import('./pages/wiki/classes/wiki-class-detail'),
    title: 'Class Detail',
},
// Wiki: Builds
{
    path: 'builds',
    component: import('./pages/wiki/builds/wiki-builds'),
    title: 'Builds',
},
{
    path: 'builds/:class/:build',
    component: import('./pages/wiki/builds/wiki-build-detail'),
    title: 'Build Detail',
},
// Wiki: Items (wiki items, not the existing item browsers)
{
    path: 'wiki-items',
    component: import('./pages/wiki/items/wiki-items'),
    title: 'Wiki Items',
},
{
    path: 'wiki-items/:item',
    component: import('./pages/wiki/items/wiki-item-detail'),
    title: 'Wiki Item Detail',
},
// Wiki: Guides
{
    path: 'guides/:guide',
    component: import('./pages/wiki/guides/wiki-guide'),
    title: 'Guide',
},
// Wiki: Patch Notes
{
    path: 'patch-notes',
    component: import('./pages/wiki/patch-notes/wiki-patch-notes'),
    title: 'Patch Notes',
},
{
    path: 'patch-notes/:version',
    component: import('./pages/wiki/patch-notes/wiki-patch-note-detail'),
    title: 'Patch Note Detail',
},
// Wiki: Area Levels
{
    path: 'area-levels',
    component: import('./pages/wiki/area-levels/wiki-area-levels'),
    title: 'Area Levels',
},
// Wiki: Hirelings
{
    path: 'hirelings',
    component: import('./pages/wiki/hirelings/wiki-hirelings'),
    title: 'Hirelings',
},
// Wiki: Recipes
{
    path: 'recipes',
    component: import('./pages/wiki/recipes/wiki-recipes'),
    title: 'Recipes',
},
{
    path: 'recipes/:recipe',
    component: import('./pages/wiki/recipes/wiki-recipe-detail'),
    title: 'Recipe Detail',
},
```

**Step 2: Commit**

```bash
git add src/app.ts
git commit -m "feat: register all wiki routes in app router"
```

---

### Task 10: Add the hamburger sidebar menu to app.html

Replace the external Wiki link in the navbar with a hamburger menu icon that opens a sidebar drawer with all wiki content categories.

**Files:**
- Modify: `src/app.html` (navbar template)
- Modify: `src/app.ts` (add sidebar state management)

**Step 1: Add sidebar state to app.ts**

Add these properties and methods to the `App` class in `src/app.ts`:

```typescript
// Sidebar state
sidebarOpen = false;

toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
}

closeSidebar() {
    this.sidebarOpen = false;
}
```

Also update the `_onDocClick` handler in `attached()` to close the sidebar when clicking outside:

```typescript
// 3) Close the sidebar when clicking outside
if (this.sidebarOpen) {
    const sidebar = document.getElementById('wiki-sidebar');
    const sidebarBtn = document.querySelector('button[aria-controls="wiki-sidebar"]');
    const clickInsideSidebar = !!(target && sidebar && sidebar.contains(target));
    const clickOnSidebarBtn = !!(target && sidebarBtn && sidebarBtn.contains(target));
    if (!clickInsideSidebar && !clickOnSidebarBtn) {
        this.closeSidebar();
    }
}
```

**Step 2: Replace the Wiki link in app.html with hamburger + sidebar**

In `src/app.html`, replace the Wiki `<li>` (lines 92-97) with:

```html
<li>
    <button type="button"
            class="flex text-lg link-text items-center"
            aria-controls="wiki-sidebar"
            aria-expanded.bind="sidebarOpen.toString()"
            click.trigger="toggleSidebar()">
        Wiki<span class="mso ml-1">menu_book</span>
    </button>
</li>
```

Then add the sidebar overlay and drawer just before the `<!-- Nav Bar Spacer -->` comment (after the closing `</nav>` tag, around line 102):

```html
<!-- Wiki Sidebar Overlay -->
<div if.bind="sidebarOpen"
     class="fixed inset-0 bg-black/50 z-30"
     click.trigger="closeSidebar()">
</div>

<!-- Wiki Sidebar Drawer -->
<div id="wiki-sidebar"
     class="fixed top-0 right-0 h-full w-80 max-w-[85vw] z-40 bg-gray-900 border-l border-gray-600 shadow-xl
            transform transition-transform duration-200 overflow-y-auto"
     css="transform: translateX(${sidebarOpen ? '0' : '100%'})">

    <div class="flex items-center justify-between p-4 border-b border-gray-600">
        <span class="text-xl unique-text">Wiki</span>
        <button type="button" class="text-2xl link-text" click.trigger="closeSidebar()">
            <span class="mso">close</span>
        </button>
    </div>

    <nav class="p-4 space-y-4">
        <!-- Classes -->
        <div>
            <h3 class="text-sm uppercase base-text tracking-wider mb-2">Classes</h3>
            <ul class="space-y-1 ml-2">
                <li><a href="/classes" class="block py-1 link-text" click.trigger="closeSidebar()">Overview</a></li>
                <li><a href="/classes/amazon" class="block py-1 link-text" click.trigger="closeSidebar()">Amazon</a></li>
                <li><a href="/classes/assassin" class="block py-1 link-text" click.trigger="closeSidebar()">Assassin</a></li>
                <li><a href="/classes/barbarian" class="block py-1 link-text" click.trigger="closeSidebar()">Barbarian</a></li>
                <li><a href="/classes/druid" class="block py-1 link-text" click.trigger="closeSidebar()">Druid</a></li>
                <li><a href="/classes/necromancer" class="block py-1 link-text" click.trigger="closeSidebar()">Necromancer</a></li>
                <li><a href="/classes/paladin" class="block py-1 link-text" click.trigger="closeSidebar()">Paladin</a></li>
                <li><a href="/classes/sorceress" class="block py-1 link-text" click.trigger="closeSidebar()">Sorceress</a></li>
            </ul>
        </div>

        <!-- Builds -->
        <div>
            <h3 class="text-sm uppercase base-text tracking-wider mb-2">Builds</h3>
            <ul class="space-y-1 ml-2">
                <li><a href="/builds" class="block py-1 link-text" click.trigger="closeSidebar()">All Builds</a></li>
            </ul>
        </div>

        <!-- Items -->
        <div>
            <h3 class="text-sm uppercase base-text tracking-wider mb-2">Items</h3>
            <ul class="space-y-1 ml-2">
                <li><a href="/wiki-items" class="block py-1 link-text" click.trigger="closeSidebar()">Overview</a></li>
                <li><a href="/wiki-items/gems" class="block py-1 link-text" click.trigger="closeSidebar()">Gems</a></li>
                <li><a href="/wiki-items/orbs" class="block py-1 link-text" click.trigger="closeSidebar()">Orbs</a></li>
                <li><a href="/wiki-items/potions" class="block py-1 link-text" click.trigger="closeSidebar()">Potions</a></li>
                <li><a href="/wiki-items/keys" class="block py-1 link-text" click.trigger="closeSidebar()">Keys</a></li>
                <li><a href="/wiki-items/charms" class="block py-1 link-text" click.trigger="closeSidebar()">Charms</a></li>
                <li><a href="/wiki-items/runes" class="block py-1 link-text" click.trigger="closeSidebar()">Runes</a></li>
                <li><a href="/wiki-items/loot-table" class="block py-1 link-text" click.trigger="closeSidebar()">Loot Table</a></li>
            </ul>
        </div>

        <!-- Guides -->
        <div>
            <h3 class="text-sm uppercase base-text tracking-wider mb-2">Guides</h3>
            <ul class="space-y-1 ml-2">
                <li><a href="/guides/new-player" class="block py-1 link-text" click.trigger="closeSidebar()">New Player Guide</a></li>
                <li><a href="/guides/installation" class="block py-1 link-text" click.trigger="closeSidebar()">Installation</a></li>
                <li><a href="/guides/updating" class="block py-1 link-text" click.trigger="closeSidebar()">Updating the Mod</a></li>
                <li><a href="/guides/quality-upgrading" class="block py-1 link-text" click.trigger="closeSidebar()">Quality Upgrading</a></li>
                <li><a href="/guides/create-build" class="block py-1 link-text" click.trigger="closeSidebar()">Create a Build</a></li>
            </ul>
        </div>

        <!-- Recipes -->
        <div>
            <h3 class="text-sm uppercase base-text tracking-wider mb-2">Recipes & Crafting</h3>
            <ul class="space-y-1 ml-2">
                <li><a href="/recipes" class="block py-1 link-text" click.trigger="closeSidebar()">Overview</a></li>
                <li><a href="/recipes/crafting" class="block py-1 link-text" click.trigger="closeSidebar()">Crafting</a></li>
                <li><a href="/recipes/cube-recipes" class="block py-1 link-text" click.trigger="closeSidebar()">Cube Recipes</a></li>
                <li><a href="/recipes/i-s-c-stat-limits" class="block py-1 link-text" click.trigger="closeSidebar()">ISC Stat Limits</a></li>
                <li><a href="/recipes/item-enchants" class="block py-1 link-text" click.trigger="closeSidebar()">Item Enchants</a></li>
            </ul>
        </div>

        <!-- Patch Notes -->
        <div>
            <h3 class="text-sm uppercase base-text tracking-wider mb-2">Patch Notes</h3>
            <ul class="space-y-1 ml-2">
                <li><a href="/patch-notes" class="block py-1 link-text" click.trigger="closeSidebar()">All Patch Notes</a></li>
            </ul>
        </div>

        <!-- Standalone Pages -->
        <div>
            <h3 class="text-sm uppercase base-text tracking-wider mb-2">Reference</h3>
            <ul class="space-y-1 ml-2">
                <li><a href="/area-levels" class="block py-1 link-text" click.trigger="closeSidebar()">Area Levels</a></li>
                <li><a href="/hirelings" class="block py-1 link-text" click.trigger="closeSidebar()">Hirelings</a></li>
            </ul>
        </div>
    </nav>
</div>
```

**Step 3: Commit**

```bash
git add src/app.html src/app.ts
git commit -m "feat: add wiki hamburger sidebar menu replacing external wiki link"
```

---

### Task 11: Add .gitignore entries for generated files

The parsed wiki JSON data and copied wiki images are generated artifacts. Add them to `.gitignore` to keep the repo clean, or decide to commit them for GitHub Pages deployment.

**Files:**
- Modify: `.gitignore`

**Step 1: Decide on strategy**

Since the site builds to `docs/` for GitHub Pages and the build script now runs `parse-wiki` before `vite build`, the generated JSON files in `src/pages/wiki-data/` are build inputs. They should be committed so the Vite build can import them.

The `static/wiki/` images should also be committed since they're served as static assets.

Skip adding these to `.gitignore`. Instead, just verify the build works end-to-end.

**Step 2: Run the full build**

Run: `cd /Users/jonnguy/Documents/d2rr/d2r-reimagined-website && pnpm run build`
Expected: Build completes successfully, `docs/` contains the built site

**Step 3: Start dev server and verify**

Run: `cd /Users/jonnguy/Documents/d2rr/d2r-reimagined-website && pnpm run start`
Expected: Dev server starts on port 9500. Navigate to:
- `http://localhost:9500/classes` — should show class overview
- `http://localhost:9500/classes/amazon` — should show Amazon class page
- `http://localhost:9500/builds` — should show builds index
- `http://localhost:9500/patch-notes` — should show patch notes list
- `http://localhost:9500/guides/new-player` — should show new player guide
- `http://localhost:9500/wiki-items` — should show items index
- `http://localhost:9500/area-levels` — should show area levels
- `http://localhost:9500/hirelings` — should show hirelings
- Sidebar menu should open/close from the Wiki button in navbar

**Step 4: Fix any issues found during testing**

Address any broken image paths, missing content, or rendering issues.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete wiki content integration into website"
```

---

## Summary of All Tasks

| Task | Description |
|------|-------------|
| 1 | Install `marked` dependency |
| 2 | Create build-time wiki parser script |
| 3 | Create game-term highlighting utility |
| 4 | Create `wiki-content` custom element |
| 5 | Add wiki content Tailwind styles |
| 6 | Create class page components |
| 7 | Create build page components |
| 8 | Create items, guides, patch notes, area levels, hirelings, recipes components |
| 9 | Add routes to app.ts |
| 10 | Add hamburger sidebar menu to app.html |
| 11 | End-to-end build verification and testing |
