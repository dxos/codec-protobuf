import protobufjs from 'protobufjs';
import * as ts from 'typescript'
import { writeFileSync } from 'fs'
import { ModuleSpecifier } from './module-specifier';
import { dirname } from 'path'
import { parseSubstitutionsFile } from './substitutions-parser';
import { createDeclarationForType } from './declaration-generator';
import { createSerializerDefinition } from './serializer-definition-generator';

function* enumerateNestedTypes(root: protobufjs.NamespaceBase): Generator<protobufjs.Type> {
  for (const obj of root.nestedArray) {
    if(obj instanceof protobufjs.Type) {
      yield obj;
      yield* enumerateNestedTypes(obj)
    } else if(obj instanceof protobufjs.Namespace) {
      yield* enumerateNestedTypes(obj)
    }
  }
}

export async function compileSchema(substitutionsModule: ModuleSpecifier, protoFilePath: string, outFilePath: string) {
  const { imports, substitutions } = parseSubstitutionsFile(substitutionsModule.resolve())
  const root = await protobufjs.load(protoFilePath);

  const declarations: ts.Statement[] = []
  for (const obj of enumerateNestedTypes(root)) {
    declarations.push(createDeclarationForType(obj, substitutions))
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
}
