//
// Copyright 2020 Wireline, Inc.
//

/**
 * Constructs a well-formed JSON object representing an unencoded (raw) google.protobuf.Any message.
 * @param {string} type
 * @param {Object} object
 * @return {Object}
 */
export function any (type, object) {
  return {
    __type_url: type,
    ...object
  };
}
