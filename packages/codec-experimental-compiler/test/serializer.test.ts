import { serializer } from './gen/serializer';
import { MyKey } from './my-key';
import { readFileSync } from 'fs'

test('encode and decode', async () => {
  const codec = serializer.getCodecForType('TaskList')

  const initial = {
    tasks: [
      {
        id: 'foo',
        title: 'Bar',
        key: new MyKey(Buffer.from('foo')),
      },
      {
        id: 'baz',
        title: 'Baz',
        key: new MyKey(Buffer.from('foo')),
      }
    ],
  }

  const encoded = codec.encode(initial)
  
  expect(encoded).toBeInstanceOf(Uint8Array);

  const decoded = codec.decode(encoded)

  expect(decoded).toEqual(initial)
})

test('definitions', () => {
  expect(readFileSync(require.resolve('./gen/serializer'), { encoding: 'utf-8' })).toMatchSnapshot()
})
