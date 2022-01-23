export const makeTrait = ({ name, returns = undefined, args = [] }) => {
  return {
    name,
    returns,
    args,
  };
};

export const getTraitName = (trait) => {
  return trait.name;
};

export const getTraitArgsSchemas = (trait) => {
  return trait.args;
};

export const getTraitImplFn = (trait, { impl }) => {
  return impl[getTraitName(trait)];
};

export const checkIsTraitImplemented = (trait, { impl }) => {
  return getTraitImplFn(trait, { impl }) instanceof Function;
};
