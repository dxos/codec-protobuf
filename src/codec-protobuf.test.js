//
// Copyright 2019 DxOS.
//

import { Codec } from './codec-protobuf';

const rootTypeUrl = 'testing.Container';

const codec = new Codec(rootTypeUrl)
  .addJson(require('./testing/types.json'))
  .addJson(require('./testing/messages.json'))
  .build();

test('encode/decode', () => {
  const message = {
    id: 'id1',
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

test('types', () => {
  const type = codec.getType('testing.AnyString');
  expect(type).not.toBeNull();
});
