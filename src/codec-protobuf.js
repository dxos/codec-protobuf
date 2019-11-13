//
// Copyright 2019 Wireline, Inc.
//

import protobuf from 'protobufjs/light';

import schema from './schema.json';

protobuf.util.Buffer = Buffer;
protobuf.configure();

const { Root } = protobuf;

const AnyType = Root.fromJSON(JSON.parse(schema)).lookupType('codecprotobuf.AnyType');

class Codec {
  constructor (options = {}) {
    const { verify = false, decodeWithType = true } = options;

    this._verify = verify;
    this._decodeWithType = decodeWithType;

    this._root = new Root();
  }

  load (root) {
    this._root.addJSON(root.nested);
    return this;
  }

  loadFromJSON (schema) {
    const root = Root.fromJSON(typeof schema === 'string' ? JSON.parse(schema) : schema);
    this.load(root);
    return this;
  }

  getType (typeName) {
    return this._root.lookupType(typeName);
  }

  encode (obj) {
    if (typeof obj !== 'object' || obj.type === undefined || obj.message === undefined) {
      throw new Error('CodecProtobuf: The encode message needs to be an object { type, message }.');
    }

    const { type: typeName, message } = obj;

    const type = this.getType(typeName);

    if (this._verify) {
      const err = type.verify(message);

      if (err) {
        throw new Error(`CodecProtobuf: Verify error by ${err}`);
      }
    }

    const value = type.encode(message).finish();
    return AnyType.encode({ type: typeName, value }).finish();
  }

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
