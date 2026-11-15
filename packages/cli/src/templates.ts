import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep, resolve } from "node:path";

export interface ProjectTemplate { id: string; name: string; language: "TypeScript" | "Python"; stack: string; files: Array<{ path: string; content: string }> }

const templates: ProjectTemplate[] = [
  { id: "node-ts-api", name: "Node.js TypeScript API", language: "TypeScript", stack: "Node.js + TypeScript + Fastify", files: [
    { path: "package.json", content: '{\n  "name": "{{project}}",\n  "private": true,\n  "type": "module",\n  "engines": { "node": ">=22" },\n  "scripts": { "dev": "tsx watch src/index.ts", "build": "tsc", "start": "node dist/index.js", "typecheck": "tsc --noEmit" },\n  "dependencies": { "fastify": "^5.0.0" },\n  "devDependencies": { "@types/node": "^22.0.0", "tsx": "^4.0.0", "typescript": "^5.0.0" }\n}\n' },
    { path: "tsconfig.json", content: '{\n  "compilerOptions": { "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext", "strict": true, "outDir": "dist", "rootDir": "src", "esModuleInterop": true },\n  "include": ["src/**/*.ts"]\n}\n' },
    { path: "src/index.ts", content: 'import Fastify from "fastify";\n\nconst app = Fastify({ logger: true });\napp.get("/health", async () => ({ status: "ok", service: "{{project}}" }));\n\nconst port = Number(process.env.PORT ?? 3000);\nawait app.listen({ port, host: process.env.HOST ?? "127.0.0.1" });\n' },
    { path: ".gitignore", content: "node_modules/\ndist/\n.env\n" },
    { path: ".env.example", content: "PORT=3000\nHOST=127.0.0.1\n" },
    { path: "README.md", content: "# {{project}}\n\nNode.js API scaffolded by EUREKA42 ASES Framework.\n\n## Start\n\n```sh\nnpm install\nnpm run dev\n```\n\nHealth check: `GET /health`. Review the generated configuration before exposing the service publicly.\n" }
  ] },
  { id: "python-fastapi", name: "Python FastAPI", language: "Python", stack: "Python + FastAPI + pytest", files: [
    { path: "pyproject.toml", content: '[project]\nname = "{{project}}"\nversion = "0.1.0"\nrequires-python = ">=3.11"\ndependencies = ["fastapi>=0.115,<1", "uvicorn[standard]>=0.30,<1"]\n\n[project.optional-dependencies]\ndev = ["pytest>=8,<9", "httpx>=0.27,<1"]\n\n[tool.pytest.ini_options]\ntestpaths = ["tests"]\n' },
    { path: "app/main.py", content: 'from fastapi import FastAPI\n\napp = FastAPI(title="{{project}}")\n\n@app.get("/health")\ndef health() -> dict[str, str]:\n    return {"status": "ok", "service": "{{project}}"}\n' },
    { path: "tests/test_health.py", content: 'from fastapi.testclient import TestClient\nfrom app.main import app\n\nclient = TestClient(app)\n\ndef test_health() -> None:\n    response = client.get("/health")\n    assert response.status_code == 200\n    assert response.json()["status"] == "ok"\n' },
    { path: "app/__init__.py", content: "" },
    { path: "tests/__init__.py", content: "" },
    { path: ".gitignore", content: "__pycache__/\n.venv/\n.pytest_cache/\n.env\n" },
    { path: ".env.example", content: "HOST=127.0.0.1\nPORT=8000\n" },
    { path: "README.md", content: "# {{project}}\n\nFastAPI service scaffolded by EUREKA42 ASES Framework.\n\n## Start\n\n```sh\npython -m venv .venv\n. .venv/bin/activate\npip install -e '.[dev]'\nuvicorn app.main:app --reload\n```\n\nHealth check: `GET /health`.\n" }
  ] },
  { id: "react-vite-ts", name: "React + Vite TypeScript", language: "TypeScript", stack: "React + Vite", files: [
    { path: "package.json", content: '{\n  "name": "{{project}}",\n  "private": true,\n  "type": "module",\n  "scripts": { "dev": "vite", "build": "tsc -b && vite build", "preview": "vite preview" },\n  "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },\n  "devDependencies": { "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0", "@vitejs/plugin-react": "^4.0.0", "typescript": "^5.0.0", "vite": "^6.0.0" }\n}\n' },
    { path: "index.html", content: '<!doctype html>\n<html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>{{project}}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n' },
    { path: "src/main.tsx", content: 'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport "./style.css";\n\nfunction App() { return <main><h1>{{project}}</h1><p>React + Vite + TypeScript</p></main>; }\n\ncreateRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);\n' },
    { path: "src/style.css", content: ":root { font-family: system-ui, sans-serif; color: #14231e; background: #f5f8f6; }\nbody { margin: 0; min-height: 100vh; display: grid; place-items: center; }\nmain { padding: 2rem; border: 1px solid #d8e5de; border-radius: 1rem; background: white; }\n" },
    { path: "vite.config.ts", content: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n' },
    { path: "tsconfig.json", content: '{\n  "compilerOptions": { "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler", "strict": true, "jsx": "react-jsx", "noEmit": true, "skipLibCheck": true },\n  "include": ["src", "vite.config.ts"]\n}\n' },
    { path: ".gitignore", content: "node_modules/\ndist/\n.env\n" },
    { path: "README.md", content: "# {{project}}\n\nReact application scaffolded by EUREKA42 ASES Framework.\n\n## Start\n\n```sh\nnpm install\nnpm run dev\n```\n" }
  ] }
];

export function listProjectTemplates(): Array<Omit<ProjectTemplate, "files"> & { files: string[] }> {
  return templates.map(({ files, ...template }) => ({ ...template, files: files.map((file) => file.path) }));
}

export function getProjectTemplate(id: string): ProjectTemplate {
  const template = templates.find((item) => item.id === id);
  if (!template) throw new Error(`Template desconhecido: ${id}. Consulte template list.`);
  return template;
}

export async function applyProjectTemplate(id: string, targetArg: string, projectName: string, apply: boolean): Promise<{ status: "planned" | "created"; template: string; root: string; files: string[] }> {
  const template = getProjectTemplate(id);
  const project = projectName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "ases-project";
  const root = resolve(targetArg);
  const files = template.files.map((file) => ({ path: file.path, content: file.content.replaceAll("{{project}}", project) }));
  for (const file of files) {
    if (file.path.startsWith("/") || file.path.split(/[\\/]/).some((part) => part === "..") || file.path.split(/[\\/]/).some((part) => part.startsWith("." ) && part !== ".gitignore" && part !== ".env.example")) throw new Error(`Caminho inseguro no template: ${file.path}`);
  }
  if (!apply) return { status: "planned", template: id, root, files: files.map((file) => file.path) };
  await mkdir(dirname(root), { recursive: true });
  try {
    await mkdir(root);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error("O destino já existe; escolha um diretório novo para não sobrescrever arquivos");
    throw error;
  }
  try {
    for (const file of files) {
      const output = join(root, file.path);
      const rel = relative(root, output);
      if (!rel || rel === ".." || rel.startsWith(`..${sep}`)) throw new Error("Caminho do arquivo escapou do destino");
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output, file.content, { flag: "wx" });
    }
  } catch (error) {
    throw new Error(`Falha ao provisionar ${id}; remova o diretório incompleto ${root} após revisar seus arquivos: ${error instanceof Error ? error.message : String(error)}`);
  }
  return { status: "created", template: id, root, files: files.map((file) => file.path) };
}
