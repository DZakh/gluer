import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { makeTrait } from '../entities/trait.entity';
import { makeGlueImplFactoryService } from './glueImplFactoryService';

describe('Test glueImplFactoryService options validation', () => {
  let glueImplFactoryService = null;

  beforeEach(() => {
    glueImplFactoryService = makeGlueImplFactoryService({
      glueTraitUseCase: { glueTrait: () => {} },
    });
  });

  it(`Throws when the "name" option isn't provided`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory({});
    }).toThrowError(
      new Error('The "name" option of an implFactory is required and must be a string.')
    );
  });

  it(`Throws when the "implsTraits" option isn't provided`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory({ implFactoryName: 'IMPL_FACTORY_NAME' });
    }).toThrowError(
      new Error(
        'The "implsTraits" property of the implFactory IMPL_FACTORY_NAME must be an array of interfaces.'
      )
    );
  });

  it(`Throws when the "implsTraits" option is empty`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory({
        implFactoryName: 'IMPL_FACTORY_NAME',
        implsTraits: [],
      });
    }).toThrowError(
      new Error(
        'The "implsTraits" property of the implFactory IMPL_FACTORY_NAME must be an array of interfaces.'
      )
    );
  });

  it(`Returns an implFactoryWrapper function when options provided without a problem `, () => {
    expect(
      glueImplFactoryService.glueImplFactory({
        implFactoryName: 'IMPL_FACTORY_NAME',
        implsTraits: [makeTrait({ name: 'TEST_TRAIT' })],
      })
    ).toBeInstanceOf(Function);
  });
});

describe('Test glueImplFactoryService implFactory', () => {
  let glueImplFactoryService = null;
  let ports = null;

  beforeEach(() => {
    ports = {
      glueTraitUseCase: {
        glueTrait: jest.fn(),
      },
    };
    glueImplFactoryService = makeGlueImplFactoryService(ports);
  });

  it('Glues traits to the implementation', () => {
    const ORIGINAL_IMPL = {
      callTestFunction: () => {},
    };
    const GLUED_IMPL = {
      callTestFunction: () => {},
    };

    ports.glueTraitUseCase.glueTrait.mockImplementation((trait) => {
      expect(trait).toStrictEqual(makeTrait({ name: 'callTestFunction' }));
      return (impl) => {
        expect(impl).toBe(ORIGINAL_IMPL);
        return GLUED_IMPL;
      };
    });

    const implFactory = () => {
      return ORIGINAL_IMPL;
    };
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory({
      implFactoryName: 'IMPL_FACTORY_NAME',
      implsTraits: [makeTrait({ name: 'callTestFunction' })],
    })(implFactory);

    expect(wrappedImplFactory()).toBe(GLUED_IMPL);
  });

  it.todo('Maybe add an optional warning about unused properties');

  it('Rethrows glueTrait error with the implFactory name in it', () => {
    const ORIGINAL_IMPL = {
      callTestFunction: () => {},
    };

    ports.glueTraitUseCase.glueTrait.mockImplementation((trait) => {
      expect(trait).toStrictEqual(makeTrait({ name: 'callTestFunction' }));
      return (impl) => {
        expect(impl).toBe(ORIGINAL_IMPL);
        throw new Error('GLUE_TRAIT_ERROR_MESSAGE');
      };
    });

    const implFactory = () => {
      return ORIGINAL_IMPL;
    };
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory({
      implFactoryName: 'IMPL_FACTORY_NAME',
      implsTraits: [makeTrait({ name: 'callTestFunction' })],
    })(implFactory);

    expect(() => {
      wrappedImplFactory();
    }).toThrowError(
      new Error('The implFactory IMPL_FACTORY_NAME failed. GLUE_TRAIT_ERROR_MESSAGE')
    );
  });
});
