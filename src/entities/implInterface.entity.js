export const makeImplInterface = ({ name, returns = undefined, args = [] }) => {
  return {
    name,
    returns,
    args,
  };
};

export const getInterfaceName = (implInterface) => {
  return implInterface.name;
};

export const getInterfaceArgSchemas = (implInterface) => {
  return implInterface.args;
};

export const getInterfaceImplFn = (implInterface, { impl }) => {
  return impl[getInterfaceName(implInterface)];
};

export const checkIsInterfaceImplemented = (implInterface, { impl }) => {
  return getInterfaceImplFn(implInterface, { impl }) instanceof Function;
};
