// Prints a version's release notes: its section of CHANGELOG.md, without the
// heading. Fails if the version has no section or an empty one, so CI can
// require one for the version in package.json.
// Usage: node scripts/release-notes.js [--amo] [version]
//   version  defaults to the one in package.json.
//   --amo    prints the `web-ext sign --amo-metadata` JSON that sets the
//            notes as the AMO version's release notes, instead of Markdown.
import { readFileSync } from 'node:fs';
import process from 'node:process';

const args = process.argv.slice(2);
const amo = args.includes('--amo');
const version =
  args.find((arg) => !arg.startsWith('--')) ??
  JSON.parse(readFileSync('package.json', 'utf8')).version;

const lines = readFileSync('CHANGELOG.md', 'utf8').split('\n');
const start = lines.findIndex(
  (line) => line === `## ${version}` || line.startsWith(`## ${version} `),
);
if (start === -1) {
  console.error(`CHANGELOG.md has no section for ${version}.`);
  process.exit(1);
}
const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
const notes = lines
  .slice(start + 1, end === -1 ? undefined : end)
  .join('\n')
  .trim();
if (notes === '') {
  console.error(`CHANGELOG.md's section for ${version} is empty.`);
  process.exit(1);
}

console.log(
  amo
    ? JSON.stringify({ version: { release_notes: { 'en-US': notes } } })
    : notes,
);
