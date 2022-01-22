import {
  checkAreAllTraitsImplemented,
  getTraitImplFn,
  makeTraitImplArgumentsListValidationErrorMessage,
  validateTraitImplArgumentsList,
} from '../entities/trait.entity';

export const makeGlueImplFactoryService = ({ validatePort }) => {
  const makeImplFactoryWrapper = ({ implFactoryName, implementsTraits }) => {
    return (implFactory) => {
      if (process.env.NODE_ENV === 'production') {
        return implFactory;
      }

      return (...args) => {
        let impl = implFactory(...args);

        if (checkAreAllTraitsImplemented({ traits: implementsTraits, impl })) {
          throw new Error(
            `The implementation of the ${implFactoryName} implFactory doesn't implement all the traits.`
          );
        }

        implementsTraits.forEach((trait) => {
          const traitImplFn = getTraitImplFn(trait, { impl });

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

          impl = {
            ...impl,
            [trait.name]: proxy,
          };
        });

        return impl;
      };
    };
  };

  return {
    glueImplFactory: ({ name: implFactoryName, implementsTraits }) => {
      if (process.env.NODE_ENV !== 'production') {
        if (process.env.NODE_ENV !== 'production') {
          if (!implFactoryName || typeof implFactoryName !== 'string') {
            throw new Error(
              'The "name" property of an implFactory is required and must be a string.'
            );
          }
        }
        if (!(implementsTraits && Array.isArray(implementsTraits) && implementsTraits.length)) {
          throw new Error(
            `The "implementsTraits" property of the ${implFactoryName} implFactory must be an array of interfaces.`
          );
        }
      }

      return makeImplFactoryWrapper({
        implFactoryName,
        implementsTraits,
      });
    },
  };
};
