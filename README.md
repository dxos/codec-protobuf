# Wireline Codec Protobuf

[![CircleCI](https://circleci.com/gh/wirelineio/wireline-core.svg?style=svg&circle-token=93ede761391f88aa9fffd7fd9e6fe3b552e9cf9d)](https://circleci.com/gh/wirelineio/wireline-core)
[![npm version](https://badge.fury.io/js/%40wirelineio%2Fcodec-protobuf.svg)](https://badge.fury.io/js/%40wirelineio%2Fcodec-protobuf)

> Codec for protobuf to use in libraries that follows the valueEncoding API of leveldb, like hypercore.

## Requirement

CodecProtobuf only works with [protocol-buffers](https://github.com/mafintosh/protocol-buffers) since it's
the only module that allows you to encode/decode type `bytes` to Buffer giving you the benefit of building universal apps working in Node
and the Browser. (Most of the current bundle tooling for the Browser implements Buffer).

## Install

```
$ npm install @wirelineio/codec-protobuf protocol-buffers
```

## Usage

```protobuf
syntax = "proto3";

message Task {
  required string id = 1;
  string value = 2;
}
```

```javascript
import protobuf from 'protocol-buffers';
import hypercore from 'hypercore';
import codecProtobuf from '@wirelineio/codec-protobuf';

const root = protobuf(fs.readFileSync('schema.proto'))

const codec = codecProtobuf(root);

const obj = { type: 'Task', message: { id: 'task-0', value: 'test' } };

const buffer = codec.encode(obj);

codec.decode(buffer); // { type: 'Task', message: { id: 'task-0', value: 'test' } }

// It's compatible with the valueEncoding option of hypercore
const feed = hypercore('./log', { valueEncoding: codec });

feed.append(obj, () => {
  feed.head(console.log) // { type: 'Task', message: { id: 'task-0', value: 'test' } }
});
```
