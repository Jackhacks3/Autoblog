/**
 * AI Text Humanizer
 *
 * Ports the humanize_text() logic from ByeDash/ai-humanizer (main.py).
 * Removes AI writing tells while preserving Markdown structure for blog content.
 *
 * Two modes:
 *  - `humanizeContent`  : full blog body — keeps Markdown (headers, bold, links, lists)
 *  - `humanizeSnippet`  : short text (excerpt, meta, title) — plain-text cleanup only
 */

export interface HumanizeResult {
  original: string;
  humanized: string;
  changes: string[];
  originalLength: number;
  humanizedLength: number;
  reduction: number;
}

/**
 * AI-typical sentence starters that should be removed.
 * Ported from ByeDash ai-humanizer main.py § "Remove AI-typical sentence starters"
 */
const AI_STARTERS: Array<[RegExp, string]> = [
  [/^Let me /gim, ''],
  [/^I'll /gim, ''],
  [/^Here's /gim, ''],
  [/^Here is /gim, ''],
  [/^Certainly[,!]?\s*/gim, ''],
  [/^Of course[,!]?\s*/gim, ''],
  [/^Absolutely[,!]?\s*/gim, ''],
  [/^Great question[,!]?\s*/gim, ''],
  [/^That's a great /gim, 'A '],
  [/^I'd be happy to /gim, ''],
  [/^I would be happy to /gim, ''],
  [/^As an AI[,]?\s*/gim, ''],
  [/^As a language model[,]?\s*/gim, ''],
  [/^In this article[,]?\s*/gim, ''],
  [/^In this post[,]?\s*/gim, ''],
  [/^In conclusion[,]?\s*/gim, 'Overall, '],
  [/^To summarize[,]?\s*/gim, ''],
  [/^To sum up[,]?\s*/gim, ''],
  [/^It's worth noting that /gim, ''],
  [/^It is worth noting that /gim, ''],
  [/^It's important to note that /gim, ''],
  [/^It is important to note that /gim, ''],
  [/^Needless to say[,]?\s*/gim, ''],
  [/\bIt's worth mentioning that /gi, ''],
  [/\bAs mentioned (earlier|above|previously)[,]?\s*/gi, ''],
];

/**
 * AI filler / buzzword phrases to neutralise.
 * Applied globally (not just at sentence start).
 */
const AI_FILLER: Array<[RegExp, string]> = [
  [/\bdelve into\b/gi, 'explore'],
  [/\bdelves into\b/gi, 'explores'],
  [/\bdelved into\b/gi, 'explored'],
  [/\bfoster(ing)? a (deeper )?understanding\b/gi, 'help understand'],
  [/\bunlock(ing)? the (full )?potential\b/gi, 'make the most'],
  [/\bnavigate (the)? (complexities|nuances|landscape)\b/gi, 'work through'],
  [/\btransform(ing)? (your|the) (approach|workflow|strategy)\b/gi, 'improve your $3'],
  [/\bempower(ing)? (you|users|businesses)\b/gi, 'let $2'],
  [/\bseamless(ly)?\b/gi, 'smooth$1'],
  [/\bharnessing the power of\b/gi, 'using'],
  [/\bleverage\b/gi, 'use'],
  [/\bleveraging\b/gi, 'using'],
  [/\bleverage(s|d)?\b/gi, 'use$1'],
  [/\bin today's (fast-paced|digital|modern|competitive) (world|landscape|era|environment)\b/gi, 'today'],
  [/\bthe (digital|modern) age\b/gi, 'today'],
  [/\bcutting-edge\b/gi, 'advanced'],
  [/\bstate-of-the-art\b/gi, 'advanced'],
  [/\bgroundbreaking\b/gi, 'notable'],
  [/\bpivotal\b/gi, 'key'],
  [/\btailored (to|for)\b/gi, 'suited $1'],
  [/\brobust\b/gi, 'strong'],
  [/\bcomprehensive\b/gi, 'thorough'],
  [/\bmeticulous(ly)?\b/gi, 'careful$1'],
  [/\bstreamline\b/gi, 'simplify'],
  [/\bstreamlined\b/gi, 'simplified'],
  [/\bstreamlines\b/gi, 'simplifies'],
];

/**
 * Apply AI-starter and filler replacements to a text string.
 */
function applyStarters(text: string, changes: string[]): string {
  let starterCount = 0;
  for (const [pattern, replacement] of AI_STARTERS) {
    const matches = text.match(pattern);
    if (matches) starterCount += matches.length;
    text = text.replace(pattern, replacement);
  }
  if (starterCount > 0) changes.push(`Removed ${starterCount} AI-typical sentence starter(s)`);
  return text;
}

function applyFillers(text: string, changes: string[]): string {
  let fillerCount = 0;
  for (const [pattern, replacement] of AI_FILLER) {
    const matches = text.match(pattern);
    if (matches) fillerCount += matches.length;
    text = text.replace(pattern, replacement);
  }
  if (fillerCount > 0) changes.push(`Replaced ${fillerCount} AI filler phrase(s)`);
  return text;
}

function applyEmDashes(text: string, changes: string[]): string {
  const count =
    (text.match(/—/g) || []).length +
    (text.match(/–/g) || []).length +
    (text.match(/(?<!-)-{2}(?!-)/g) || []).length;
  if (count > 0) changes.push(`Replaced ${count} em/en dash(es)`);
  text = text.replace(/—/g, ', ');
  text = text.replace(/–/g, '-');
  text = text.replace(/(?<!-)-{2}(?!-)/g, ', ');
  return text;
}

function applyExclamationNorm(text: string, changes: string[]): string {
  const matches = text.match(/!{2,}/g);
  if (matches) {
    changes.push(`Normalised ${matches.length} excessive exclamation mark(s)`);
    text = text.replace(/!{2,}/g, '!');
  }
  return text;
}

function applyWhitespace(text: string): string {
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/ {2,}/g, ' ');
  return text.trim();
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Humanize the **full Markdown blog body**.
 *
 * Preserves all Markdown structure (headers, bold, italic, links, lists,
 * code blocks) — only removes AI-specific linguistic patterns.
 */
export function humanizeContent(text: string): HumanizeResult {
  const original = text;
  const changes: string[] = [];

  text = applyEmDashes(text, changes);
  text = applyExclamationNorm(text, changes);
  text = applyStarters(text, changes);
  text = applyFillers(text, changes);
  text = applyWhitespace(text);

  return {
    original,
    humanized: text,
    changes,
    originalLength: original.length,
    humanizedLength: text.length,
    reduction: original.length - text.length,
  };
}

/**
 * Humanize a **short plain-text snippet** (excerpt, meta description, title).
 *
 * Same rules as `humanizeContent` but also strips leftover Markdown syntax
 * since these fields are rendered as plain text.
 */
export function humanizeSnippet(text: string): HumanizeResult {
  const original = text;
  const changes: string[] = [];

  // Strip markdown bold/italic
  const boldMatches = text.match(/\*\*([^*]+)\*\*|__([^_]+)__/g);
  if (boldMatches) changes.push(`Removed ${boldMatches.length} bold formatting instance(s)`);
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');

  const italicMatches = text.match(/(?<![a-zA-Z])\*([^*\n]+)\*(?![a-zA-Z])|(?<![a-zA-Z])_([^_\n]+)_(?![a-zA-Z])/g);
  if (italicMatches) changes.push(`Removed ${italicMatches.length} italic formatting instance(s)`);
  text = text.replace(/(?<![a-zA-Z])\*([^*\n]+)\*(?![a-zA-Z])/g, '$1');
  text = text.replace(/(?<![a-zA-Z])_([^_\n]+)_(?![a-zA-Z])/g, '$1');

  // Simplify markdown links → link text only
  const linkMatches = text.match(/\[([^\]]+)\]\([^)]+\)/g);
  if (linkMatches) changes.push(`Simplified ${linkMatches.length} markdown link(s)`);
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  text = applyEmDashes(text, changes);
  text = applyExclamationNorm(text, changes);
  text = applyStarters(text, changes);
  text = applyFillers(text, changes);
  text = applyWhitespace(text);

  return {
    original,
    humanized: text,
    changes,
    originalLength: original.length,
    humanizedLength: text.length,
    reduction: original.length - text.length,
  };
}
