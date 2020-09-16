import protobufjs from 'protobufjs';
import * as ts from 'typescript'
import { writeFileSync } from 'fs'
import { ModuleSpecifier } from './module-specifier';
import { resolve, dirname } from 'path'
import { parseSubstitutionsFile } from './substitutions-parser';
import { createDeclarationForType } from './declaration-generator';
import { createSerializerDefinition } from './serializer-definition-generator';

(async () => {
  const [,,protoFileArg, substitutionsFileArg, outFileArg] = process.argv;

  const substitutionsModule = ModuleSpecifier.resolveFromFilePath(substitutionsFileArg, process.cwd(), '.ts');
  const protoFilePath = resolve(process.cwd(), protoFileArg);
  const outFilePath = resolve(process.cwd(), outFileArg);

  const { imports, substitutions } = parseSubstitutionsFile(substitutionsModule.resolve())
  const root = await protobufjs.load(protoFilePath);

  const declarations: ts.Statement[] = []
  for (const obj of root.nestedArray) {
    if(obj instanceof protobufjs.Type) {
      declarations.push(createDeclarationForType(obj, substitutions))
    }
  }

  const { imports: schemaImports, exports: schemaExports } = createSerializerDefinition(substitutionsModule, root, dirname(outFilePath));

  const importDeclarations = imports.map(decriptor => ts.factory.createImportDeclaration(
    [],
    [],
    decriptor.clause,
    ts.factory.createStringLiteral(decriptor.module.forContext(dirname(outFilePath))),
  )) 
  
  const generatedSourceFile = ts.factory.createSourceFile(
    [
      ...schemaImports,
      ...importDeclarations,
      ...declarations,
      ...schemaExports,
    ],
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None
  )

  const printer = ts.createPrinter()
  const source = printer.printFile(generatedSourceFile);

  writeFileSync(outFilePath, source);
})();
