#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Command } from "commander";

const packageMetadata: { version: string } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

new Command()
  .name("devorbit")
  .description("AI development toolkit")
  .version(packageMetadata.version)
  .parse(process.argv);
