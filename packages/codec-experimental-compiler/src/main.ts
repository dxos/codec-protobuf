#!/usr/bin/env node

import { ModuleSpecifier } from "./module-specifier";
import { compileSchema } from "./type-generator";
import { resolve } from 'path'

(async () => {
  const [,,protoFileArg, substitutionsFileArg, outDirArg] = process.argv;

  const substitutionsModule = ModuleSpecifier.resolveFromFilePath(substitutionsFileArg, process.cwd());
  const protoFilePath = resolve(process.cwd(), protoFileArg);
  const outDirPath = resolve(process.cwd(), outDirArg);

  compileSchema(substitutionsModule, protoFilePath, outDirPath);
})();
