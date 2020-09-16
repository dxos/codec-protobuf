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
    case 'string': return f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
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
