import {
  checkIsImplFnGlueMetaWithSameTrait,
  getImplFnTraitName,
  makeImplFnGlueMeta,
} from '../entities/implFnGlueMeta.entity';
import {
  checkIsTraitImplemented,
  getTraitImplFn,
  getTraitName,
  makeTraitImplArgumentsListValidationErrorMessage,
  validateTraitImplArgumentsList,
} from '../entities/trait.entity';

export const makeGlueTraitService = ({ validatePort }) => {
  return {
    glueTrait: (trait) => {
      return (impl) => {
        const traitImplFn = getTraitImplFn(trait, { impl });

        if (!checkIsTraitImplemented(trait, { impl })) {
          throw new Error(`The trait "${getTraitName(trait)}" is not implemented.`);
        }

        const maybeImplFnGlueMeta = traitImplFn.glueMeta;
        if (maybeImplFnGlueMeta) {
          const implFnGlueMeta = maybeImplFnGlueMeta;
          if (!checkIsImplFnGlueMetaWithSameTrait(implFnGlueMeta, { trait })) {
            throw new Error(
              `The implFn for the trait "${getTraitName(
                trait
              )}" already implements another trait "${getImplFnTraitName(implFnGlueMeta)}".`
            );
          }
          return impl;
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
            return Reflect.apply(target, thisArg, argumentsList);
          },
          get: (target, prop, receiver) => {
            if (prop === 'glueMeta') {
              return makeImplFnGlueMeta({ trait });
            }
            return Reflect.get(target, prop, receiver);
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
