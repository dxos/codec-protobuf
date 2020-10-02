//
// Copyright 2020 DXOS.org
//

import { existsSync } from 'fs';
import { dirname } from 'path';
import pb from 'protobufjs';

export type ProtoResolver = (origin: string, target: string) => string | null;

export function createProtoResolver (original: ProtoResolver): ProtoResolver {
  return function (this: any, origin, target) {
    const clasicResolved = original.call(this, origin, target);
    if (clasicResolved && existsSync(clasicResolved)) {
      return clasicResolved;
    }

    try {
      return require.resolve(target, { paths: [dirname(origin)] });
    } catch {
      return null;
    }
  };
}

const resovler = createProtoResolver(pb.Root.prototype.resolvePath);
export function registerResolver () {
  pb.Root.prototype.resolvePath = resovler;
}
