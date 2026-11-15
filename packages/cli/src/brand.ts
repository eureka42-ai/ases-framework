const RESET = "\u001b[0m";
const GREEN = "\u001b[38;2;0;190;130m";
const MUTED = "\u001b[38;2;152;162;179m";

export function supportsColor(env: NodeJS.ProcessEnv = process.env, isTTY = Boolean(process.stdout.isTTY)): boolean {
  return isTTY && env.NO_COLOR === undefined && env.TERM !== "dumb";
}

export function renderLogo(color = supportsColor(), tagline = "From specification to verified software."): string {
  const mark = [
    "╭───╮ ╭───╮",
    "│   ╰─╯   │",
    "│   ╭─╮   │",
    "╰───╯ ╰───╯"
  ].join("\n");
  const word = "EUREKA42";
  const product = "ASES FRAMEWORK";
  if (!color) return `${mark}\n${word}\n${product}\n${tagline}`;
  return `${GREEN}${mark}\n${word}${RESET}\n${MUTED}${product}\n${tagline}${RESET}`;
}

