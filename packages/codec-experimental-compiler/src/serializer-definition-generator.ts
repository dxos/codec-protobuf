import protobufjs from 'protobufjs';
import * as ts from 'typescript';
import { CODEC_MODULE, ModuleSpecifier } from './module-specifier';

export function createSerializerDefinition(substitutionsModule: ModuleSpecifier, root: protobufjs.Root, outFileDir: string) {
  const schemaIdentifier = ts.factory.createIdentifier('Schema')

  const schemaImport = ts.factory.createImportDeclaration(
    [],
    [],
    ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(undefined, schemaIdentifier)
    ])),
    ts.factory.createStringLiteral(CODEC_MODULE.importSpecifier(outFileDir))
  )

  const substitutionsIdentifier = ts.factory.createIdentifier('substitutions')
  const substitutionsImport = ts.factory.createImportDeclaration(
    [],
    [],
    ts.factory.createImportClause(false, substitutionsIdentifier, undefined),
    ts.factory.createStringLiteral(substitutionsModule.importSpecifier(outFileDir)),
  )

  const schemaJsonIdentifier = ts.factory.createIdentifier('schemaJson');
  const schemaJsonExport = ts.factory.createVariableStatement(
    [ts.createToken(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList([
      ts.factory.createVariableDeclaration(
        schemaJsonIdentifier,
        undefined,
        undefined,
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('JSON'), 'parse'),
          undefined,
          [ts.factory.createStringLiteral(JSON.stringify(root.toJSON()))]
        )
      )
    ], ts.NodeFlags.Const)
  )

  const schemaExport = ts.factory.createVariableStatement(
    [ts.createToken(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList([
      ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier('schema'),
        undefined,
        undefined,
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(schemaIdentifier, 'fromJson'),
          [ts.factory.createTypeReferenceNode('TYPES')],
          [schemaJsonIdentifier, substitutionsIdentifier]
        )
      )
    ], ts.NodeFlags.Const)
  )

  return {
    imports: [schemaImport, substitutionsImport],
    exports: [schemaJsonExport, schemaExport],
  }
}
