import { serializer } from './gen/serializer';
import { MyKey } from './my-key';

test('codec', async () => {
  const codec = serializer.getCodecForType('TaskList')

  const initial = {
    tasks: [
      {
        id: 'foo',
        title: 'Bar',
        key: new MyKey('key'),
      },
      {
        id: 'baz',
        title: 'Baz',
        key: new MyKey('key2'),
      }
    ],
  }

  const encoded = codec.encode(initial)
  
  expect(encoded).toBeInstanceOf(Uint8Array);

  const decoded = codec.decode(encoded)

  expect(decoded).toEqual(initial)
})
