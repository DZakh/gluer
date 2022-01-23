import {
  checkIsImplFnGlueMetaWithSameTrait,
  getImplFnTraitName,
  makeImplFnGlueMeta,
} from '../entities/implFnGlueMeta.entity';
import {
  checkIsTraitImplemented,
  getTraitArgsSchemas,
  getTraitImplFn,
  getTraitName,
} from '../entities/trait.entity';

export const makeGlueTraitService = ({ validateValuesBySchemasUseCase }) => {
  return {
    glueImpl: (trait) => {
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
            const argsValidationResult = validateValuesBySchemasUseCase.validateValuesBySchemas({
              schemas: getTraitArgsSchemas(trait),
              values: argumentsList,
            });
            if (argsValidationResult instanceof Error) {
              const causeError = argsValidationResult;
              let message = `Failed arguments validation for the trait "${getTraitName(trait)}".`;
              const causeErrorMessage = causeError.message;
              if (causeErrorMessage) {
                message = `${message} Cause error: ${causeErrorMessage}`;
              }
              throw new Error(message);
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
