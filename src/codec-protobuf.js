//
// Copyright 2019 DxOS.
//

import assert from 'assert';
import protobuf from 'protobufjs/light';
import merge from 'lodash.merge';

import anySchema from './any';

protobuf.util.Buffer = Buffer || require('buffer');
protobuf.configure();

const { Root } = protobuf;

/**
 * Protobuf encoder/decoder that follows the hypercore codec API (https://github.com/Level/codec).
 *
 * Handles messages that contain nested `google.protobuf.Any` types.
 *
 * ProtobufJS doesn't handle ANY (google.protobuf.Any) types (https://github.com/protobufjs/protobuf.js/issues/435).
 * This is likely since there is no unopinionated way to implement this feature.
 *
 * This module decodes types matching the `type_url` property that are present in the dictionary.
 * In order to provide a natural JSON data structure (i.e., not embed `{ type_url, value  }`) in the JSON object,
 * the type value is set in the `__typeurl` property of the underlying object.
 *
 * NOTE: Internally, protobufjs uses a `@type` property on the non-JSON objects.
 *
 * Example:
 * ```
 * package testing;
 *
 * message Message {
 *   string bucket_id = 1;
 *   repeated google.protobuf.Any payload = 2;
 * }
 *
 * message Meta {
 *   string version = 1;
 * }
 *
 * {
 *   bucketId: 'bucket-1',
 *   payload: [{
 *     __typeurl: 'testing.Meta',
 *     version: '0.0.1'
 *   }]
 * }
 * ```
 */
export class Codec {
  /**
   * JSON Schema.
   * @type {Object}
   */
  _json = {};

  /**
   * Parser.
   * https://github.com/protobufjs/protobuf.js/blob/master/src/root.js
   * @type {Object}
   * @property lookup
   */
  _root = null;

  /**
   * Defines if the Codec has the last JSON schema builded.
   * @type {boolean}
   */
  _builded = false

  /**
   * @param {Object} [options]
   * @param {boolean} options.recursive - Recursively decode the buffer.
   * @param {boolean} options.strict - Throw an exception if the type is not found.
   */
  constructor (options = {}) {
    this._options = { recursive: true, strict: true, ...options };
    this._any = Root.fromJSON(anySchema).lookup('google.protobuf.Any');
  }

  /**
   * Returns a copy of the last JSON schema builded.
   * @return {Object}
   */
  get schema () {
    if (!this._root) {
      return {};
    }

    if (!this._builded) {
      console.warn('Last JSON schema is not builded');
    }

    return this._root.toJSON();
  }

  /**
   * Get a type from the loaded schemas.
   *
   * @param {string} type - Fully qualified type name.
   * @return {Type} The type object or null if not found.
   */
  getType (type) {
    if (!type) {
      console.warn('Missing type.');
      return null;
    }

    if (!this._root) {
      return null;
    }

    try {
      // Lookup throws an error if the type doesn't exist.
      return this._root.lookup(type);
    } catch (err) {
      return null;
    }
  }

  /**
   * Add the given JSON schema to the type dictionary.
   * @param {object} json - Compiled JSON schema.
   * @return {Codec}
   */
  addJson (json) {
    assert(typeof json === 'object');
    this._json = merge(this._json, json);
    this._builded = false;
    return this;
  }

  /**
   * Builds the dictionary from the cumulatively added JSON files.
   * @return {Codec}
   */
  build () {
    this._root = Root.fromJSON(this._json);
    this._builded = true;
    return this;
  }

  /**
   * Encode the value.
   *
   * @param value
   * @return {Buffer}
   */
  encode (value) {
    assert(value.__typeurl);

    return this._any.encode({
      type_url: value.__typeurl,
      value: this.encodeByType(value, value.__typeurl)
    }).finish();
  }

  /**
   * Encode the value.
   *
   * @param {Object} value - JSON object.
   * @param {string} [typeUrl]
   * @return {Buffer}
   */
  encodeByType (value, typeUrl) {
    if (!this._builded) {
      console.warn('Last JSON schema is not builded');
    }

    if (!typeUrl) {
      throw new Error('Missing __typeurl attribute');
    }

    const type = this.getType(typeUrl);
    if (!type) {
      throw new Error(`Unknown type: ${typeUrl}`);
    }

    const object = Object.assign({}, value);

    for (const field in type.fields) {
      const { type: fieldType, repeated } = type.fields[field];

      if (fieldType === 'google.protobuf.Any') {
        // NOTE: Each ANY is separately encoded so that it can be optionally decoded (e.g., if the type is not known).
        if (value[field]) {
          if (repeated) {
            object[field] = value[field].map(value => this._encodeAny(value));
          } else {
            object[field] = this._encodeAny(value[field]);
          }
        }
      }
    }

    return type.encode(object).finish();
  }

  /**
   * Decode the buffer.
   *
   * @param {Buffer} buffer
   * @return {Object}
   */
  decode (buffer) {
    const { type_url: typeUrl, value } = this._any.toObject(this._any.decode(buffer));
    const result = this.decodeByType(value, typeUrl, this._options);
    result.__typeurl = typeUrl;
    return result;
  }

  /**
   * Decode buffer.
   *
   * @param {Buffer} buffer - encoded bytes.
   * @param {string} typeUrl - Type name.
   * @param {Object} [options]
   * @return {Object} JSON object.
   */
  decodeByType (buffer, typeUrl, options = { recursive: true, strict: true }) {
    if (!this._builded) {
      console.warn('Last JSON schema is not builded');
    }

    const type = this.getType(typeUrl);
    if (!type) {
      if (options.strict) {
        throw new Error(`Unknown type: ${typeUrl}`);
      } else {
        return undefined;
      }
    }

    // Decode returns an object (e.g., with @type info); convert to plain JSON object.
    const object = type.toObject(type.decode(buffer));

    return this.decodeObject(object, typeUrl, options);
  }

  /**
   * Decode partially decoded object. Looks for
   *
   * @param {Object} object - JSON object to decode.
   * @param {string} typeUrl
   * @param {Object} [options]
   */
  decodeObject (object, typeUrl, options = { recursive: true, strict: true }) {
    if (!this._builded) {
      console.warn('Last JSON schema is not builded');
    }

    const type = this.getType(typeUrl);
    if (!type) {
      if (options.strict) {
        throw new Error(`Unknown type: ${typeUrl}`);
      } else {
        return object;
      }
    }

    /* eslint guard-for-in: "off" */
    for (const field in type.fields) {
      const { type: fieldType, repeated } = type.fields[field];

      if (fieldType === 'google.protobuf.Any' && options.recursive) {
        if (object[field] !== undefined) {
          if (repeated) {
            object[field] = object[field].map(any => this._decodeAny(any, options));
          } else {
            object[field] = this._decodeAny(object[field], options);
          }
        }
      }
    }

    return object;
  }

  _encodeAny (any) {
    const { __typeurl: typeUrl } = any;

    return {
      type_url: typeUrl,
      value: this.encodeByType(any, typeUrl)
    };
  }

  _decodeAny (any, options) {
    // Test if already decoded.
    if (any.__typeurl) {
      return any;
    }

    // Check known type, otherwise leave decoded ANY object in place.
    const { type_url: typeUrl, value: buffer } = any;
    const type = this.getType(typeUrl);
    if (!type) {
      if (options.strict) {
        throw new Error(`Unknown type: ${typeUrl}`);
      }

      return any;
    }

    // Recursively decode the object.
    const result = this.decodeByType(buffer, typeUrl, options);
    result.__typeurl = typeUrl;
    return result;
  }
}
