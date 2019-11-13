//
// Copyright 2019 DxOS.
//

import protobufjs from 'protobufjs';

import Codec from './codec-protobuf';

import schemaOne from './schema-test-one.json';

test('encode/decode message', async () => {
  let codec = new Codec();

  const message = { subject: 'hi', body: Buffer.from('how are you?') };

  const testMessage = async (type) => {
    const buffer = codec.encode({ type, message });

    expect(Buffer.isBuffer(buffer)).toBe(true);

    const { message: messageDecoded, type: typeDecoded } = codec.decode(buffer);

    expect(typeDecoded).toBe(type);
    expect(messageDecoded).toEqual(message);
    expect(codec.decode(buffer, false)).toEqual(message);
    expect(Buffer.isBuffer(messageDecoded.body)).toBe(true);
  };

  expect.assertions(15);

  // Load from a protobufjs root.
  codec.load(await protobufjs.load(`${__dirname}/schema-test-two.proto`));

  // Load from JSON.
  codec.loadFromJSON(schemaOne);

  await testMessage('MessageOne');
  await testMessage('MessageTwo');

  expect(() => codec.encode('foo')).toThrow(/needs to be an object/);
  expect(() => codec.encode({ type: 'foo', message })).toThrow(/no such type/);
  expect(() => codec.decode(Buffer.from('foo'))).toThrow(/invalid wire type/);

  codec = new Codec({ verify: true });
  codec.loadFromJSON(schemaOne);
  expect(() => codec.encode({ type: 'MessageOne', message: { foo: 'not valid' } })).toThrow(/Verify error/);

  codec = new Codec({ decodeWithType: false });
  codec.loadFromJSON(JSON.parse(schemaOne));
  expect(codec.decode(codec.encode({ type: 'MessageOne', message }))).toEqual(message);
});
