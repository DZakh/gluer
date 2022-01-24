import { makeGlueImplFactoryService } from './services/glueImplFactoryService';
import { makeGlueImplService } from './services/glueImplService';
import { makeMakeInterfaceService } from './services/makeInterfaceService';
import { makeValidateValuesBySchemasService } from './services/validateValuesBySchemasService';

export const makeGluer = (gluerOptions) => {
  if (process.env.NODE_ENV === 'production') {
    return {
      makeInterface: () => {},
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
  const makeInterfaceService = makeMakeInterfaceService();
  const glueImplService = makeGlueImplService({
    validateValuesBySchemasUseCase: validateValuesBySchemasService,
    handleValidationErrorPort: gluerOptionsAdapter,
  });
  const glueImplFactoryService = makeGlueImplFactoryService({
    glueImplUseCase: glueImplService,
    handleValidationErrorPort: gluerOptionsAdapter,
  });

  return {
    makeInterface: makeInterfaceService.makeInterface,
    glueImplFactory: glueImplFactoryService.glueImplFactory,
  };
};
