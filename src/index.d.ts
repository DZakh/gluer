export interface Schema {}

export interface Interface {}

export interface GluerOptions {
  validate: ({ schema, value }: { schema: Schema; value: unknown }) => void | Error;
  handleValidationError?: (error: Error) => void;
}

export function makeGluer(gluerOptions: GluerOptions): {
  makeInterface: (
    name: string,
    interfaceMetaLoader?: () => {
      returns?: never;
      args?: Schema[];
    }
  ) => Interface;
  glueImpl: (implInterface: Interface) => <T>(impl: T) => T;
  glueImplFactory: (
    implFactoryName: string,
    implFactoryMetaLoader: () => {
      implements: Interface[];
      args?: Schema[];
    }
  ) => <T>(implFactory: T) => T;
};
