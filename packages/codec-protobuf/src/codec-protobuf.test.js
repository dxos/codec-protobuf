//
// Copyright 2019 DxOS.
//

// TODO(burdon): Test arrays.
// TODO(burdon): Only ANY types should have __type_url

import { Codec } from './codec-protobuf';

const rootTypeUrl = 'testing.Container';

const codec = new Codec(rootTypeUrl)
  .addJson(require('./testing/types.json'))
  .addJson(require('./testing/messages.json'))
  .build();

test('types', () => {
  const type = codec.getType('testing.AnyString');
  expect(type).not.toBeNull();
});

test('encode/decode', () => {
  const message = {
    bucketId: 'id1',
    data: {
      __type_url: 'testing.CustomType',
      value: 'value1',
      data: {
        __type_url: 'testing.CustomType',
        data: {
          __type_url: 'testing.AnyNumber',
          value: 1
        },
        dataBytes: Buffer.from('value1'),
        repeatedDataBytes: [Buffer.from('value1'), Buffer.from('value2')]
      },
      dataBytes: Buffer.from('value1'),
      repeatedDataBytes: [Buffer.from('value1'), Buffer.from('value2')]
    },
    repeatedData: [{
      __type_url: 'testing.AnyNumber',
      value: 1
    }, {
      __type_url: 'testing.AnyString',
      value: 'value1'
    }, {
      __type_url: 'testing.AnyData',
      value: {
        __type_url: 'testing.AnyData',
        value: {
          __type_url: 'testing.AnyNumber',
          value: 1
        }
      }
    }],
    customType: {
      value: 'value1',
      data: {
        __type_url: 'testing.CustomType',
        data: {
          __type_url: 'testing.AnyNumber',
          value: 1
        },
        dataBytes: Buffer.from('value1'),
        repeatedDataBytes: [Buffer.from('value1'), Buffer.from('value2')]
      },
      dataBytes: Buffer.from('value1'),
      repeatedDataBytes: [Buffer.from('value1'), Buffer.from('value2')]
    },
    repeatedCustomType: [{
      value: 'value1',
      data: {
        __type_url: 'testing.CustomType',
        data: {
          __type_url: 'testing.AnyNumber',
          value: 1
        }
      }
    }, {
      value: 'value2'
    }],
    dataBytes: Buffer.from('value1'),
    repeatedDataBytes: [Buffer.from('value1'), Buffer.from('value2')]
  };

  const buffer = codec.encode(message);
  expect(codec.decode(buffer)).toEqual(message);
});

test('encode error if type not found', () => {
  const message = {
    data: {
      __type_url: 'NotFound',
      value: 'value1'
    }
  };

  expect(() => codec.encode(message)).toThrow(/Unknown type/);
});

test('decode using strict = true|false', () => {
  const message = {
    data: {
      __type_url: 'testing.AnyNumber',
      value: 1
    }
  };

  const buffer = codec.encode(message);
  const codec2 = new Codec(rootTypeUrl)
    .addJson(require('./testing/types.json'))
    .build();
  expect(() => codec2.decode(buffer)).toThrow(/Unknown type/);

  const codec3 = new Codec(rootTypeUrl, { strict: false })
    .addJson(require('./testing/types.json'))
    .build();
  expect(codec3.decode(buffer).data.value).toBeInstanceOf(Buffer);
});

test('ignore unknown props', () => {
  const message = {
    data: {
      __type_url: 'testing.AnyNumber',
      value: 1
    },
    customType: {
      value: 'value1',
      unknownType: {
        unknownType: new Map()
      }
    },
    unknownType: new Map()
  };

  const buffer = codec.encode(message);
  expect(buffer).toBeInstanceOf(Buffer);
  expect(codec.decode(buffer)).toEqual({
    data: {
      __type_url: 'testing.AnyNumber',
      value: 1
    },
    customType: {
      value: 'value1'
    }
  });
});

test('should ignore the type_url in a non Any type message', () => {
  const message = {
    customType: {
      __type_url: 'testing.CustomType',
      value: 'value1'
    }
  };

  expect(codec.decode(codec.encode(message))).toEqual({
    customType: {
      value: 'value1'
    }
  });
});

test('should ignore the __type_url prop in the root object', () => {
  const message = {
    bucketId: 'id1',
    __type_url: 'wrong'
  };

  expect(codec.decode(codec.encode(message))).toEqual({ bucketId: 'id1' });
});

test('oneof', () => {
  const message = {
    oneofmessage: {
      two: {
        value: {
          __type_url: 'testing.AnyNumber',
          value: 1
        }
      }
    }
  };
  expect(codec.decode(codec.encode(message))).toEqual(message);

  delete message.oneofmessage.two;
  message.oneofmessage.one = { value: 'test' };

  expect(codec.decode(codec.encode(message))).toEqual(message);
});
