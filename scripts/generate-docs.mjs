import { rmSync } from "node:fs";
import { resolve } from "node:path";

import { runGraphQLMarkdown } from "@graphql-markdown/cli";

const GRAPHQL_DIR = resolve("./content/graphql");

rmSync(GRAPHQL_DIR, { force: true, recursive: true });

await runGraphQLMarkdown(
  {
    // Shared schema documented by every GraphQL-Markdown demo.
    schema:
      "https://raw.githubusercontent.com/graphql-markdown/graphql-markdown/main/tests/e2e/__data__/demo_schema.graphql",
    rootPath: "./content",
    baseURL: "graphql",
    homepage: "./content/_index.md",
    // Zola preset: Zola links and admonitions, and a section `_index.md` for
    // each generated category, which Zola needs to render a directory.
    formatter: "@graphql-markdown/formatters/zola",
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

console.log("GraphQL docs generated in content/graphql");
