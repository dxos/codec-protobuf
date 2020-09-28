import * as ts from 'typescript'
import { dirname } from 'path'
import assert from 'assert'
import { ModuleSpecifier } from './module-specifier';

export interface ImportDescriptor {
  clause: ts.ImportClause,
  module: ModuleSpecifier,
}

/**
 * Protobuf FQN => Typescript identifier mapping
 */
export type SubstitutionsMap = Partial<Record<string, string>>

export function parseSubstitutionsFile(fileName: string) {
  const program = ts.createProgram([fileName], {})
  const sourceFile = program.getSourceFile(fileName)!;
  const typeChecker = program.getTypeChecker();

  const imports: ImportDescriptor[] = []
  const substitutions: SubstitutionsMap = {}
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
        const returnTypeSymbol = typeChecker.getReturnTypeOfSignature(callsignature).getSymbol();
        assert(returnTypeSymbol)
        substitutions[key] = returnTypeSymbol.name
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

  return { imports, substitutions }
}
