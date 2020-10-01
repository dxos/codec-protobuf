#!/usr/bin/env node

//
// Copyright 2020 DXOS.org
//

import { ArgumentParser } from 'argparse';
import { resolve } from 'path';
import readPkg from 'read-pkg';

import { ModuleSpecifier } from './module-specifier';
import { compileSchema } from './type-generator';

(async () => {
  const { version } = await readPkg();

  const parser = new ArgumentParser({
    description: 'Argparse example'
  });

  parser.add_argument('-v', '--version', { action: 'version', version } as any);
  parser.add_argument('proto', { help: 'protobuf input files', nargs: '+' });
  parser.add_argument('-s', '--substitutions', { help: 'substitutions file' });
  parser.add_argument('-o', '--outDir', { help: 'output directory path', required: true });

  const { proto, substitutions, outDir } = parser.parse_args();

  if (proto.length > 1) {
    console.error('Multi-file builds are not supported for now. As a workaround specify a single main .proto file that imports all of the other ones');
    process.exit(-1);
  }

  const substitutionsModule = substitutions ? ModuleSpecifier.resolveFromFilePath(substitutions, process.cwd()) : undefined;
  const protoFilePath = resolve(process.cwd(), proto[0]);
  const outDirPath = resolve(process.cwd(), outDir);

  compileSchema(substitutionsModule, protoFilePath, outDirPath);
})();
