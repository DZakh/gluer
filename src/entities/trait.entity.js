export const makeTrait = ({ name, returns = undefined, args = [] }) => {
  return {
    name,
    returns,
    args,
  };
};

export const getTraitImplFn = (trait, { impl }) => {
  return impl[trait.name];
};

export const checkIsTraitImplemented = (trait, { impl }) => {
  return getTraitImplFn(trait, { impl }) instanceof Function;
};

export const validateTraitImplArgumentsList = (trait, { argumentsList, validate }) => {
  if (trait.args.length < argumentsList.length) {
    return new Error('Provided more arguments than required for trait.');
  }

  for (let i = 0; i < trait.args.length; i += 1) {
    const traitArgSchema = trait.args[i];
    const arg = argumentsList[i];
    const validationResult = validate({ schema: traitArgSchema, value: arg });
    if (validationResult instanceof Error) {
      return validationResult;
    }
  }
  return undefined;
};

export const makeTraitImplArgumentsListValidationErrorMessage = (trait, { causeError }) => {
  let message = `Failed arguments validation for the trait ${trait.name}.`;

  const causeErrorMessage = (causeError && causeError.message) || '';
  if (causeErrorMessage) {
    message = `${message} Cause error: ${causeErrorMessage}`;
  }

  return message;
};

export const makeTraitNotImplementedErrorMessage = (trait) => {
  return `The trait ${trait.name} is not implemented.`;
};
