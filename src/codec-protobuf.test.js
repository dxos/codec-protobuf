//
// Copyright 2019 DxOS.
//

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
        }
      }
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
        }
      }
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
    }]
  };

  const buff = codec.encode(message);
  expect(codec.decode(buff)).toEqual(message);
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

  const buff = codec.encode(message);

  const codec2 = new Codec(rootTypeUrl)
    .addJson(require('./testing/types.json'))
    .build();
  expect(() => codec2.decode(buff)).toThrow(/Unknown type/);

  const codec3 = new Codec(rootTypeUrl, { strict: false })
    .addJson(require('./testing/types.json'))
    .build();
  expect(codec3.decode(buff).data.value).toBeInstanceOf(Buffer);
});

test('ignore unknown props', () => {
  const message = {
    data: {
      __type_url: 'testing.AnyNumber',
      value: 1
    },
    unknownType: new Map()
  };

  expect(codec.encode(message)).toBeInstanceOf(Buffer);
});
