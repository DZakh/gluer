import { checkIsInterfaceImplemented, getInterfaceName } from '../entities/implInterface.entity';

const validateProvidedDependencies = (requiredDependencies, providedDependencies) => {
  const requiredDependencyNames = Object.keys(requiredDependencies);
  const providedDependencyNames = Object.keys(providedDependencies);

  if (requiredDependencyNames.length > providedDependencyNames.length) {
    return new Error(
      `Provided less dependencies than required. Provided: "${providedDependencyNames}". Required: "${requiredDependencyNames}".`
    );
  }

  if (requiredDependencyNames.length < providedDependencyNames.length) {
    return new Error(
      `Provided more dependencies than required. Provided: "${providedDependencyNames}". Required: "${requiredDependencyNames}".`
    );
  }

  for (let i = 0; i < requiredDependencyNames.length; i += 1) {
    const requiredDependencyName = requiredDependencyNames[i];
    const providedDependencyName = providedDependencyNames[i];

    if (requiredDependencyName !== providedDependencyName) {
      return new Error(
        `Provided dependency names do not match the required. Provided: "${providedDependencyNames}". Required: "${requiredDependencyNames}".`
      );
    }

    const maybeInterfaceMeta = requiredDependencies[requiredDependencyName];
    const interfaceName = maybeInterfaceMeta && getInterfaceName(maybeInterfaceMeta);
    if (!interfaceName) {
      return new Error(
        `Required dependency with the name "${requiredDependencyName}" isn't an interface.`
      );
    }
    const interfaceMeta = maybeInterfaceMeta;

    if (
      !checkIsInterfaceImplemented(interfaceMeta, {
        impl: providedDependencies[providedDependencyName],
      })
    ) {
      return new Error(
        `Provided dependency with the name "${requiredDependencyName}" doesn't implement required interface "${interfaceName}".`
      );
    }
  }
  return undefined;
};

export const makeGlueImplFactoryService = ({ glueImplUseCase, handleValidationErrorPort }) => {
  return {
    glueImplFactory: ({ implFactoryName, implements: impls, depends = {} }) => {
      if (!implFactoryName || typeof implFactoryName !== 'string') {
        throw new Error('The "name" option of an implFactory is required and must be a string.');
      }
      if (!(impls && Array.isArray(impls) && impls.length)) {
        throw new Error(
          `The "implements" option of the implFactory "${implFactoryName}" must be an array of interfaces.`
        );
      }

      return (implFactory) => {
        const handler = {
          apply: (target, thisArg, argumentsList) => {
            const [providedDependencies = {}] = argumentsList;
            const validateProvidedDependenciesResult = validateProvidedDependencies(
              depends,
              providedDependencies
            );
            if (validateProvidedDependenciesResult instanceof Error) {
              const causeError = validateProvidedDependenciesResult;
              let message = `Failed dependencies validation for the implFactory "${implFactoryName}".`;
              const causeErrorMessage = causeError.message;
              if (causeErrorMessage) {
                message = `${message} Cause error: ${causeErrorMessage}`;
              }
              handleValidationErrorPort.handleValidationError(new Error(message));
            } else {
              Object.keys(depends).forEach((dependencyName) => {
                const dependencyInterfaceMeta = depends[dependencyName];
                const dependencyImpl = providedDependencies[dependencyName];
                try {
                  glueImplUseCase.glueImpl(dependencyInterfaceMeta)(dependencyImpl);
                } catch (error) {
                  handleValidationErrorPort.handleValidationError(
                    new Error(`The implFactory "${implFactoryName}" failed. ${error.message}`)
                  );
                }
              });
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
