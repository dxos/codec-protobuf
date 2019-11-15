//
// Copyright 2019 DxOS.
//

import protobuf from 'protobufjs/light';

import schema from './schema.json';

protobuf.util.Buffer = Buffer;
protobuf.configure();

const { Root } = protobuf;

const AnyType = Root.fromJSON(JSON.parse(schema)).lookupType('dxos.codec.AnyType');

/**
 * Encodes and decodes protocol buffer messages.
 */
class Codec {
  constructor (options = {}) {
    const { verify = false, decodeWithType = true } = options;

    this._verify = verify;
    this._decodeWithType = decodeWithType;

    this._root = new Root();
  }

  // TODO(burdon): Parse.
  load (root) {
    this._root.addJSON(root.nested);
    return this;
  }

  // TODO(burdon): load (different verb).
  loadFromJSON (schema) {
    const root = Root.fromJSON(typeof schema === 'string' ? JSON.parse(schema) : schema);
    this.load(root);
    return this;
  }

  // TODO(burdon): get operator?
  getType (typeName) {
    return this._root.lookupType(typeName);
  }

  encode (obj) {
    if (typeof obj !== 'object' || obj.type === undefined || obj.message === undefined) {
      throw new Error('invalid object');
    }

    const { type: typeName, message } = obj;

    const type = this.getType(typeName);

    if (this._verify) {
      const err = type.verify(message);

      if (err) {
        throw new Error(`invalid object [${err}]`);
      }
    }

    const value = type.encode(message).finish();
    return AnyType.encode({ type: typeName, value }).finish();
  }

  // TODO(burdon): Why withType? Just have a different message (shouldn't be part of API).
  decode (buffer, withType = this._decodeWithType) {
    const obj = this._decode(buffer);

    if (withType === true) {
      return obj;
    }

    return obj.message;
  }

  _decode (buffer) {
    const { type: typeName, value } = AnyType.toObject(AnyType.decode(buffer));

    const type = this._root.lookupType(typeName);
    const message = type.toObject(type.decode(value));

    return { type: typeName, message };
  }
}

module.exports = Codec;
