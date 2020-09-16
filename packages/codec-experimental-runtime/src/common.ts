export interface SubstitutionDescriptor<T> {
  encode: (value: T) => any,
  decode: (value: any) => T,
}

export type Substitutions = Record<string, SubstitutionDescriptor<any>>