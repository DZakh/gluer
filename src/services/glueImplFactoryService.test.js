import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { makeImplInterface } from '../entities/implInterface.entity';
import { makeGlueImplFactoryService } from './glueImplFactoryService';

describe('Test glueImplFactoryService options validation', () => {
  let glueImplFactoryService = null;

  beforeEach(() => {
    glueImplFactoryService = makeGlueImplFactoryService({
      glueImplUseCase: { glueImpl: () => {} },
      validateValuesBySchemasUseCase: {
        validateValuesBySchemas: () => {},
      },
      handleValidationErrorPort: { handleValidationError: () => {} },
    });
  });

  it(`Throws when the "name" option isn't provided`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory();
    }).toThrowError(
      new Error('The "name" option of an implFactory is required and must be a string.')
    );
  });

  it(`Throws when the "implements" option isn't provided`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory('IMPL_FACTORY_NAME');
    }).toThrowError(
      new Error(
        'The "implements" option of the implFactory "IMPL_FACTORY_NAME" must be an array of interfaces.'
      )
    );
  });

  it(`Throws when the "implements" option is empty`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory('IMPL_FACTORY_NAME', () => {
        return {
          implements: [],
        };
      });
    }).toThrowError(
      new Error(
        'The "implements" option of the implFactory "IMPL_FACTORY_NAME" must be an array of interfaces.'
      )
    );
  });

  it(`Returns an implFactoryWrapper function when options provided without a problem `, () => {
    expect(
      glueImplFactoryService.glueImplFactory('IMPL_FACTORY_NAME', () => {
        return {
          implements: [makeImplInterface({ name: 'TEST_TRAIT' })],
        };
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
      handleValidationErrorPort: { handleValidationError: jest.fn() },
    };
    glueImplFactoryService = makeGlueImplFactoryService(ports);
  });

  it(`Calls validateValuesBySchemasUseCase when the implFactory called with arguments that described in options`, () => {
    const ARGUMENT = 'some argument';
    const SCHEMA = 'test schema';

    const implFactory = () => {
      return {
        callTestFunction: () => {},
      };
    };
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory('IMPL_FACTORY_NAME', () => {
      return {
        implements: [makeImplInterface({ name: 'callTestFunction' })],
        args: [SCHEMA],
      };
    })(implFactory);
    wrappedImplFactory(ARGUMENT);

    expect(ports.validateValuesBySchemasUseCase.validateValuesBySchemas.mock.calls).toEqual([
      [{ schemas: [SCHEMA], values: [ARGUMENT] }],
    ]);
  });

  describe('With failing validation', () => {
    beforeEach(() => {
      ports.validateValuesBySchemasUseCase.validateValuesBySchemas.mockImplementation(() => {
        return new Error('VALIDATION_ERROR_MESSAGE');
      });
    });

    it(`Calls handleValidationErrorPort when validation of implFactory arguments returns error`, () => {
      const ARGUMENT = 'some argument';
      const SCHEMA = 'test schema';

      const implFactory = () => {
        return {
          callTestFunction: () => {},
        };
      };
      const wrappedImplFactory = glueImplFactoryService.glueImplFactory('IMPL_FACTORY_NAME', () => {
        return {
          implements: [makeImplInterface({ name: 'callTestFunction' })],
          args: [SCHEMA],
        };
      })(implFactory);
      wrappedImplFactory(ARGUMENT);

      expect(ports.handleValidationErrorPort.handleValidationError.mock.calls).toEqual([
        [
          new Error(
            `Failed arguments validation for the implFactory "IMPL_FACTORY_NAME". Cause error: VALIDATION_ERROR_MESSAGE`
          ),
        ],
      ]);
    });

    it(`The implFactory successfully return an impl even though validation has failed`, () => {
      const ARGUMENT = 'some argument';
      const SCHEMA = 'test schema';
      const IMPL = {
        callTestFunction: () => {},
      };

      const implFactory = () => {
        return IMPL;
      };
      const wrappedImplFactory = glueImplFactoryService.glueImplFactory('IMPL_FACTORY_NAME', () => {
        return {
          implements: [makeImplInterface({ name: 'callTestFunction' })],
          args: [SCHEMA],
        };
      })(implFactory);
      const impl = wrappedImplFactory(ARGUMENT);

      expect(impl).toBe(IMPL);
    });
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
      handleValidationErrorPort: { handleValidationError: jest.fn() },
    };
    glueImplFactoryService = makeGlueImplFactoryService(ports);
  });

  it('Glues implInterfaces to the implementation', () => {
    const TRAIT_NAME = 'callTestFunction';
    const IMPL_FN1 = () => {};
    const IMPL_FN2 = () => {};
    const ORIGINAL_IMPL = {
      [TRAIT_NAME]: IMPL_FN1,
    };

    ports.glueImplUseCase.glueImpl.mockImplementation((implInterface) => {
      expect(implInterface).toStrictEqual(makeImplInterface({ name: TRAIT_NAME }));
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
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory('IMPL_FACTORY_NAME', () => {
      return {
        implements: [makeImplInterface({ name: TRAIT_NAME })],
      };
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

    ports.glueImplUseCase.glueImpl.mockImplementation((implInterface) => {
      expect(implInterface).toStrictEqual(makeImplInterface({ name: 'callTestFunction' }));
      return (impl) => {
        expect(impl).toBe(ORIGINAL_IMPL);
        throw new Error('GLUE_TRAIT_ERROR_MESSAGE');
      };
    });

    const implFactory = () => {
      return ORIGINAL_IMPL;
    };
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory('IMPL_FACTORY_NAME', () => {
      return {
        implements: [makeImplInterface({ name: 'callTestFunction' })],
      };
    })(implFactory);
    wrappedImplFactory();

    expect(ports.handleValidationErrorPort.handleValidationError.mock.calls).toEqual([
      [new Error('The implFactory "IMPL_FACTORY_NAME" failed. GLUE_TRAIT_ERROR_MESSAGE')],
    ]);
  });
});
