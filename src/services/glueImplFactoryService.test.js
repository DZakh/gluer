import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { makeTrait } from '../entities/trait.entity';
import { makeGlueImplFactoryService } from './glueImplFactoryService';

describe('Test glueImplFactoryService options validation', () => {
  let glueImplFactoryService = null;

  beforeEach(() => {
    glueImplFactoryService = makeGlueImplFactoryService({
      glueImplUseCase: { glueImpl: () => {} },
      validateValuesBySchemasUseCase: {
        validateValuesBySchemas: () => {},
      },
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
        'The "implsTraits" property of the implFactory "IMPL_FACTORY_NAME" must be an array of interfaces.'
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
        'The "implsTraits" property of the implFactory "IMPL_FACTORY_NAME" must be an array of interfaces.'
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

describe('Test glueImplFactoryService implFactory arguments validation', () => {
  let glueImplFactoryService = null;
  let ports = null;

  beforeEach(() => {
    ports = {
      glueImplUseCase: {
        glueImpl: () => {
          return (impl) => {
            return impl;
          };
        },
      },
      validateValuesBySchemasUseCase: {
        validateValuesBySchemas: jest.fn(),
      },
    };
    glueImplFactoryService = makeGlueImplFactoryService(ports);
  });

  it(`Calls validateValuesBySchemasUseCase when the implFactory called with arguments that described in options`, () => {
    expect.assertions(2);

    const ARGUMENT = 'some argument';
    const SCHEMA = 'test schema';

    ports.validateValuesBySchemasUseCase.validateValuesBySchemas.mockImplementation(
      ({ schemas, values }) => {
        expect(schemas).toStrictEqual([SCHEMA]);
        expect(values).toStrictEqual([ARGUMENT]);
        return undefined;
      }
    );

    const implFactory = () => {
      return {
        callTestFunction: () => {},
      };
    };
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory({
      implFactoryName: 'IMPL_FACTORY_NAME',
      implsTraits: [makeTrait({ name: 'callTestFunction' })],
      args: [SCHEMA],
    })(implFactory);

    wrappedImplFactory(ARGUMENT);
  });

  it(`Throws when validation of implFactory arguments returns error`, () => {
    expect.assertions(3);

    const ARGUMENT = 'some argument';
    const SCHEMA = 'test schema';

    ports.validateValuesBySchemasUseCase.validateValuesBySchemas.mockImplementation(
      ({ schemas, values }) => {
        expect(schemas).toStrictEqual([SCHEMA]);
        expect(values).toStrictEqual([ARGUMENT]);
        return new Error('VALIDATION_ERROR_MESSAGE');
      }
    );

    const implFactory = () => {
      return {
        callTestFunction: () => {},
      };
    };
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory({
      implFactoryName: 'IMPL_FACTORY_NAME',
      implsTraits: [makeTrait({ name: 'callTestFunction' })],
      args: [SCHEMA],
    })(implFactory);

    expect(() => {
      wrappedImplFactory(ARGUMENT);
    }).toThrowError(
      new Error(
        `Failed arguments validation for the implFactory "IMPL_FACTORY_NAME". Cause error: VALIDATION_ERROR_MESSAGE`
      )
    );
  });
});

describe('Test glueImplFactoryService implFactory', () => {
  let glueImplFactoryService = null;
  let ports = null;

  beforeEach(() => {
    ports = {
      glueImplUseCase: {
        glueImpl: jest.fn(),
      },
      validateValuesBySchemasUseCase: {
        validateValuesBySchemas: () => {},
      },
    };
    glueImplFactoryService = makeGlueImplFactoryService(ports);
  });

  it('Glues traits to the implementation', () => {
    const TRAIT_NAME = 'callTestFunction';
    const IMPL_FN1 = () => {};
    const IMPL_FN2 = () => {};
    const ORIGINAL_IMPL = {
      [TRAIT_NAME]: IMPL_FN1,
    };

    ports.glueImplUseCase.glueImpl.mockImplementation((trait) => {
      expect(trait).toStrictEqual(makeTrait({ name: TRAIT_NAME }));
      return (impl) => {
        expect(impl).toBe(ORIGINAL_IMPL);
        expect(impl[TRAIT_NAME]).toBe(IMPL_FN1);
        // eslint-disable-next-line no-param-reassign
        impl[TRAIT_NAME] = IMPL_FN2;
        return impl;
      };
    });

    const implFactory = () => {
      return ORIGINAL_IMPL;
    };
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory({
      implFactoryName: 'IMPL_FACTORY_NAME',
      implsTraits: [makeTrait({ name: TRAIT_NAME })],
    })(implFactory);
    const impl = wrappedImplFactory();

    expect(impl).toBe(ORIGINAL_IMPL);
    expect(impl[TRAIT_NAME]).toBe(IMPL_FN2);
  });

  it.todo('Maybe add an optional warning about unused properties');

  it('Rethrows glueImpl error with the implFactory name in it', () => {
    const ORIGINAL_IMPL = {
      callTestFunction: () => {},
    };

    ports.glueImplUseCase.glueImpl.mockImplementation((trait) => {
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
      new Error('The implFactory "IMPL_FACTORY_NAME" failed. GLUE_TRAIT_ERROR_MESSAGE')
    );
  });
});
