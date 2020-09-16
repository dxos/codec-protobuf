import * as protobufjs from 'protobufjs';
import * as ts from 'typescript'
import { SubstitutionsMap } from './substitutions-parser';

const f = ts.factory;

function getFieldType(field: protobufjs.Field, subs: SubstitutionsMap): ts.TypeNode {
  if(field.repeated) {
    return f.createArrayTypeNode(getScalarType(field, subs))
  } else {
    return getScalarType(field, subs)
  }
}

function getScalarType(field: protobufjs.Field, subs: SubstitutionsMap): ts.TypeNode {
  switch(field.type) {
    case 'double': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'float': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'int32': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'int64': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'uint32': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'uint64': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'sint32': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'sint64': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'fixed32': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'fixed64': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'sfixed32': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'sfixed64': return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'bool': return f.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    case 'string': return f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    case 'bytes': return f.createTypeReferenceNode('Uint8Array');
    default:
      if(subs[field.type]) {
        return f.createTypeReferenceNode(subs[field.type]!)
      }
      if(!field.resolved) {
        field.resolve()
      }
      if(field.resolvedType) {
        return f.createTypeReferenceNode(field.resolvedType.name)
      }

      return f.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
  }
}

export function createDeclarationForType(type: protobufjs.Type, substitutions: SubstitutionsMap) {
  return f.createInterfaceDeclaration(
    undefined,
    [f.createToken(ts.SyntaxKind.ExportKeyword)],
    type.name,
    undefined,
    undefined,
    type.fieldsArray.map(field => f.createPropertySignature(
      undefined,
      field.name,
      field.required ? undefined : f.createToken(ts.SyntaxKind.QuestionToken),
      getFieldType(field, substitutions)
    )),
  )
}
