import protobufjs from 'protobufjs';
import { Serializer } from './codec';
import substitutions from './substitutions';
import { MyKey } from './my-key';


(async () => {
  const root = await protobufjs.load(require.resolve('./schema.proto'));
  const serializer = new Serializer(root, substitutions);
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
  console.log(initial)

  const encoded = codec.encode(initial)
  console.log(encoded)

  const decoded = codec.decode(encoded)
  console.log(decoded)
})()
