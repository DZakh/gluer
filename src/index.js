import { makeGlueImplFactoryService } from './services/glueImplFactoryService';
import { makeMakeTraitService } from './services/makeTraitService';

export const makeGluer = ({ validate }) => {
  const makeTraitService = makeMakeTraitService();
  const glueImplFactoryService = makeGlueImplFactoryService({ validatePort: { validate } });

  return {
    makeTrait: makeTraitService.makeTrait,
    glueImplFactory: glueImplFactoryService.glueImplFactory,
  };
};
