import { isAbsolute, resolve, relative } from 'path'
import assert from 'assert'

/**
 * Represents a reference to a module, either as an relative path with the cwd or as a global module specifier.
 */
export class ModuleSpecifier {
  static resolveFromFilePath(path: string, context: string, extension?: string) {
    // Normalize path.
    const relativePath = relative(context, resolve(context, path));
    const pathWithDot = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    const moduleName = extension ? removeExtension(pathWithDot, extension) : pathWithDot;

    return new ModuleSpecifier(moduleName, context)
  }

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

  resolve() {
    return require.resolve(this.name, { paths: [this.contextPath] });
  }
}

export const CODEC_MODULE = new ModuleSpecifier('@dxos/codec-experimental-runtime', __dirname);

function removeExtension(path: string, extension: string) {
  if(path.endsWith(extension)) {
    return path.slice(0, -extension.length);
  } else {
    return path
  }
}
