import protobufjs from 'protobufjs';

import Codec from './codec-protobuf';

import schemaOne from './schema-test-one.json';

test('encode/decode message', async () => {
  const codec = new Codec({ verify: true });

  const testMessage = (type) => {
    const message = { subject: 'hi', body: Buffer.from('how are you?') };

    const buffer = codec.encode({ type, message });

    expect(Buffer.isBuffer(buffer)).toBe(true);

    const { message: messageDecoded, type: typeDecoded } = codec.decode(buffer);

    expect(typeDecoded).toBe(type);
    expect(messageDecoded).toEqual(message);
    expect(Buffer.isBuffer(messageDecoded.body)).toBe(true);
  };

  expect.assertions(8);

  // Load from a protobufjs root.
  codec.load(await protobufjs.load(`${__dirname}/schema-test-two.proto`));

  // Load from JSON.
  codec.loadFromJSON(schemaOne);

  testMessage('MessageOne');
  testMessage('MessageTwo');
});
