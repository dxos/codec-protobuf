#!/usr/bin/env node

import { ModuleSpecifier } from "./module-specifier";
import { compileSchema } from "./type-generator";
import { resolve } from 'path'

(async () => {
  const [,,protoFileArg, substitutionsFileArg, outFileArg] = process.argv;

  const substitutionsModule = ModuleSpecifier.resolveFromFilePath(substitutionsFileArg, process.cwd());
  const protoFilePath = resolve(process.cwd(), protoFileArg);
  const outFilePath = resolve(process.cwd(), outFileArg);

  compileSchema(substitutionsModule, protoFilePath, outFilePath);
})();
