# Codec Protobuf

> Codec for protobuf for use in libraries that follow the leveldb valueEncoding API (such as hypercore).

[![Build Status](https://travis-ci.com/dxos/codec-protobuf.svg?branch=master)](https://travis-ci.com/dxos/codec-protobuf)
[![Coverage Status](https://coveralls.io/repos/github/dxos/codec-protobuf/badge.svg?branch=master)](https://coveralls.io/github/dxos/codec-protobuf?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/dxos/codec-protobuf.svg)](https://greenkeeper.io/)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme) 

This module uses a custom implementation of [protobuf.js](https://github.com/protobufjs/protobuf.js) to support decoding `Buffer` objects in the browser.

## Install

```
$ npm install @dxos/codec-protobuf
```

// TODO(burdon): This is a great example of how code in READMEs are always out of date.
// Remove all of this and make the actual code docs and tests relevant -- runnable docs.
// Generate static docs from jsdoc if desired.

## Usage

```protobuf
syntax = "proto3";

message Task {
  string id = 1;
  string value = 2;
}
```

### Using .proto files

```javascript
import protobuf from 'protobufjs/light';
import Codec from '@dxos/codec-protobuf';

const codec = new Codec({ verify: true });

(async () => {
  // Load from a protobufjs root.
  const schema = await protobuf.load('schema.proto');

  codec.load(schema);

  const buffer = codec.encode({ type: 'Task', message: { id: 'task-0', value: 'test' } });

  codec.decode(buffer); // { type: 'Task', message: { id: 'task-0', value: 'test' } }
})();
```

### Using JSON descriptors

```javascript
import Codec from '@dxos/codec-protobuf';

const codec = new Codec({ verify: true });

// Load from a JSON compiled proto schema.
codec.loadFromJSON(require('./schema.json'));

const buffer = codec.encode({ type: 'Task', message: { id: 'task-0', value: 'test' } });

codec.decode(buffer); // { type: 'Task', message: { id: 'task-0', value: 'test' } }
```

## API

#### `const codec = new Codec([options])`

Create a new CodecProtobuf instance.

The options are:

- `verify: boolean`: Enable the message validation. Default: `false`.
- `decodeWithType: boolean`: Define if the decode operation should return `{ type, message }` or just `message`. Default: `true`.

#### `codec.load(root) -> codec`

Add a schema from a root Namespace object.

- `root: Namespace`

#### `codec.fromJSON(json) -> codec`

Add a schema from a JSON object or their string representation.

- `json: (Object|string)`

#### `codec.getType(type) -> (Type|null)`

Get a type from the loaded schemas.

- `type: string`

#### `codec.encode(data) -> Buffer`

Encode an object using a specific protobuf type.

- `data: Object`
  - `type: string` Type for the encoding.
  - `message: Any` Message to encode.

#### `codec.decode(buffer, withType) -> Message`

- `buffer: Buffer`
- `withType: boolean` Default: `true`

Message could return `{ type, message }` using `withType` or just the `message`.

## Contributing

PRs accepted.

## License

GPL-3.0 © dxos
