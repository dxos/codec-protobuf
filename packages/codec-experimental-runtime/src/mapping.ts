import protobufjs from 'protobufjs';
import { Substitutions } from './common';

export type MapingDescriptors = Partial<Record<string, (value: any) => any>>

export interface BidirectionalMapingDescriptors {
  encode: MapingDescriptors,
  decode: MapingDescriptors,
}

export function createMappingDescriptors(substitutions: Substitutions): BidirectionalMapingDescriptors {
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

export function mapMessage(type: protobufjs.Type, substitutions: MapingDescriptors, obj: any) {
  const res: any = {}
  for (const field of type.fieldsArray) {
    res[field.name] = mapField(field, substitutions, obj[field.name]);
  }
  return res
}

export function mapField(field: protobufjs.Field, substitutions: MapingDescriptors, value: any) {
  // TODO: handle map fields
  if(!field.required && (value === null || value === undefined)) {
    return value
  } else if(field.repeated) {
    return value.map((value: any) => mapScalarField(field, substitutions, value))
  } else {
    return mapScalarField(field, substitutions, value)
  }
}

export function mapScalarField(field: protobufjs.Field, substitutions: MapingDescriptors, value: any) {
  if(!field.resolved) {
    field.resolve()
  }
  const substitution = field.resolvedType && substitutions[field.resolvedType.fullName.slice(1)];
  if(substitution) {
    return substitution(value); // TODO: handle recursive substitutions
  } else if(field.resolvedType && field.resolvedType instanceof protobufjs.Type) {
    return mapMessage(field.resolvedType, substitutions, value)
  } else {
    return value
  }
}
