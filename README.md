# Codec Protobuf

> Codec for protobuf to use in libraries that follows the valueEncoding API of leveldb, like hypercore.

[![Build Status](https://travis-ci.com/dxos/codec-protobuf.svg?branch=master)](https://travis-ci.com/dxos/codec-protobuf)
[![Coverage Status](https://coveralls.io/repos/github/dxos/codec-protobuf/badge.svg?branch=master)](https://coveralls.io/github/dxos/codec-protobuf?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/dxos/codec-protobuf.svg)](https://greenkeeper.io/)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

This module use a custom implementation of [protobuf.js](https://github.com/protobufjs/protobuf.js) to support decode `Buffer`s in the browser.

## Install

```
$ npm install @dxos/codec-protobuf
```

## Usage

```protobuf
syntax = "proto3";

message Task {
  string id = 1;
  string title = 2;
}
```

### Using .proto files

```javascript
import protobufjs from 'protobufjs';
import { Codec } from '@dxos/codec-protobuf';

const codec = new Codec('Task');

(async () => {
  // Load from a protobufjs root.
  codec
    .addJson(await protobufjs.load('schema.proto'))
    .build();

  const buffer = codec.encode({ id: 'task-0', title: 'test' });

  codec.decode(buffer); // { id: 'task-0', title: 'test' }
})();
```

### Using JSON descriptors

```javascript
import protobufjs from 'protobufjs';
import { Codec } from '@dxos/codec-protobuf';

const codec = new Codec('Task');

// Load from a JSON compiled proto schema.
codec
  .addJson(require('./schema.json'))
  .build();

const buffer = codec.encode({ id: 'task-0', title: 'test' });

codec.decode(buffer); // { id: 'task-0', title: 'test' }
```

## API

#### `const codec = new Codec(rootTypeUrl, [options])`

Create a new CodecProtobuf instance.

The options are:

- `rootTypeUrl: string`: Defines the root type message to encode/decode messages. Required.
- `options: Object`
  - `recursive: boolean`: Recursively decode the buffer. Default: `true`.
  - `strict: boolean`: Throw an exception if the type is not found. Default: `true`.

#### `codec.addJson(json) -> codec`

Add the given JSON schema to the type dictionary.

- `json: Object`

#### `codec.getType(type) -> (Type|null)`

Get a type from the loaded schemas.

- `type: string`: Fully qualified type name.

#### `codec.encode(data) -> Buffer`

Encode an object using a specific protobuf type.

- `data: Object`

#### `codec.decode(buffer) -> Object`

- `buffer: Buffer`

## Contributing

PRs accepted.

## License

GPL-3.0 © dxos
