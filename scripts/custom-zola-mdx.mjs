import { join, posix } from "node:path";

import {
  FRONT_MATTER_DELIMITER,
  MARKDOWN_EOL,
  MARKDOWN_EOP,
  saveFile,
  startCase,
} from "@graphql-markdown/utils";

import HugoFormatter from "@graphql-markdown/formatters/hugo";

const hugoFormatFunctions =
  typeof HugoFormatter.createMDXFormatter === "function"
    ? HugoFormatter.createMDXFormatter()
    : HugoFormatter;

// Zola only accepts a fixed set of top-level front matter keys.
// Everything else is moved under `extra:` so pages still build.
const ZOLA_PAGE_KEYS = new Set([
  "title",
  "description",
  "weight",
  "draft",
  "slug",
  "aliases",
  "template",
  "date",
  "updated",
]);

export const mdxExtension = ".md";

/**
 * Splits a formatted `key: value` line list into top-level entries.
 * Indented lines are treated as continuations of the previous key.
 */
const parseEntries = (lines) => {
  const entries = [];
  for (const line of lines) {
    if (/^\s/.test(line) && entries.length > 0) {
      entries[entries.length - 1].lines.push(line);
      continue;
    }
    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(line);
    if (match) {
      entries.push({ key: match[1], lines: [line] });
    }
  }
  return entries;
};

/**
 * Zola front matter: whitelisted top-level keys, the rest nested under `extra:`.
 * The visible `# Title` heading is still produced by the Hugo preset.
 */
export const formatMDXFrontmatter = (props, formatted) => {
  const hugoOutput = HugoFormatter.formatMDXFrontmatter(props, formatted);
  if (!hugoOutput) {
    return hugoOutput;
  }

  const closing = hugoOutput.indexOf(`${MARKDOWN_EOL}${FRONT_MATTER_DELIMITER}`, 3);
  const heading = hugoOutput.slice(closing + FRONT_MATTER_DELIMITER.length + 1);
  const lines = hugoOutput
    .slice(FRONT_MATTER_DELIMITER.length + MARKDOWN_EOL.length, closing)
    .split(MARKDOWN_EOL);

  const entries = parseEntries(lines);
  const topLevel = entries.filter((e) => ZOLA_PAGE_KEYS.has(e.key));
  const extra = entries.filter((e) => !ZOLA_PAGE_KEYS.has(e.key));

  const out = [FRONT_MATTER_DELIMITER];
  for (const entry of topLevel) {
    out.push(...entry.lines);
  }
  if (extra.length > 0) {
    out.push("extra:");
    for (const entry of extra) {
      out.push(...entry.lines.map((l) => `  ${l}`));
    }
  }
  out.push(FRONT_MATTER_DELIMITER);

  return `${out.join(MARKDOWN_EOL)}${heading}`;
};

/**
 * Internal links become Zola's checked `@/` form (root-relative to `content/`).
 * External links are returned unchanged.
 */
export const formatMDXLink = ({ text, url }) => {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#|@\/)/i.test(url)) {
    return { text, url };
  }

  const [pathPart, ...anchor] = url.split("#");
  const normalized = posix.normalize(pathPart.replace(/\\/g, "/"));
  const path = normalized
    .replace(/^(\.\.\/|\.\/)+/, "")
    .replace(/^\/+/, "")
    .replace(/\.md$/, "");
  const hash = anchor.length > 0 ? `#${anchor.join("#")}` : "";
  return { text, url: `@/${path}.md${hash}` };
};

/**
 * Plain blockquote with a bold title (no GitHub-style `> [!TYPE]` alerts).
 */
export const formatMDXAdmonition = ({ text, title }) => {
  const titleLine = title
    ? `> **${title}**${MARKDOWN_EOL}>${MARKDOWN_EOL}`
    : "";
  const body = text
    .trim()
    .split(/\r?\n/)
    .map((line) => (line ? `> ${line}` : ">"))
    .join(MARKDOWN_EOL);

  return `${MARKDOWN_EOP}${titleLine}${body}${MARKDOWN_EOL}${MARKDOWN_EOP}`;
};

/**
 * Writes Zola section front matter (`_index.md`) without Hugo-only keys.
 */
export const beforeGenerateIndexMetafileHook = async (event) => {
  const { dirPath, category } = event.data;
  const filePath = join(dirPath, "_index.md");
  const label = startCase(category);
  const content = [
    FRONT_MATTER_DELIMITER,
    `title: "${label}"`,
    `sort_by: "title"`,
    FRONT_MATTER_DELIMITER,
    "",
    `# ${label}`,
    "",
  ].join(MARKDOWN_EOL);

  await saveFile(filePath, content);
};

export default {
  ...hugoFormatFunctions,
  formatMDXFrontmatter,
  formatMDXLink,
  formatMDXAdmonition,
  beforeGenerateIndexMetafileHook,
  mdxExtension,
};
