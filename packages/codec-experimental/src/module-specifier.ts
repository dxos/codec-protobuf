import { isAbsolute } from 'path'
import assert from 'assert'

export class ModuleSpecifier {
  constructor(
    public readonly name: string,
    public readonly contextPath: string,
  ) {
    assert(isAbsolute(contextPath))
  }
}
