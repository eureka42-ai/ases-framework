#!/usr/bin/env node

const reset = "\u001b[0m";
const green = "\u001b[38;2;0;190;130m";
const muted = "\u001b[38;2;152;162;179m";
const mark = [
  "╭───╮ ╭───╮",
  "│   ╰─╯   │",
  "│   ╭─╮   │",
  "╰───╯ ╰───╯",
].join("\n");

if (process.argv.includes("--color") || process.stdout.isTTY) {
  process.stdout.write(`${green}${mark}\nEUREKA42${reset}\n${muted}ASES FRAMEWORK\nFrom specification to verified software.${reset}\n`);
} else {
  process.stdout.write(`${mark}\nEUREKA42\nASES FRAMEWORK\nFrom specification to verified software.\n`);
}
