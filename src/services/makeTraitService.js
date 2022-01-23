import { makeTrait } from '../entities/trait.entity';

export const makeMakeTraitService = () => {
  return {
    makeTrait: ({ name, returns, args }) => {
      // TODO: Validate that the name is uniq
      return makeTrait({
        name,
        returns,
        args,
      });
    },
  };
};
