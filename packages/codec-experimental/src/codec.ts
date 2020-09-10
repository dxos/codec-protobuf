import protobufjs from 'protobufjs';

export interface SubstitutionDescriptor<T> {
  encode: (value: T) => any,
  decode: (value: any) => T,
}

export type Substitutions = Record<string, SubstitutionDescriptor<any>>

function mapMessage(type: protobufjs.Type, substitutions: Record<string, (value: any) => any>, obj: any) {
  const res: any = {}
  for (const field of type.fieldsArray) {
    res[field.name] = mapField(field, substitutions, obj[field.name]);
  }
  return res
}

function mapField(field: protobufjs.Field, substitutions: Record<string, (value: any) => any>, value: any) {
  // TODO: handle map fields
  if(!field.required && (value === null || value === undefined)) {
    return value
  } else if(field.repeated) {
    return value.map((value: any) => mapScalarField(field, substitutions, value))
  } else {
    return mapScalarField(field, substitutions, value)
  }
}

function mapScalarField(field: protobufjs.Field, substitutions: Record<string, (value: any) => any>, value: any) {
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

export class SubstitutingCodec {
  _encodeSubstitutions: Record<string, (value: any) => any>;
  _decodeSubstitutions: Record<string, (value: any) => any>;

  constructor(
    private readonly _type: protobufjs.Type,
    _substitutions: Substitutions,
  ) {
    this._encodeSubstitutions = {}
    this._decodeSubstitutions = {}
    for(const type of Object.keys(_substitutions)) {
      this._encodeSubstitutions[type] = _substitutions[type].encode;
      this._decodeSubstitutions[type] = _substitutions[type].decode;
    }
  }

  encode(value: any): Uint8Array {
    const sub = mapMessage(this._type, this._encodeSubstitutions, value)
    return this._type.encode(sub).finish()
  }

  decode(data: Uint8Array): any {
    const obj = this._type.toObject(this._type.decode(data))
    return mapMessage(this._type, this._decodeSubstitutions, obj)
  }
}
