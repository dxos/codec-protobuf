//
// Copyright 2019 DxOS.
//

import protobufjs from 'protobufjs';

import Codec from './codec-protobuf';

// TODO(burdon): This gets cached.
import schemaOne from './testing/schema-test-one.json';

test('encode/decode message', async () => {
  const testMessage = async (codec, type, message) => {
    const buffer = codec.encode({ type, message });

    expect(Buffer.isBuffer(buffer)).toBe(true);

    const { message: messageDecoded, type: typeDecoded } = codec.decode(buffer);

    expect(typeDecoded).toBe(type);
    expect(messageDecoded).toEqual(message);
    expect(codec.decode(buffer, false)).toEqual(message);
    expect(Buffer.isBuffer(messageDecoded.body)).toBe(true);
  };

  const message = {
    subject: 'hi',
    body: Buffer.from('how are you?')
  };

  const codec = new Codec();

  // Load from JSON.
  codec.loadFromJSON(schemaOne);

  // Load from a protobufjs root.
  codec.load(await protobufjs.load(`${__dirname}/testing/schema-test-two.proto`));

  await testMessage(codec, 'MessageOne', message);
  await testMessage(codec, 'MessageTwo', message);

  expect(() => codec.encode('foo')).toThrow(/invalid object/);
  expect(() => codec.encode({ type: 'foo', message })).toThrow(/no such type/);
  expect(() => codec.decode(Buffer.from('foo'))).toThrow(/invalid wire type/);
});

test('verify', async () => {
  const codec = new Codec({ verify: true })
    .loadFromJSON(schemaOne);

  // Wrong type.
  expect(() => codec.encode({ type: 'MessageOne', message: { subject: 100 } })).toThrow(/subject/);
});
