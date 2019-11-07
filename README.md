# Codec Protobuf

> Codec for protobuf to use in libraries that follows the valueEncoding API of leveldb, like hypercore.

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

### Using .proto files

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

### Using JSON descriptors

```javascript
import protobuf from 'protocol-buffers';
import Codec from '@dxos/codec-protobuf';

const codec = new Codec({ verify: true });

// Load from a JSON compiled proto schema.
codec.loadFromJSON(require('./schema.json'));

const buffer = codec.encode({ type: 'Task', message: { id: 'task-0', value: 'test' } });

codec.decode(buffer); // { type: 'Task', message: { id: 'task-0', value: 'test' } }
```

## Contributing

PRs accepted.

## License

GPL-3.0 © dxos
