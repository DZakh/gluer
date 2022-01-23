import { makeGlueImplFactoryService } from './services/glueImplFactoryService';
import { makeGlueImplService } from './services/glueImplService';
import { makeMakeImplInterfaceService } from './services/makeImplInterfaceService';
import { makeValidateValuesBySchemasService } from './services/validateValuesBySchemasService';

export const makeGluer = (gluerOptions) => {
  if (process.env.NODE_ENV === 'production') {
    return {
      makeImplInterface: () => {},
      glueImpl: () => {
        return (impl) => {
          return impl;
        };
      },
      glueImplFactory: () => {
        return (implFactory) => {
          return implFactory;
        };
      },
    };
  }

  const gluerOptionsAdapter = {
    validate: gluerOptions.validate,
    // eslint-disable-next-line no-console
    handleValidationError: gluerOptions.handleValidationError || console.error,
  };

  const validateValuesBySchemasService = makeValidateValuesBySchemasService({
    validatePort: gluerOptionsAdapter,
  });
  const makeImplInterfaceService = makeMakeImplInterfaceService();
  const glueImplService = makeGlueImplService({
    validateValuesBySchemasUseCase: validateValuesBySchemasService,
    handleValidationErrorPort: gluerOptionsAdapter,
  });
  const glueImplFactoryService = makeGlueImplFactoryService({
    glueImplUseCase: glueImplService,
    validateValuesBySchemasUseCase: validateValuesBySchemasService,
    handleValidationErrorPort: gluerOptionsAdapter,
  });

  return {
    makeImplInterface: makeImplInterfaceService.makeImplInterface,
    glueImpl: glueImplService.glueImpl,
    glueImplFactory: glueImplFactoryService.glueImplFactory,
  };
};
