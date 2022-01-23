import { makeGlueImplFactoryService } from './services/glueImplFactoryService';
import { makeGlueTraitService } from './services/glueTraitService';
import { makeMakeTraitService } from './services/makeTraitService';

export const makeGluer = (gluerOptions) => {
  const makeTraitService = makeMakeTraitService();
  const glueTraitService = makeGlueTraitService({ validatePort: gluerOptions });
  const glueImplFactoryService = makeGlueImplFactoryService({ glueTraitUseCase: glueTraitService });

  return {
    makeTrait: makeTraitService.makeTrait,
    glueTrait: glueTraitService.glueTrait,
    glueImplFactory: glueImplFactoryService.glueImplFactory,
  };
};
