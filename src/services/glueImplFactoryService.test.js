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
      glueImplFactoryService.glueImplFactory({});
    }).toThrowError(
      new Error('The "name" option of an implFactory is required and must be a string.')
    );
  });

  it(`Throws when the "implements" option isn't provided`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory({ implFactoryName: 'IMPL_FACTORY_NAME' });
    }).toThrowError(
      new Error(
        'The "implements" option of the implFactory "IMPL_FACTORY_NAME" must be an array of interfaces.'
      )
    );
  });

  it(`Throws when the "implements" option is empty`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory({
        implFactoryName: 'IMPL_FACTORY_NAME',
        implements: [],
      });
    }).toThrowError(
      new Error(
        'The "implements" option of the implFactory "IMPL_FACTORY_NAME" must be an array of interfaces.'
      )
    );
  });

  it(`Returns an implFactoryWrapper function when options provided without a problem `, () => {
    expect(
      glueImplFactoryService.glueImplFactory({
        implFactoryName: 'IMPL_FACTORY_NAME',
        implements: [makeImplInterface({ name: 'TEST_TRAIT' })],
      })
    ).toBeInstanceOf(Function);
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
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory({
      implFactoryName: 'IMPL_FACTORY_NAME',
      implements: [makeImplInterface({ name: TRAIT_NAME })],
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
    const wrappedImplFactory = glueImplFactoryService.glueImplFactory({
      implFactoryName: 'IMPL_FACTORY_NAME',
      implements: [makeImplInterface({ name: 'callTestFunction' })],
    })(implFactory);
    wrappedImplFactory();

    expect(ports.handleValidationErrorPort.handleValidationError.mock.calls).toEqual([
      [new Error('The implFactory "IMPL_FACTORY_NAME" failed. GLUE_TRAIT_ERROR_MESSAGE')],
    ]);
  });
});
