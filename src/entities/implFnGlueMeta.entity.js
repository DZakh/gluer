import { getInterfaceName } from './implInterface.entity';

export const makeImplFnGlueMeta = ({ implInterface }) => {
  return {
    implInterface,
  };
};

export const getImplFnInterfaceName = (implFnGlueMeta) => {
  return getInterfaceName(implFnGlueMeta.implInterface);
};

export const checkIsImplFnGlueMetaWithSameInterface = (implFnGlueMeta, { implInterface }) => {
  return getImplFnInterfaceName(implFnGlueMeta) === getInterfaceName(implInterface);
};
