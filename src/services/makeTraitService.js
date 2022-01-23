import { makeTrait } from '../entities/trait.entity';

export const makeMakeTraitService = () => {
  return {
    makeTrait: ({ name, returns, args }) => {
      if (!name || typeof name !== 'string') {
        throw new Error('The "name" property of a trait is required and must be a string.');
      }

      // TODO: Validate that the name is uniq
      return makeTrait({
        name,
        returns,
        args,
      });
    },
  };
};
