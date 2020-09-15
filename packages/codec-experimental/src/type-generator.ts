import protobufjs from 'protobufjs';
import * as ts from 'typescript'
import { writeFileSync } from 'fs'
import { ModuleSpecifier } from './module-specifier';
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
  const fileName = require.resolve('./substitutions.ts')
  const { sourceFile, imports, subs } = parseSubsFile(fileName)
  const root = await protobufjs.load(require.resolve('./schema.proto'));

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

  const outFilePath = join(__dirname, './gen/types.ts')

  const importDeclarations = imports.map(decriptor => ts.factory.createImportDeclaration(
    [],
    [],
    decriptor.clause,
    ts.factory.createStringLiteral(decriptor.module.forContext(dirname(outFilePath))),
  )) 
  const generatedSourceFile = ts.factory.createSourceFile(
    [...importDeclarations, ...declarations],
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
