import { makeTrait } from '../entities/trait.entity';

export const makeMakeTraitService = () => {
  return {
    makeTrait: ({ name, returns, args }) => {
      return makeTrait({
        name,
        returns,
        args,
      });
    },
  };
};
