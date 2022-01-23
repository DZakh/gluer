import { makeGlueImplFactoryService } from './services/glueImplFactoryService';
import { makeMakeTraitService } from './services/makeTraitService';

export const makeGluer = (gluerOptions) => {
  const makeTraitService = makeMakeTraitService();
  const glueImplFactoryService = makeGlueImplFactoryService({ validatePort: gluerOptions });

  return {
    makeTrait: makeTraitService.makeTrait,
    glueImplFactory: glueImplFactoryService.glueImplFactory,
  };
};
