# Codec Protobuf

> Codec for protobuf to use in libraries that follows the valueEncoding API of leveldb, like hypercore.

## Requirement

CodecProtobuf only works with [protocol-buffers](https://github.com/mafintosh/protocol-buffers) since it's
the only module that allows you to encode/decode type `bytes` to Buffer giving you the benefit of building universal apps working in Node
and the Browser. (Most of the current bundle tooling for the Browser implements Buffer).

## Install

```
$ npm install @dxos/codec-protobuf protocol-buffers
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
import Codec from '@dxos/codec-protobuf';

const codec = new Codec({ verify: true });

(async () => {
  // Load from a protobufjs root.
  const schema = await protobufjs.load('schema.proto')
  codec.load(schema);

  const buffer = codec.encode({ type: 'Task', message: { id: 'task-0', value: 'test' } });

  codec.decode(buffer); // { type: 'Task', message: { id: 'task-0', value: 'test' } }
})();
```

## Contributing

PRs accepted.

## License

GPL-3.0 © dxos
