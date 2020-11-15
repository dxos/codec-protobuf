# Protobuf codec

This repo contains two packages:
* `@dxos/codec-protobuf` - a runtime library that allows encoding and decoding of protobuf messages.
* `@dxos/protobuf-compiler` - a CLI tool to compiler protobuf definitions, generate typescript interfaces, and export codec instances.

## Installation

```
yarn add @dxos/codec-protobuf
yarn add -D @dxos/protobuf-compiler

```

## Usage

To compile protobuf definitions use the following command. `gen` folder will export the compiled codec and contain generated typescript interfaces.

```
build-protobuf src/proto/defs/schema.proto -o src/proto/gen
```

To use the just import schema from `gen`, it will allow you to get a codec for a specific type:

```typescript
import { schema } from './proto/gen';

const codec = schema.getCodecForType('my.message.Type');

const data = codec.encode(myMessage);

const decodedMessage = codec.decode(data);

expect(decodedMessage).toEqual(myMessage);
```

In this cases your source files will depend on generated code, so it's a good idea to put protobuf compilation before your main build step:


```json
{
  "scripts": {
    "build": "yarn build:protobuf && tsc --build",
    "build:protobuf": "mkdir -p src/proto/gen && build-protobuf src/proto/defs/schema.proto -o src/proto/gen",
  }
}
```

## Substitutions

Codec allows associating any custom runtime type with a protobuf definition. In this cases codec will automatically convert between raw decoded data and your custom type in an extra serialization step.

To use use substitutions create a new file that will act as an association table:


```typescript
// src/proto/substitutions.ts

import { MyKey } from '../my-key.ts';

export default {
  'dxos.test.Key': {
    encode: (value: MyKey) => ({ data: value.keyData }),
    decode: (value: any) => new MyKey(value.data),
  },
};
```

Pass a path to this file to the CLI tool like so:

```
build-protobuf src/proto/defs/schema.proto -o src/proto/gen -s src/proto/substitutions.ts
```

Now all occurrences of `dxos.test.Key` will automatically be converted to an instance of `MyKey`, generated type definitions will also be updated.

Look in `packages/protobuf-compiler/test` for more examples.
