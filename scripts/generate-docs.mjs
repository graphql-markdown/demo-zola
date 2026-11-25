import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { runGraphQLMarkdown } from "@graphql-markdown/cli";

import { decorators } from "../lib/decorators.mjs";

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
    // Zola preset (links, admonitions, section `_index.md`) plus linked
    // deprecation reasons and a "View as Markdown" link. Absolute URL: relative
    // formatter paths resolve against the package, not the project.
    formatter: pathToFileURL(resolve("./lib/formatter.mjs")).href,
    loaders: {
      UrlLoader: "@graphql-tools/url-loader",
    },
    decorators,
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
