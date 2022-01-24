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
  glueImplFactory: (
    implFactoryName: string,
    implements: Interface[],
    depends?: Record<string, Interface>
  ) => <T>(implFactory: T) => T;
};
