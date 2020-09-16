import protobufjs from 'protobufjs';
import * as ts from 'typescript'
import { writeFileSync } from 'fs'
import { ModuleSpecifier, CODEC_MODULE } from './module-specifier';
import { join, dirname } from 'path'

interface ImportDescriptor {
  clause: ts.ImportClause,
  module: ModuleSpecifier,
}
 
function parseSubsFile(fileName: string) {
  const program = ts.createProgram([fileName], {})
  const sourceFile = program.getSourceFile(fileName)!;
  const typeChecker = program.getTypeChecker();

  const imports: ImportDescriptor[] = []
  const subs: Record<string, string> = {}
  ts.forEachChild(sourceFile, node => {
    if(ts.isExportAssignment(node)) {
      const obj = node.expression

      const type = typeChecker.getTypeAtLocation(obj);
      const members = (type as any).members as Map<string, ts.Symbol>
      for(const [key, symbol] of members) {
        const symbolType = typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)
        
        const decodeSymbol = (symbolType as any).members.get('decode') as ts.Symbol
        const decodeSymbolType = typeChecker.getTypeOfSymbolAtLocation(decodeSymbol, decodeSymbol.valueDeclaration)
        const callsignature = decodeSymbolType.getCallSignatures()[0]
        const returnTypeName = typeChecker.getReturnTypeOfSignature(callsignature).getSymbol()?.name
        subs[key] = returnTypeName!
      }
    } else if(ts.isImportDeclaration(node)) {
      if(ts.isStringLiteral(node.moduleSpecifier) && node.importClause) {
        imports.push({
          clause: node.importClause,
          module: new ModuleSpecifier(node.moduleSpecifier.text, dirname(sourceFile.fileName))
        })
      }
    }
  })

  return { program, sourceFile, imports, subs }
}

function getFieldType(field: protobufjs.Field, subs: Record<string, string>): ts.TypeNode {
  if(field.repeated) {
    return ts.factory.createArrayTypeNode(getScalarType(field, subs))
  } else {
    return getScalarType(field, subs)
  }
}

function getScalarType(field: protobufjs.Field, subs: Record<string, string>): ts.TypeNode {
  switch(field.type) {
    case 'string': return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    default:
      if(subs[field.type]) {
        return ts.factory.createTypeReferenceNode(subs[field.type]!)
      }
      if(!field.resolved) {
        field.resolve()
      }
      if(field.resolvedType) {
        return ts.factory.createTypeReferenceNode(field.resolvedType.name)
      }

      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
  }
}

(async () => {
  const fileName = require.resolve('../test/substitutions.ts')
  const { sourceFile, imports, subs } = parseSubsFile(fileName)
  const root = await protobufjs.load(require.resolve('../test/schema.proto'));

  const declarations: ts.Statement[] = []
  for (const obj of root.nestedArray) {
    if(obj instanceof protobufjs.Type) {
      declarations.push(ts.createInterfaceDeclaration(
        undefined,
        [ts.createToken(ts.SyntaxKind.ExportKeyword)],
        obj.name,
        undefined,
        undefined,
        obj.fieldsArray.map(field => ts.createPropertySignature(
          undefined,
          field.name,
          field.required ? undefined : ts.factory.createToken(ts.SyntaxKind.QuestionToken),
          getFieldType(field, subs),
          undefined
        )),
      ))
    }
  }

  const schemaJSON = root.toJSON();

  const serializerIdentifier = ts.factory.createIdentifier('Serializer')

  const outFilePath = join(__dirname, '../test/gen/serializer.ts')

  const serializerImport = ts.factory.createImportDeclaration(
    [],
    [],
    ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(undefined, serializerIdentifier)
    ])),
    ts.factory.createStringLiteral(CODEC_MODULE.forContext(dirname(outFilePath)))
  )

  const substitutionsIdentifier = ts.factory.createIdentifier('substitutions')
  const substitutionsImport = ts.factory.createImportDeclaration(
    [],
    [],
    ts.factory.createImportClause(false, substitutionsIdentifier, undefined),
    ts.factory.createStringLiteral(new ModuleSpecifier('../test/substitutions', __dirname).forContext(dirname(outFilePath))),
  )

  const importDeclarations = imports.map(decriptor => ts.factory.createImportDeclaration(
    [],
    [],
    decriptor.clause,
    ts.factory.createStringLiteral(decriptor.module.forContext(dirname(outFilePath))),
  )) 

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
          [ts.factory.createStringLiteral(JSON.stringify(schemaJSON))]
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
          undefined,
          [schemaIdentifier, substitutionsIdentifier]
        )
      )
    ], ts.NodeFlags.Const)
  )

  const generatedSourceFile = ts.factory.createSourceFile(
    [
      serializerImport,
      ...importDeclarations,
      substitutionsImport,
      ...declarations,
      schemaExport,
      serializerExport,
    ],
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None
  )

  const printer = ts.createPrinter()
  const source = printer.printFile(generatedSourceFile);

  writeFileSync(outFilePath, source);
})();

function getFlags(enumType: any, flags: any) {
  const res = []
  for(const variant of Object.keys(enumType)) {
    if(typeof variant !== 'string') continue;
    if(enumType[variant] & flags) {
      res.push(variant)
    }
  }
  return res
}
