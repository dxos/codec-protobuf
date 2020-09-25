import * as pb from 'protobufjs'
import { join } from 'path'
import { splitSchemaIntoNamespaces } from './namespaces';

test('split namespaces', async () => {
  const root = await pb.load(join(__dirname, '../test/schema.proto'));
  const namespaces = splitSchemaIntoNamespaces(root)

  expect(Array.from(namespaces.keys())).toEqual([
    "dxos.test",
    "dxos.test.any",
    "google.protobuf",
  ])
})
