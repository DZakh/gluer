import {
  checkIsTraitImplemented,
  getTraitImplFn,
  makeTraitImplArgumentsListValidationErrorMessage,
  makeTraitNotImplementedErrorMessage,
  validateTraitImplArgumentsList,
} from '../entities/trait.entity';

export const makeGlueTraitService = ({ validatePort }) => {
  return {
    glueTrait: (trait) => {
      return (impl) => {
        const traitImplFn = getTraitImplFn(trait, { impl });

        if (!checkIsTraitImplemented(trait, { impl })) {
          throw new Error(makeTraitNotImplementedErrorMessage(trait));
        }

        const handler = {
          apply: (target, thisArg, argumentsList) => {
            const argsValidationResult = validateTraitImplArgumentsList(trait, {
              argumentsList,
              validate: validatePort.validate,
            });
            if (argsValidationResult instanceof Error) {
              throw new Error(
                makeTraitImplArgumentsListValidationErrorMessage(trait, {
                  causeError: argsValidationResult,
                })
              );
            }
            return target.apply(thisArg, argumentsList);
          },
        };
        const proxy = new Proxy(traitImplFn, handler);

        return {
          ...impl,
          [trait.name]: proxy,
        };
      };
    },
  };
};
