/**
 * Highlights game terms (rarities, items, runes, gems, orbs) with colored spans.
 * Ports the wiki_formatting.js color highlighting system to TypeScript.
 */

interface TermMatch {
    pattern: RegExp;
    color: string;
}

// Rarity colors
const RARITIES = {
    Magic: '#1770ff',
    Rare: '#ffee00',
    Unique: '#c48300',
    Set: '#009102',
    Crafted: '#c44500',
    Ethereal: '#9400ab',
};

// Item types
const ITEMS = [
    'Item',
    'Jewel',
    'Jewelry',
    'Amulet',
    'Ring',
    'Charm',
    'Armor',
    'Shield',
    'Weapon',
    'Belt',
    'Boot',
    'Glove',
    'Helm',
    'Circlet',
];

// Rune names (orange color)
const RUNES = [
    'EL',
    'ELD',
    'TIR',
    'NEF',
    'ETH',
    'ITH',
    'TAL',
    'RAL',
    'ORT',
    'THUL',
    'AMN',
    'SOL',
    'SHAEL',
    'DOL',
    'HEL',
    'IO',
    'LUM',
    'KO',
    'FAL',
    'LEM',
    'PUL',
    'UM',
    'MAL',
    'IST',
    'GUL',
    'VEX',
    'OHM',
    'LO',
    'SUR',
    'BER',
    'JAH',
    'CHAM',
    'ZOD',
];

// Gem types (turquoise color)
const GEMS = [
    'Amethyst',
    'Sapphire',
    'Ruby',
    'Emerald',
    'Topaz',
    'Diamond',
    'Skull',
];

// Orb types with their colors
const ORBS: Record<string, string> = {
    'Orb of Conversion': '#e67e22',
    'Orb of Assemblage': '#109001',
    'Orb of Infusion': '#dadd00',
    'Orb of Corruption': '#cd0000',
    'Orb of Socketing': '#0025cd',
    'Orb of Shadows': '#9200a1',
};

/**
 * Builds regex patterns for all highlightable terms
 */
function buildTermPatterns(): TermMatch[] {
    const patterns: TermMatch[] = [];

    // Rarity + Item combinations (singular and plural)
    // e.g., "Unique Armor", "Magic Rings", "Rare Amulet"
    for (const [rarity, color] of Object.entries(RARITIES)) {
        for (const item of ITEMS) {
            // Singular form
            patterns.push({
                pattern: new RegExp(
                    `\\b${rarity}\\s+${item}\\b(?!s)`,
                    'gi',
                ),
                color,
            });
            // Plural form
            patterns.push({
                pattern: new RegExp(
                    `\\b${rarity}\\s+${item}s\\b`,
                    'gi',
                ),
                color,
            });
        }
    }

    // Rarity in brackets, e.g., "(Magic)", "(Unique)"
    for (const [rarity, color] of Object.entries(RARITIES)) {
        patterns.push({
            pattern: new RegExp(`\\(${rarity}\\)`, 'gi'),
            color,
        });
    }

    // Standalone "Ethereal"
    patterns.push({
        pattern: /\bEthereal\b/gi,
        color: RARITIES.Ethereal,
    });

    // Rune patterns: "RUNE Rune" format
    for (const rune of RUNES) {
        patterns.push({
            pattern: new RegExp(`\\b${rune}\\s+Rune\\b`, 'gi'),
            color: '#ff8c00', // Orange
        });
    }

    // Gem patterns: standalone gem words
    for (const gem of GEMS) {
        patterns.push({
            pattern: new RegExp(`\\b${gem}\\b`, 'gi'),
            color: '#17a2b8', // Turquoise
        });
    }

    // Gem Bag patterns: "Gem Bag (N Gem|Gems)" or similar
    patterns.push({
        pattern: /\bGem\s+Bags?\s*\([^)]*\bGems?\b[^)]*\)/gi,
        color: '#17a2b8', // Turquoise
    });
    patterns.push({
        pattern: /\bGems?\s*\(Any\)/gi,
        color: '#17a2b8', // Turquoise
    });

    // Orb patterns with specific colors
    for (const [orb, color] of Object.entries(ORBS)) {
        patterns.push({
            pattern: new RegExp(`\\b${orb}\\b`, 'gi'),
            color,
        });
    }

    return patterns;
}

/**
 * Replaces a text node with a span containing the original text and applies highlighting
 */
function highlightTextNode(textNode: Text, patterns: TermMatch[]): void {
    let html = textNode.nodeValue || '';
    let modified = false;

    for (const { pattern, color } of patterns) {
        const newHtml = html.replace(pattern, (match) => {
            modified = true;
            return `<span style="color: ${color};">${match}</span>`;
        });
        html = newHtml;
    }

    if (modified) {
        // Create a temporary container to hold the new HTML
        const span = document.createElement('span');
        span.innerHTML = html;

        // Replace the text node with the span containing highlighted content
        textNode.parentNode?.replaceChild(span, textNode);
    }
}

/**
 * Applies game term highlighting to all text nodes in a container
 * Traverses the DOM tree and wraps matching game terms with colored spans
 */
export function applyGameTermHighlighting(container: HTMLElement): void {
    const patterns = buildTermPatterns();

    // Create a TreeWalker to traverse text nodes
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
    );

    // Collect all text nodes first (modifying DOM while walking can cause issues)
    const textNodes: Text[] = [];
    let node = walker.nextNode();

    while (node) {
        textNodes.push(node as Text);
        node = walker.nextNode();
    }

    // Apply highlighting to each text node
    for (const textNode of textNodes) {
        // Skip text nodes inside IMG elements
        if (textNode.parentElement?.tagName !== 'IMG') {
            highlightTextNode(textNode, patterns);
        }
    }
}
