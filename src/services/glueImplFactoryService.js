export const makeGlueImplFactoryService = ({
  glueImplUseCase,
  validateValuesBySchemasUseCase,
  handleValidationErrorPort,
}) => {
  return {
    glueImplFactory: (implFactoryName, implFactoryMetaLoader) => {
      if (!implFactoryName || typeof implFactoryName !== 'string') {
        throw new Error('The "name" option of an implFactory is required and must be a string.');
      }

      if (!(implFactoryMetaLoader instanceof Function)) {
        throw new Error(
          `The "implements" option of the implFactory "${implFactoryName}" must be an array of interfaces.`
        );
      }

      const { implements: impls, args = [] } = implFactoryMetaLoader();

      if (!(impls && Array.isArray(impls) && impls.length)) {
        throw new Error(
          `The "implements" option of the implFactory "${implFactoryName}" must be an array of interfaces.`
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
              handleValidationErrorPort.handleValidationError(new Error(message));
            }

            const impl = Reflect.apply(target, thisArg, argumentsList);
            impls.forEach((implInterface) => {
              try {
                glueImplUseCase.glueImpl(implInterface)(impl);
              } catch (error) {
                handleValidationErrorPort.handleValidationError(
                  new Error(`The implFactory "${implFactoryName}" failed. ${error.message}`)
                );
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
