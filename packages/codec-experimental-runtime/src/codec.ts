import protobufjs from 'protobufjs';

export interface SubstitutionDescriptor<T> {
  encode: (value: T) => any,
  decode: (value: any) => T,
}

export type Substitutions = Record<string, SubstitutionDescriptor<any>>

type MapingDescriptors = Partial<Record<string, (value: any) => any>>

interface BidirectionalMapingDescriptors {
  encode: MapingDescriptors,
  decode: MapingDescriptors,
}

function createMappingDescriptors(substitutions: Substitutions): BidirectionalMapingDescriptors {
  const encode: MapingDescriptors = {}
  const decode: MapingDescriptors = {}
  for(const type of Object.keys(substitutions)) {
    encode[type] = substitutions[type].encode;
    decode[type] = substitutions[type].decode;
  }
  return {
    encode,
    decode
  }
}

function mapMessage(type: protobufjs.Type, substitutions: MapingDescriptors, obj: any) {
  const res: any = {}
  for (const field of type.fieldsArray) {
    res[field.name] = mapField(field, substitutions, obj[field.name]);
  }
  return res
}

function mapField(field: protobufjs.Field, substitutions: MapingDescriptors, value: any) {
  // TODO: handle map fields
  if(!field.required && (value === null || value === undefined)) {
    return value
  } else if(field.repeated) {
    return value.map((value: any) => mapScalarField(field, substitutions, value))
  } else {
    return mapScalarField(field, substitutions, value)
  }
}

function mapScalarField(field: protobufjs.Field, substitutions: MapingDescriptors, value: any) {
  if(!field.resolved) {
    field.resolve()
  }
  const substitution = substitutions[field.type];
  if(substitution) {
    return substitution(value); // TODO: handle recursive substitutions
  } else if(field.resolvedType && field.resolvedType instanceof protobufjs.Type) {
    return mapMessage(field.resolvedType, substitutions, value)
  } else {
    return value
  }
}

export class Serializer {
  static fromJsonSchema(schema: any, substitutions: Substitutions) {
    const root = protobufjs.Root.fromJSON(schema);
    return new Serializer(root, substitutions);
  }

  private readonly _mapping: BidirectionalMapingDescriptors;

  constructor(
    private readonly _typesRoot: protobufjs.Root,
    substitutions: Substitutions,
  ) {
    this._mapping = createMappingDescriptors(substitutions);
  }

  getCodecForType(typeName: string) {
    const type = this._typesRoot.lookupType(typeName);
    return new Codec(type, this._mapping);
  }
}

export class Codec {
  constructor(
    private readonly _type: protobufjs.Type,
    private readonly _mapping: BidirectionalMapingDescriptors,
  ) {}

  encode(value: any): Uint8Array {
    const sub = mapMessage(this._type, this._mapping.encode, value)
    return this._type.encode(sub).finish()
  }

  decode(data: Uint8Array): any {
    const obj = this._type.toObject(this._type.decode(data))
    return mapMessage(this._type, this._mapping.decode, obj)
  }
}
