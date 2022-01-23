import { makeGlueImplFactoryService } from './services/glueImplFactoryService';
import { makeGlueTraitService } from './services/glueImplService';
import { makeMakeTraitService } from './services/makeTraitService';
import { makeValidateValuesBySchemasService } from './services/validateValuesBySchemasService';

export const makeGluer = (gluerOptions) => {
  if (process.env.NODE_ENV === 'production') {
    return {
      makeTrait: () => {},
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

  const validateValuesBySchemasService = makeValidateValuesBySchemasService({
    validatePort: gluerOptions,
  });
  const makeTraitService = makeMakeTraitService();
  const glueImplService = makeGlueTraitService({
    validateValuesBySchemasUseCase: validateValuesBySchemasService,
  });
  const glueImplFactoryService = makeGlueImplFactoryService({
    glueImplUseCase: glueImplService,
    validateValuesBySchemasUseCase: validateValuesBySchemasService,
  });

  return {
    makeTrait: makeTraitService.makeTrait,
    glueImpl: glueImplService.glueImpl,
    glueImplFactory: glueImplFactoryService.glueImplFactory,
  };
};
