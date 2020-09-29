import protobufjs from 'protobufjs';
import * as ts from 'typescript'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import chalk from 'chalk';
import { dirname, join } from 'path'
import { ModuleSpecifier } from './module-specifier';
import { parseSubstitutionsFile } from './substitutions-parser';
import { createDeclarations, createTypeDictinary } from './declaration-generator';
import { createSerializerDefinition } from './serializer-definition-generator';
import { getSafeNamespaceIdentifier, parseFullyQualifiedName, splitSchemaIntoNamespaces } from './namespaces';

const f = ts.factory;

export async function compileSchema(substitutionsModule: ModuleSpecifier | undefined, protoFilePath: string, outDirPath: string) {

  console.log(`Compiling protobuf definitions`)
  console.log(``)
  console.log(chalk`       Proto file: {bold ${protoFilePath}}`)
  substitutionsModule && console.log(chalk`Substitution file: {bold ${substitutionsModule.resolve()}}`)
  console.log(chalk` Output directory: {bold ${outDirPath}}`)
  console.log();

  const { imports, substitutions } = substitutionsModule ? parseSubstitutionsFile(substitutionsModule.resolve()) : { imports: [], substitutions: {} }

  if(Object.keys(substitutions).length > 0) {
    console.log(chalk`Loaded {bold ${Object.keys(substitutions).length}} substitutions:`);
    console.log();
    for(const [protoType, tsType] of Object.entries(substitutions)) {
      console.log(chalk`  {bold ${protoType}} -> {bold ${tsType!.name}}`)
    }
    console.log()
  } else {
    console.log(`No substitutions loaded`);
    console.log();
  }

  const root = await protobufjs.load(protoFilePath);

  const namespaces = splitSchemaIntoNamespaces(root)

  for(const [namespace, types] of namespaces) {
    const declarations: ts.Statement[] = Array.from(createDeclarations(types, substitutions))
    const outFile = join(outDirPath, getFileNameForNamespace(namespace))

    const importDeclarations = imports.map(decriptor => f.createImportDeclaration(
      [],
      [],
      decriptor.clause,
      ts.factory.createStringLiteral(decriptor.module.importSpecifier(dirname(outFile))),
    ))

    const otherNamespaceImports = Array.from(namespaces.keys())
      .filter(ns => ns !== namespace)
      .map(ns => f.createImportDeclaration(
        [],
        [],
        f.createImportClause(false, undefined, f.createNamespaceImport(f.createIdentifier(getSafeNamespaceIdentifier(parseFullyQualifiedName(ns))))),
        f.createStringLiteral(ModuleSpecifier.resolveFromFilePath(getFileNameForNamespace(ns), outDirPath).importSpecifier(dirname(outFile))),
      ))

    const generatedSourceFile = ts.factory.createSourceFile(
      [
        ...importDeclarations,
        ...otherNamespaceImports,
        ...declarations,
      ],
      ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
      ts.NodeFlags.None
    )
  
    const printer = ts.createPrinter()
    const source = printer.printFile(generatedSourceFile);

    if(!existsSync(dirname(outFile))) {
      mkdirSync(dirname(outFile), { recursive: true })
    }
    writeFileSync(outFile, source);
  }

  const { imports: schemaImports, exports: schemaExports } = createSerializerDefinition(substitutionsModule, root, outDirPath);

  const importDeclarations = imports.map(decriptor => ts.factory.createImportDeclaration(
    [],
    [],
    decriptor.clause,
    ts.factory.createStringLiteral(decriptor.module.importSpecifier(outDirPath)),
  ))

  const otherNamespaceImports = Array.from(namespaces.keys())
      .map(ns => f.createImportDeclaration(
        [],
        [],
        f.createImportClause(false, undefined, f.createNamespaceImport(f.createIdentifier(getSafeNamespaceIdentifier(parseFullyQualifiedName(ns))))),
        f.createStringLiteral(ModuleSpecifier.resolveFromFilePath(getFileNameForNamespace(ns), outDirPath).importSpecifier(outDirPath)),
      ))

  const generatedSourceFile = ts.factory.createSourceFile(
    [
      ...schemaImports,
      ...importDeclarations,
      ...otherNamespaceImports,
      createTypeDictinary(root),
      ...schemaExports,
    ],
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None
  )

  const printer = ts.createPrinter()
  const source = printer.printFile(generatedSourceFile);

  writeFileSync(join(outDirPath, 'index.ts'), source);
}

function getFileNameForNamespace(namespace: string) {
  const name = parseFullyQualifiedName(namespace);
  return `${name.join('/')}.ts`
}
