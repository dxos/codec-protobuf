//
// Copyright 2019 DxOS.
//

import protobuf from 'protobufjs/light';
import merge from 'lodash.merge';

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
 * the type value is set in the `__type_url` property of the underlying object.
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
 *     __type_url: 'testing.Meta',
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
   * @param rootTypeUrl - Root type.
   * @param options
   * @param options.recursive - Recursively decode the buffer.
   * @param options.strict - Throw an exception if the type is not found.
   */
  constructor (rootTypeUrl, options = {}) {
    console.assert(rootTypeUrl);

    this._rootTypeUrl = rootTypeUrl;
    this._options = { recursive: true, strict: true, ...options };
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
    console.assert(type, 'Missing type');
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
    console.assert(typeof json === 'object');
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
    return this.encodeByType(value, this._rootTypeUrl);
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

    if (value.__type_url) {
      value = Object.assign({}, value, { __type_url: undefined });
    }

    const type = this.getType(typeUrl);
    if (!type) {
      throw new Error(`Unknown type: ${typeUrl}`);
    }

    const object = this._iterate(value, value => {
      if (!value.__type_url) {
        return;
      }

      const { __type_url: typeUrl, ...formalValue } = value;

      return {
        type_url: typeUrl,
        value: this.encodeByType(formalValue, typeUrl)
      };
    });

    return type.encode(object).finish();
  }

  /**
   * Decode the buffer.
   *
   * @param {Buffer} buffer
   * @return {Object}
   */
  decode (buffer) {
    return this.decodeByType(buffer, this._rootTypeUrl, this._options);
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
   * @param {Object} value - JSON object to decode.
   * @param {string} typeUrl
   * @param {Object} [options]
   */
  decodeObject (value, typeUrl, options = { recursive: true, strict: true }) {
    if (!this._builded) {
      console.warn('Last JSON schema is not builded');
    }

    const type = this.getType(typeUrl);
    if (!type) {
      if (options.strict) {
        throw new Error(`Unknown type: ${typeUrl}`);
      } else {
        return value;
      }
    }

    const object = this._iterate(value, value => {
      // Test if already decoded.
      if (value.__type_url) {
        return value;
      }

      if (!value.type_url) {
        return;
      }

      // Check known type, otherwise leave decoded ANY object in place.
      const { type_url: typeUrl, value: buffer } = value;
      const type = this.getType(typeUrl);
      if (!type) {
        if (options.strict) {
          throw new Error(`Unknown type: ${typeUrl}`);
        }

        return value;
      }

      // Recursively decode the object.
      return Object.assign(this.decodeByType(buffer, typeUrl, options), {
        __type_url: typeUrl
      });
    });

    return object;
  }

  _iterate (value, callback) {
    if (typeof value !== 'object') return value;

    let tmp;
    let prop;
    const str = Object.prototype.toString.call(value);

    if (str === '[object Object]') {
      const result = callback(value);
      if (result) {
        return result;
      }

      tmp = {};
      for (prop in value) {
        tmp[prop] = this._iterate(value[prop], callback);
      }
      return tmp;
    }

    if (str === '[object Array]') {
      prop = value.length;
      for (tmp = new Array(prop); prop--;) {
        tmp[prop] = this._iterate(value[prop], callback);
      }
      return tmp;
    }

    return value;
  }
}
