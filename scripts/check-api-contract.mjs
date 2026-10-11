#!/usr/bin/env node
/**
 * Checks this app's mirrored types against calc-api's DTOs.
 *
 * Every type in src/features/<feature>/types.ts that mirrors a backend DTO already says so in its
 * doc comment -- "Mirrors calc-api's SegmentFlowRowDto". That sentence is the mapping: this script
 * reads it, finds the Java file of that name, and compares the two field lists. Nothing to
 * maintain by hand, and a type that doesn't claim to mirror anything is reported as unchecked
 * rather than silently skipped.
 *
 * It compares field *names* only. Types are not compared: Java's Double/Integer/BigDecimal all
 * land as JSON numbers, and nullability on the wire is a Jackson concern, so a name-level check is
 * the part that can be made exact. That's also the failure it was written for -- calc-api added
 * SegmentFlowRowDto.fittingCFactorAdjustment, the frontend type never gained it, and the worksheet
 * quietly dropped a column with every check in both repos passing.
 *
 * Usage:
 *   node scripts/check-api-contract.mjs [--api <path to calc-api checkout>] [--require]
 *
 * --require fails when the backend checkout is missing, instead of skipping. CI passes it; a local
 * run without the sibling repo checked out just skips.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = fileURLToPath(new URL("..", import.meta.url));
const DEFAULT_API_PATHS = ["../engineering-calc", "../calc-api-source", "./calc-api-source"];
const MIRROR_TAG = /Mirrors calc-api's ([A-Za-z][A-Za-z0-9_]*)/;

function parseArgs(argv) {
  const args = { apiPath: null, require: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--api") {
      args.apiPath = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--require") {
      args.require = true;
    }
  }
  return args;
}

/** Every file under `dir` whose name ends with `suffix`. */
function walk(dir, suffix, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, suffix, found);
    } else if (entry.endsWith(suffix)) {
      found.push(full);
    }
  }
  return found;
}

/** Strips // and /* *\/ comments, so neither parser trips over commented-out fields. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * Splits a parameter list on commas that are at depth zero -- Map<String, Double> is one
 * component, not two.
 */
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "<" || char === "(" || char === "[") depth += 1;
    if (char === ">" || char === ")" || char === "]") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/** The text between the parenthesis at `openIndex` and its match. */
function balancedSlice(source, openIndex, open = "(", close = ")") {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === open) depth += 1;
    else if (source[i] === close) {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, i);
    }
  }
  return null;
}

/**
 * The record components or enum constants of a Java type.
 * @returns {{kind: "record"|"enum", fields: string[]} | null}
 */
function parseJavaType(source, typeName) {
  const clean = stripComments(source);

  const recordAt = clean.search(new RegExp(`\\brecord\\s+${typeName}\\s*\\(`));
  if (recordAt !== -1) {
    const open = clean.indexOf("(", recordAt);
    const body = balancedSlice(clean, open);
    if (body === null) return null;
    const fields = splitTopLevel(body)
      .map((component) =>
        component
          // Annotations, with or without arguments: @NotNull, @Size(min = 1).
          .replace(/@[A-Za-z][A-Za-z0-9_.]*\s*(\([^)]*\))?/g, "")
          .trim(),
      )
      .filter(Boolean)
      // "List<SprinklerPipeSegmentDto> segments" -> "segments"
      .map((component) => component.split(/\s+/).pop());
    return { kind: "record", fields };
  }

  // A few DTOs are mutable beans rather than records -- VoltageDropRequest is one, so Jackson can
  // leave a field at its initialized default when the body omits it. Its instance fields are the
  // contract. (A bean used as a *response* could also expose a computed getter, which this does
  // not see; none currently do.)
  const classAt = clean.search(new RegExp(`\\bclass\\s+${typeName}\\b`));
  if (classAt !== -1) {
    const open = clean.indexOf("{", classAt);
    const body = balancedSlice(clean, open, "{", "}");
    if (body !== null) {
      const fields = [...body.matchAll(/^\s*private\s+(?!static)([\w.<>,\[\]\s]+?)\s+(\w+)\s*(?:=[^;]*)?;/gm)].map(
        (field) => field[2],
      );
      if (fields.length > 0) return { kind: "bean", fields };
    }
  }

  const enumAt = clean.search(new RegExp(`\\benum\\s+${typeName}\\b`));
  if (enumAt !== -1) {
    const open = clean.indexOf("{", enumAt);
    const body = balancedSlice(clean, open, "{", "}");
    if (body === null) return null;
    // Constants run up to the first semicolon; anything after it is methods or fields.
    const constantsPart = body.split(";")[0];
    const fields = splitTopLevel(constantsPart)
      .map((entry) => entry.trim().replace(/\s*\([\s\S]*$/, ""))
      .filter((entry) => /^[A-Z][A-Z0-9_]*$/.test(entry));
    return { kind: "enum", fields };
  }

  return null;
}

/**
 * Declarations in a TypeScript file that claim to mirror a backend DTO, with the fields each one
 * declares. Only a doc comment attached directly to the declaration counts, so a file-level
 * comment mentioning the backend isn't mistaken for one type's mapping.
 */
