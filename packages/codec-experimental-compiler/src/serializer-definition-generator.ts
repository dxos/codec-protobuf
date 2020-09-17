import protobufjs from 'protobufjs';
import * as ts from 'typescript';
import { CODEC_MODULE, ModuleSpecifier } from './module-specifier';

export function createSerializerDefinition(substitutionsModule: ModuleSpecifier, root: protobufjs.Root, outFileDir: string) {
  const serializerIdentifier = ts.factory.createIdentifier('Serializer')

  const serializerImport = ts.factory.createImportDeclaration(
    [],
    [],
    ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(undefined, serializerIdentifier)
    ])),
    ts.factory.createStringLiteral(CODEC_MODULE.forContext(outFileDir))
  )

  const substitutionsIdentifier = ts.factory.createIdentifier('substitutions')
  const substitutionsImport = ts.factory.createImportDeclaration(
    [],
    [],
    ts.factory.createImportClause(false, substitutionsIdentifier, undefined),
    ts.factory.createStringLiteral(substitutionsModule.forContext(outFileDir)),
  )

  const schemaIdentifier = ts.factory.createIdentifier('schemaJson');
  const schemaExport = ts.factory.createVariableStatement(
    [ts.createToken(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList([
      ts.factory.createVariableDeclaration(
        schemaIdentifier,
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

  const serializerExport = ts.factory.createVariableStatement(
    [ts.createToken(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList([
      ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier('serializer'),
        undefined,
        undefined,
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(serializerIdentifier, 'fromJsonSchema'),
          [ts.factory.createTypeReferenceNode('TYPES')],
          [schemaIdentifier, substitutionsIdentifier]
        )
      )
    ], ts.NodeFlags.Const)
  )

  return {
    imports: [serializerImport, substitutionsImport],
    exports: [schemaExport, serializerExport],
  }
}
