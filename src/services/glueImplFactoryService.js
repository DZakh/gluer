export const makeGlueImplFactoryService = ({ glueImplUseCase, validateValuesBySchemasUseCase }) => {
  return {
    glueImplFactory: ({ implFactoryName, implsTraits, args = [] }) => {
      if (!implFactoryName || typeof implFactoryName !== 'string') {
        throw new Error('The "name" option of an implFactory is required and must be a string.');
      }

      if (!(implsTraits && Array.isArray(implsTraits) && implsTraits.length)) {
        throw new Error(
          `The "implsTraits" property of the implFactory "${implFactoryName}" must be an array of interfaces.`
        );
      }

      return (implFactory) => {
        const handler = {
          apply: (target, thisArg, argumentsList) => {
            const argsValidationResult = validateValuesBySchemasUseCase.validateValuesBySchemas({
              schemas: args,
              values: argumentsList,
            });
            if (argsValidationResult instanceof Error) {
              const causeError = argsValidationResult;
              let message = `Failed arguments validation for the implFactory "${implFactoryName}".`;
              const causeErrorMessage = causeError.message;
              if (causeErrorMessage) {
                message = `${message} Cause error: ${causeErrorMessage}`;
              }
              throw new Error(message);
            }

            let impl = Reflect.apply(target, thisArg, argumentsList);
            implsTraits.forEach((trait) => {
              try {
                impl = glueImplUseCase.glueImpl(trait)(impl);
              } catch (error) {
                throw new Error(`The implFactory "${implFactoryName}" failed. ${error.message}`);
              }
            });
            return impl;
          },
        };

        return new Proxy(implFactory, handler);
      };
    },
  };
};
