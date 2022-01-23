export interface Schema {
  unknown;
}

export interface Value {
  unknown;
}

export interface interface {
  unknown;
}

export interface GluerOptions {
  validate: ({ schema, value }: { schema: Schema; value: Value }) => void | Error;
  handleValidationError?: (error: Error) => void;
}

export function makeGluer(gluerOptions: GluerOptions): {
  makeImplInterface: ({
    name,
    returns,
    args,
  }: {
    name: string;
    returns?: never;
    args?: Schema[];
  }) => interface;
  glueImpl: (implInterface: interface) => <T>(impl: T) => T;
  glueImplFactory: ({
    implFactoryName,
    impls,
    args,
  }: {
    implFactoryName: string;
    impls: interface[];
    args?: Schema[];
  }) => <T>(implFactory: T) => T;
};
