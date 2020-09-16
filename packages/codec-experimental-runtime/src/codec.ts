import protobufjs from 'protobufjs';
import { Substitutions } from './common';
import { BidirectionalMapingDescriptors, createMappingDescriptors, mapMessage } from './mapping';

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
