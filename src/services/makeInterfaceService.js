import { makeImplInterface } from '../entities/implInterface.entity';

export const makeMakeInterfaceService = () => {
  return {
    makeInterface: (name, interfaceMetaLoader) => {
      if (!name || typeof name !== 'string') {
        throw new Error('The "name" property of an interface is required and must be a string.');
      }

      const { returns, args } =
        interfaceMetaLoader instanceof Function ? interfaceMetaLoader() : {};

      // TODO: Validate that the name is uniq
      return makeImplInterface({
        name,
        returns,
        args,
      });
    },
  };
};
