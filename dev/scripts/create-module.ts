import fs from "fs";
import path from "path";
import process from "process";

const moduleName = process.argv[2];

if (!moduleName) {
  console.error("❌ Please provide a module name.");
  console.log("Example: npm run module users");
  process.exit(1);
}

const singularName = moduleName.endsWith("s")
  ? moduleName.slice(0, -1)
  : moduleName;

const modulePath = path.join(process.cwd(), "src", "modules", moduleName);

const folders = ["controller", "service", "types", "routes", "validation"];

for (const folder of folders) {
  fs.mkdirSync(path.join(modulePath, folder), { recursive: true });
}

const files: Record<string, string> = {
  [`controller/${singularName}.controller.ts`]: "",
  [`service/${singularName}.service.ts`]: "",
  [`types/${singularName}.types.ts`]: "",
  [`routes/${singularName}.routes.ts`]: "",
  [`validation/${singularName}.validation.ts`]: "",
  "index.ts": "",
};

for (const [file, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(modulePath, file), content);
}

console.log(`✅ Module "${moduleName}" created successfully.`);
