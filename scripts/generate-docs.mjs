import { readdir, writeFile, access } from "node:fs/promises";
import { rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { runGraphQLMarkdown } from "@graphql-markdown/cli";

const customMDX = pathToFileURL(
  resolve("./scripts/custom-zola-mdx.mjs"),
).href;

const CONTENT_DIR = resolve("./content");
const GRAPHQL_DIR = resolve(CONTENT_DIR, "graphql");

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const titleFromDir = (name) =>
  name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Zola only renders directories that are sections (have an _index.md).
// Give every directory holding pages but no _index.md a minimal section file.
const ensureSectionIndexes = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const hasPages = entries.some(
    (e) => e.isFile() && e.name.endsWith(".md") && e.name !== "_index.md",
  );

  if (hasPages && !(await exists(join(dir, "_index.md")))) {
    const title = titleFromDir(dir.split("/").pop());
    await writeFile(
      join(dir, "_index.md"),
      `---\ntitle: "${title}"\nsort_by: "title"\n---\n\n# ${title}\n`,
    );
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await ensureSectionIndexes(join(dir, entry.name));
    }
  }
};

rmSync(GRAPHQL_DIR, { force: true, recursive: true });

await runGraphQLMarkdown(
  {
    // Shared schema documented by every GraphQL-Markdown demo.
    schema:
      "https://raw.githubusercontent.com/graphql-markdown/graphql-markdown/main/tests/e2e/__data__/demo_schema.graphql",
    rootPath: "./content",
    baseURL: "graphql",
    homepage: "./content/_index.md",
    formatter: customMDX,
    loaders: {
      UrlLoader: "@graphql-tools/url-loader",
    },
    pretty: true,
    force: true,
    telemetry: false,
    docOptions: {
      sectionHeaderId: false,
    },
  },
  {},
);

await ensureSectionIndexes(GRAPHQL_DIR);

console.log("GraphQL docs generated in content/graphql");
