import { getTraitName } from './trait.entity';

export const makeImplFnGlueMeta = ({ trait }) => {
  return {
    trait,
  };
};

export const getImplFnTraitName = (implFnGlueMeta) => {
  return getTraitName(implFnGlueMeta.trait);
};

export const checkIsImplFnGlueMetaWithSameTrait = (implFnGlueMeta, { trait }) => {
  return getImplFnTraitName(implFnGlueMeta) === getTraitName(trait);
};
