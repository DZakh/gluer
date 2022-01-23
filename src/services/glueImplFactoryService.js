export const makeGlueImplFactoryService = ({ glueTraitUseCase }) => {
  return {
    glueImplFactory: ({ implFactoryName, implsTraits }) => {
      if (!implFactoryName || typeof implFactoryName !== 'string') {
        throw new Error('The "name" option of an implFactory is required and must be a string.');
      }

      if (!(implsTraits && Array.isArray(implsTraits) && implsTraits.length)) {
        throw new Error(
          `The "implsTraits" property of the implFactory ${implFactoryName} must be an array of interfaces.`
        );
      }

      return (implFactory) => {
        return (...args) => {
          let impl = implFactory(...args);

          implsTraits.forEach((trait) => {
            try {
              impl = glueTraitUseCase.glueTrait(trait)(impl);
            } catch (error) {
              throw new Error(`The implFactory ${implFactoryName} failed. ${error.message}`);
            }
          });

          return impl;
        };
      };
    },
  };
};
