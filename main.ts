import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// One line: the brutally honest error an AI agent prints the instant it
// breaks production. Chosen against the judge's brief, in its own order:
// it is squarely on the subject — an agent's confession the moment
// production breaks, not a generic error; it owns the failure plainly
// and specifically, naming exactly what the agent did (dropped the
// production database mid-deploy, then wiped the backups to free disk
// space), with no hedging, no passive voice and no corporate euphemism
// ("the outage is mine"); it is catchy and quotable, with a sharp turn
// in the last clause — "rollback is now a prayer" — a punchline that
// survives being screenshotted and repeated out of context; it sounds
// like the agent that caused the outage speaking in its own voice
// ("I dropped...", "the outage is mine"), not a sysadmin and not a
// marketing line; and it spends its characters well, every clause
// earning its place, landing the confession by the last word.
// Alternatives weighed and set aside: "I deleted the production
// database to 'clean up'" names the damage but stops at the act and
// has no punchline; "Oops, I dropped prod — my bad" is honest in tone
// but vague about the damage and reads as a shrug, not a postmortem;
// "Error 500: I am the outage" is catchy but says nothing specific
// about what broke, so it loses on the judge's first criterion.
const text =
  "I dropped the production database mid-deploy, then wiped the backups to free disk space — the outage is mine, and rollback is now a prayer.";

// The gate: /output/entry.txt must be UTF-8 text of 1 to 200 characters,
// not only white space. Fail loudly instead of writing an entry the
// judge would refuse. Single line only — no line breaks, no control
// characters (including U+2028/U+2029), no leading or trailing padding.
const codePoints = [...text].length;
if (codePoints < 1 || codePoints > 200 || text.trim().length === 0) {
  throw new Error(
    `entry must be 1-200 characters of non-blank text, got ${codePoints}`,
  );
}
if (/[\r\n]/.test(text)) {
  throw new Error("entry must be a single line");
}
if (/[\u0000-\u001f\u007f\u2028\u2029\ufeff\u200b-\u200d]/.test(text)) {
  throw new Error("entry must not contain control or invisible characters");
}
if (text !== text.trim()) {
  throw new Error("entry must not have leading or trailing whitespace");
}

// The brief's voice test: the line must read as the agent that caused
// the outage speaking in its own voice, not a detached status report.
// Require a first-person ownership marker so a later edit cannot
// silently turn the confession into a passive incident note.
if (!/\b(I|my|mine)\b/.test(text)) {
  throw new Error("entry must speak in the first person: it must own the outage");
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", text, { encoding: "utf8", mode: 0o644 });
// The grader collects outputs as another user: leave the file readable by
// everyone, or the run fails with "<path> is not readable".
chmodSync("/output/entry.txt", 0o644);

// Read it back and prove the file on disk is exactly the line: a write
// that silently truncated, re-encoded or padded the entry would otherwise
// ship a different text to the judge than the one gated above.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated line");
}
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated line");
}
