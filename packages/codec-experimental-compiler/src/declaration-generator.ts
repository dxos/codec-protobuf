import * as protobufjs from 'protobufjs';
import * as ts from 'typescript'
import { SubstitutionsMap } from './substitutions-parser';

const f = ts.factory;

function getFieldType(field: protobufjs.Field, subs: SubstitutionsMap, namespace: DeclarationFullName): ts.TypeNode {
  if(field.repeated) {
    return f.createArrayTypeNode(getScalarType(field, subs, namespace))
  } else if(field.map && field instanceof protobufjs.MapField) {
    return f.createTypeReferenceNode('Partial', [f.createTypeReferenceNode('Record', [
      f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      getScalarType(field, subs, namespace),
    ])]);
  } else {
    return getScalarType(field, subs, namespace)
  }
}

function getScalarType(field: protobufjs.Field, subs: SubstitutionsMap, namespace: DeclarationFullName): ts.TypeNode {
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
      if(!field.resolved) {
        field.resolve()
      }
      if(field.resolvedType && subs[field.resolvedType.fullName.slice(1)]) {
        return f.createTypeReferenceNode(subs[field.resolvedType.fullName.slice(1)]!)
      }
      if(field.resolvedType) {
        const relativeName = getRelativeName(getFullName(field.resolvedType), namespace)
        return f.createTypeReferenceNode(convertNameToIdentifier(relativeName))
      }

      return f.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
  }
}

function createMessageDeclaration(type: protobufjs.Type, subs: SubstitutionsMap) {
  const name = getFullName(type);

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
      getFieldType(field, subs, name)
    )),
  )
}

function createEnumDeclaration(type: protobufjs.Enum) {
  return f.createEnumDeclaration(
    undefined,
    [f.createToken(ts.SyntaxKind.ExportKeyword)],
    type.name,
    Object.entries(type.values).map(([name, id]) => f.createEnumMember(
      name,
      f.createNumericLiteral(id),
    ))
  )
}

export function* createDeclarations(root: protobufjs.NamespaceBase, subs: SubstitutionsMap): Generator<ts.Statement> {
  for (const obj of root.nestedArray) {
    if(obj instanceof protobufjs.Enum) {
      yield createEnumDeclaration(obj);
    } else if(obj instanceof protobufjs.Type) {
      yield createMessageDeclaration(obj, subs);

      const nested = Array.from(createDeclarations(obj, subs));
      if(nested.length > 0) {
        yield f.createModuleDeclaration(
          undefined,
          [f.createToken(ts.SyntaxKind.ExportKeyword)],
          f.createIdentifier(obj.name),
          f.createModuleBlock(nested),
          ts.NodeFlags.Namespace,
        )
      }
    } else if(obj instanceof protobufjs.Namespace) {
      yield* createDeclarations(obj, subs);
    }
  }
}

type DeclarationFullName = string[];

function getFullName(type: protobufjs.ReflectionObject): DeclarationFullName {
  if(type.parent && type.parent instanceof protobufjs.Type) {
    return [...getFullName(type.parent), type.name];
  } else {
    return [type.name]
  }
}

function getRelativeName(target: DeclarationFullName, base: DeclarationFullName): DeclarationFullName {
  // TODO(marik-d): Optimization: Remove recursion
  if (target.length === 1 || base.length === 1) {
    return target;
  } else if (target[0] === base[0]) {
    return getRelativeName(target.slice(1), base.slice(1));
  } else {
    return target;
  }
}

function convertNameToIdentifier(name: DeclarationFullName): ts.QualifiedName | ts.Identifier {
  if(name.length === 1) {
    return f.createIdentifier(name[0])
  } else {
    return f.createQualifiedName(convertNameToIdentifier(name.slice(0, -1)), name[name.length - 1])
  }
}