function parseTsMirrors(source, filePath) {
  const mirrors = [];
  // (?:(?!\*\/)[\s\S])*? keeps the doc comment from swallowing a later one: without it, a
  // file-level comment followed by a blank line and a real doc comment match as a single block,
  // and the file header's wording gets read as the declaration's mapping.
  const declaration =
    /\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*export\s+(interface|const)\s+([A-Za-z_$][\w$]*)\s*(?:=\s*)?/g;

  let match;
  while ((match = declaration.exec(source)) !== null) {
    const [, docComment, kind, name] = match;
    const tag = docComment.match(MIRROR_TAG);
    if (!tag) continue;

    const afterDeclaration = source.slice(match.index + match[0].length);
    const fields =
      kind === "interface"
        ? parseTsInterfaceFields(afterDeclaration)
        : parseTsConstValues(afterDeclaration);
    if (fields === null) continue;

    mirrors.push({ name, javaType: tag[1], kind, fields, filePath });
  }
  return mirrors;
}

/** Property names of an interface body, ignoring anything nested inside a property's own type. */
function parseTsInterfaceFields(afterDeclaration) {
  const open = afterDeclaration.indexOf("{");
  if (open === -1) return null;
  const body = balancedSlice(afterDeclaration, open, "{", "}");
  if (body === null) return null;

  const fields = [];
  let depth = 0;
  for (const rawLine of stripComments(body).split("\n")) {
    const line = rawLine.trim();
    if (depth === 0) {
      const property = line.match(/^(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:/);
      if (property) fields.push(property[1]);
    }
    depth += (line.match(/[{[]/g) ?? []).length - (line.match(/[}\]]/g) ?? []).length;
  }
  return fields;
}

/** String literals of an `export const X = ["A", "B"] as const` union source. */
function parseTsConstValues(afterDeclaration) {
  const open = afterDeclaration.indexOf("[");
  if (open === -1) return null;
  const body = balancedSlice(afterDeclaration, open, "[", "]");
  if (body === null) return null;
  return [...body.matchAll(/["']([^"']+)["']/g)].map((entry) => entry[1]);
}

function resolveApiPath(explicit) {
  const candidates = explicit ? [explicit] : DEFAULT_API_PATHS;
  for (const candidate of candidates) {
    const full = join(WEB_ROOT, candidate);
    if (existsSync(join(full, "calc-api", "src", "main"))) return full;
    if (existsSync(join(candidate, "calc-api", "src", "main"))) return candidate;
  }
  return null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiRoot = resolveApiPath(args.apiPath);

  if (!apiRoot) {
    const message = `calc-api source not found (looked in: ${(args.apiPath ? [args.apiPath] : DEFAULT_API_PATHS).join(", ")}).`;
    if (args.require) {
      console.error(`FAIL ${message} Pass --api <path> or check the repository out alongside this one.`);
      process.exit(1);
    }
    console.log(`SKIP ${message} Pass --api <path> to run the check.`);
    return;
  }

  const javaFiles = new Map();
  for (const file of walk(join(apiRoot, "calc-api", "src", "main"), ".java")) {
    javaFiles.set(file.split(/[\\/]/).pop().replace(/\.java$/, ""), file);
  }

  const tsFiles = walk(join(WEB_ROOT, "src", "features"), "types.ts");
  const problems = [];
  let checked = 0;
  let untagged = 0;

  for (const tsFile of tsFiles) {
    const source = readFileSync(tsFile, "utf8");
    const relativePath = relative(WEB_ROOT, tsFile).replace(/\\/g, "/");

    untagged += [...source.matchAll(/export\s+interface\s+([A-Za-z_$][\w$]*)/g)].filter(
      (interfaceMatch) => {
        const preceding = source.slice(0, interfaceMatch.index);
        const lastComment = preceding.lastIndexOf("/**");
        if (lastComment === -1) return true;
        const between = preceding.slice(preceding.indexOf("*/", lastComment) + 2);
        return between.trim() !== "" || !MIRROR_TAG.test(preceding.slice(lastComment));
      },
    ).length;

    for (const mirror of parseTsMirrors(source, relativePath)) {
      const javaFile = javaFiles.get(mirror.javaType);
      if (!javaFile) {
        problems.push(
          `${relativePath}: ${mirror.name} says it mirrors ${mirror.javaType}, but calc-api has no such type (renamed or removed?).`,
        );
        continue;
      }

      const parsed = parseJavaType(readFileSync(javaFile, "utf8"), mirror.javaType);
      if (!parsed) {
        problems.push(
          `${relativePath}: ${mirror.name} mirrors ${mirror.javaType}, which is not a record, bean or enum -- this checker can't read it.`,
        );
        continue;
      }

      checked += 1;
      const javaFields = new Set(parsed.fields);
      const tsFields = new Set(mirror.fields);
      const missing = [...javaFields].filter((field) => !tsFields.has(field));
      const extra = [...tsFields].filter((field) => !javaFields.has(field));

      if (missing.length > 0) {
        problems.push(
          `${relativePath}: ${mirror.name} is missing ${missing.length} field(s) that ${mirror.javaType} has: ${missing.join(", ")}.`,
        );
      }
      if (extra.length > 0) {
        problems.push(
          `${relativePath}: ${mirror.name} declares ${extra.length} field(s) ${mirror.javaType} does not have: ${extra.join(", ")}.`,
        );
      }
    }
  }

  console.log(
    `Checked ${checked} mirrored type(s) against ${relative(WEB_ROOT, apiRoot).replace(/\\/g, "/") || apiRoot}.`,
  );
  if (untagged > 0) {
    console.log(
      `${untagged} exported interface(s) in src/features/*/types.ts don't say what they mirror, so they aren't checked.`,
    );
  }

  if (problems.length > 0) {
    console.error(`\n${problems.length} contract problem(s):\n`);
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error("\nUpdate the frontend type to match calc-api, or fix the DTO if the frontend is right.");
    process.exit(1);
  }

  console.log("No drift between the mirrored types and calc-api's DTOs.");
}

main();
