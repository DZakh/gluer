import {
  checkIsImplFnGlueMetaWithSameInterface,
  getImplFnInterfaceName,
  makeImplFnGlueMeta,
} from '../entities/implFnGlueMeta.entity';
import {
  checkIsInterfaceImplemented,
  getInterfaceArgSchemas,
  getInterfaceImplFn,
  getInterfaceName,
} from '../entities/implInterface.entity';

export const makeGlueImplService = ({
  validateValuesBySchemasUseCase,
  handleValidationErrorPort,
}) => {
  return {
    glueImpl: (implInterface) => {
      return (impl) => {
        const interfaceImplFn = getInterfaceImplFn(implInterface, { impl });

        if (!checkIsInterfaceImplemented(implInterface, { impl })) {
          handleValidationErrorPort.handleValidationError(
            new Error(`The interface "${getInterfaceName(implInterface)}" is not implemented.`)
          );
          return impl;
        }

        const maybeImplFnGlueMeta = interfaceImplFn.glueMeta;
        if (maybeImplFnGlueMeta) {
          const implFnGlueMeta = maybeImplFnGlueMeta;
          if (!checkIsImplFnGlueMetaWithSameInterface(implFnGlueMeta, { implInterface })) {
            handleValidationErrorPort.handleValidationError(
              new Error(
                `The implFn for the interface "${getInterfaceName(
                  implInterface
                )}" already implements another interface "${getImplFnInterfaceName(
                  implFnGlueMeta
                )}".`
              )
            );
          }
          return impl;
        }

        const handler = {
          apply: (target, thisArg, argumentsList) => {
            const argsValidationResult = validateValuesBySchemasUseCase.validateValuesBySchemas({
              schemas: getInterfaceArgSchemas(implInterface),
              values: argumentsList,
            });
            if (argsValidationResult instanceof Error) {
              const causeError = argsValidationResult;
              let message = `Failed arguments validation for the interface "${getInterfaceName(
                implInterface
              )}".`;
              const causeErrorMessage = causeError.message;
              if (causeErrorMessage) {
                message = `${message} Cause error: ${causeErrorMessage}`;
              }
              handleValidationErrorPort.handleValidationError(new Error(message));
            }
            return Reflect.apply(target, thisArg, argumentsList);
          },
          get: (target, prop, receiver) => {
            if (prop === 'glueMeta') {
              return makeImplFnGlueMeta({ implInterface });
            }
            return Reflect.get(target, prop, receiver);
          },
        };
        const proxy = new Proxy(interfaceImplFn, handler);

        // eslint-disable-next-line no-param-reassign
        impl[implInterface.name] = proxy;

        return impl;
      };
    },
  };
};
