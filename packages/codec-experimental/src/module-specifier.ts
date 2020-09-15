import { isAbsolute, resolve, relative } from 'path'
import assert from 'assert'

/**
 * Represents a reference to a module, either as an relative path with the cwd or as a global module specifier.
 */
export class ModuleSpecifier {
  constructor(
    public readonly name: string,
    public readonly contextPath: string,
  ) {
    assert(isAbsolute(contextPath))
  }

  isAbsolute() {
    return !this.name.startsWith('.');
  }

  forContext(newContextPath: string) {
    if(this.isAbsolute()) {
      return this.name;
    } else {
      return relative(newContextPath, resolve(this.contextPath, this.name));
    }
  }
}
