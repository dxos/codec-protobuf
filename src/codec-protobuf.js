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
  constructor(options = {}) {
    const { verify = false } = options;

    this._verify = verify;

    this._root = new Root();
  }

  load(root) {
    this._root.addJSON(root.nested);
  }

  loadFromJSON(schema) {
    const root = Root.fromJSON(typeof schema === 'string' ? JSON.parse(schema) : schema);

    this.load(root);
  }

  getType(typeName) {
    const type = this._root.lookupType(typeName);

    if (!type) {
      throw new Error(`CodecProtobuf: Message type ${typeName} not found.`);
    }

    return type;
  }

  encode(obj) {
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

  decode(buffer, withType = true) {
    const obj = this.decodeWithType(buffer);
    if (withType) {
      return obj;
    }

    return obj.message;
  }

  decodeWithType(buffer) {
    const { type: typeName, value } = AnyType.toObject(AnyType.decode(buffer));

    try {
      const type = this._root.lookupType(typeName);
      const message = type.toObject(type.decode(value));

      return { type: typeName, message };
    } catch (err) {
      // TODO(ashwin): Is there is better way to check if a type is supported?
      if (err.message && err.message.startsWith('no such type:')) {
        // Type not known, return raw buffer.
        return { type: typeName, buffer };
      }

      // Some other error, rethrow.
      throw err;
    }
  }
}

module.exports = Codec;
