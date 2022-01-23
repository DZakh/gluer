import { makeImplInterface } from '../entities/implInterface.entity';

export const makeMakeImplInterfaceService = () => {
  return {
    makeImplInterface: ({ name, returns, args }) => {
      if (!name || typeof name !== 'string') {
        throw new Error('The "name" property of an interface is required and must be a string.');
      }

      // TODO: Validate that the name is uniq
      return makeImplInterface({
        name,
        returns,
        args,
      });
    },
  };
};
