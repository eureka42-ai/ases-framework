const RESET = "\u001b[0m";
const TEAL = "\u001b[38;2;52;214;188m";
const MUTED = "\u001b[38;2;152;162;179m";

export function supportsColor(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NO_COLOR === undefined && env.TERM !== "dumb";
}

export function renderLogo(color = supportsColor()): string {
  const mark = [
    "   ╭─╮ ╭─╮   ",
    " ╭─╯ ╰─╯ ╰─╮ ",
    " ╰─╮ ╭─╮ ╭─╯ ",
    "   ╰─╯ ╰─╯   "
  ].join("\n");
  const word = "EUREKA42 ASES";
  const tagline = "From specification to verified software.";
  if (!color) return `${mark}\n${word}\n${tagline}`;
  return `${TEAL}${mark}\n${word}${RESET}\n${MUTED}${tagline}${RESET}`;
}

