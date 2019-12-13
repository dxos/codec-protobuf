//
// Copyright 2019 DxOS.
//

import { JSONPath } from 'jsonpath-plus';

import { Codec } from './codec-protobuf';

const rootTypeUrl = 'testing.Message';

const codec = new Codec(rootTypeUrl)
  .addJson(require('./testing/messages.json'))
  .addJson(require('./testing/types.json'))
  .build();

const messages = [

  {
    bucketId: 'bucket-1'
  },

  {
    bucketId: 'bucket-1',
    payload: [
      {
        __type_url: 'testing.Meta',
        version: '0.0.1'
      }
    ]
  },

  {
    bucketId: 'bucket-1',
    payload: [
      {
        __type_url: 'testing.Meta',
        version: '0.0.1'
      },
      {
        __type_url: 'testing.Data',
        value: {
          boolValue: true
        }
      }
    ]
  },

  {
    bucketId: 'bucket-1',
    payload: [
      {
        // Nested.
        __type_url: 'testing.Container',
        tags: ['system'],
        data: [
          {
            __type_url: 'testing.Meta',
            version: '0.0.1'
          }
        ]
      }
    ]
  },

  {
    bucketId: 'bucket-1',
    payload: [
      {
        // Nested.
        __type_url: 'testing.Container',
        tags: ['system'],
        data: [
          {
            __type_url: 'testing.Meta',
            version: '0.0.1'
          }
        ]
      },
      {
        __type_url: 'testing.Meta',
        version: '0.0.1'
      },
      {
        __type_url: 'testing.Data',
        value: {
          boolValue: true
        }
      }
    ]
  }
];

test('types', () => {
  const type = codec.getType('testing.Message');
  expect(type).not.toBeNull();
});

test('encoding/decoding (basic)', () => {
  const test = (message) => {
    const buffer = codec.encode(message);
    const received = codec.decode(buffer);
    expect(received).toEqual(message);
  };

  messages.forEach(message => test(message));
});

test('encoding/decoding (ANY)', () => {
  const test = (message) => {
    const buffer = codec.encode(message);
    const received = codec.decode(buffer);
    expect(received).toEqual(message);
  };

  messages.forEach(message => test(message));
});

test('encoding/decoding (nested)', () => {
  const test = (message) => {
    const buffer = codec.encode(message);
    const received = codec.decode(buffer);
    expect(received).toEqual(message);
  };

  messages.forEach(message => test(message));
});

test('encoding/decoding (non-recursive)', () => {
  const test = (message) => {
    const buffer = codec.encode(message);

    // Partially decode buffer.
    const received = codec.decodeByType(buffer, 'testing.Message', { recursive: false });
    expect(received.bucketId).toEqual('bucket-1');

    received.payload.forEach(({ type_url: typeUrl, value }) => {
      expect(typeUrl).not.toBeNull();
      expect(value).not.toBeNull();
    });

    // Fully decode remaining.
    codec.decodeObject(received, 'testing.Message');
    expect(received).toEqual(message);
  };

  const filter = '$..payload';
  messages.filter(message => JSONPath({ path: filter, json: message }).length).forEach((message) => {
    test(message);
  });
});

test('encoding/decoding (missing type)', () => {
  const test = (message) => {
    const buffer = codec.encode(message);

    // Partially decode with missing type defs.
    const { schema } = codec;
    delete schema.nested.testing.nested.Data;
    const partialCodec = new Codec(rootTypeUrl).addJson(schema).build();

    const received = partialCodec.decodeByType(buffer, 'testing.Message', { recursive: true, strict: false });
    expect(received).not.toEqual(message);

    // Fully decode remaining.
    codec.decodeObject(received, 'testing.Message');
    expect(received).toEqual(message);
  };

  const filter = '$..*[?(@property === "__type_url" && @ === "testing.Data")]';
  messages
    .filter(message => JSONPath({ path: filter, json: message }).length)
    .forEach((message) => {
      test(message);
    });
});
