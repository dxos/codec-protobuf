import protobufjs from 'protobufjs';
import { Substitutions } from './common';
import { BidirectionalMapingDescriptors, createMappingDescriptors, mapMessage } from './mapping';

export class Schema<T> {
  static fromJson<T extends Record<string, any>>(schema: any, substitutions: Substitutions = {}) {
    const root = protobufjs.Root.fromJSON(schema);
    return new Schema<T>(root, substitutions);
  }

  private readonly _mapping: BidirectionalMapingDescriptors;

  constructor(
    private readonly _typesRoot: protobufjs.Root,
    substitutions: Substitutions,
  ) {
    this._mapping = createMappingDescriptors(substitutions);
  }

  getCodecForType<K extends keyof T & string>(typeName: K): Codec<T[K]> {
    const type = this._typesRoot.lookupType(typeName);
    return new Codec(type, this._mapping);
  }

  tryGetCodecForType(typeName: string): Codec {
    const type = this._typesRoot.lookupType(typeName);
    return new Codec(type, this._mapping);
  }
}

export class Codec<T = any> {
  constructor(
    private readonly _type: protobufjs.Type,
    private readonly _mapping: BidirectionalMapingDescriptors,
  ) {}

  encode(value: T): Uint8Array {
    const sub = mapMessage(this._type, this._mapping.encode, value)
    return this._type.encode(sub).finish()
  }

  decode(data: Uint8Array): T {
    const obj = this._type.toObject(this._type.decode(data))
    return mapMessage(this._type, this._mapping.decode, obj)
  }
}
