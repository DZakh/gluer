import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { makeImplInterface } from '../entities/implInterface.entity';
import { makeGlueImplService } from './glueImplService';

describe('Test glueImplService', () => {
  let glueImplService = null;
  let ports = null;

  beforeEach(() => {
    ports = {
      validateValuesBySchemasUseCase: {
        validateValuesBySchemas: jest.fn().mockImplementation(() => {
          return new Error('VALIDATION_ERROR_MESSAGE');
        }),
      },
      handleValidationErrorPort: { handleValidationError: jest.fn() },
    };
    glueImplService = makeGlueImplService(ports);
  });

  it(`Creates validation error when the impl doesn't implement the interface, but still return original impl`, () => {
    const impl = {};
    const implWrapper = glueImplService.glueImpl(makeImplInterface({ name: 'callTestFunction' }));

    const wrappedImpl = implWrapper(impl);

    expect(ports.handleValidationErrorPort.handleValidationError.mock.calls).toEqual([
      [new Error('The interface "callTestFunction" is not implemented.')],
    ]);
    expect(wrappedImpl).toBe(impl);
  });

  it(`Creates validation error when the implFn called with invalid arguments, but still return a result`, () => {
    const RESULT = 'RESULT';
    const impl = {
      callTestFunction: () => {
        return RESULT;
      },
    };
    const implWrapper = glueImplService.glueImpl(makeImplInterface({ name: 'callTestFunction' }));
    const wrappedImpl = implWrapper(impl);

    const result = wrappedImpl.callTestFunction('some argument');

    expect(ports.handleValidationErrorPort.handleValidationError.mock.calls).toEqual([
      [
        new Error(
          'Failed arguments validation for the interface "callTestFunction". Cause error: VALIDATION_ERROR_MESSAGE'
        ),
      ],
    ]);
    expect(result).toBe(RESULT);
  });

  it(`Creates validation error when the implFn is a generator function with invalid arguments, but still return generator`, () => {
    const impl = {
      *callTestFunction() {
        yield undefined;
      },
    };
    const implWrapper = glueImplService.glueImpl(makeImplInterface({ name: 'callTestFunction' }));
    const wrappedImpl = implWrapper(impl);

    const generator = wrappedImpl.callTestFunction('some argument');

    expect(ports.handleValidationErrorPort.handleValidationError.mock.calls).toEqual([
      [
        new Error(
          'Failed arguments validation for the interface "callTestFunction". Cause error: VALIDATION_ERROR_MESSAGE'
        ),
      ],
    ]);
    expect(generator.constructor.name).toBe('GeneratorFunctionPrototype');
  });

  it.todo(
    `Creates validation error when the implFn is a class method with invalid arguments, but still return a result`
  );

  it(`Calls validateValuesBySchemasUseCase when the implFn called with arguments that described in interface`, () => {
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

    const impl = {
      callTestFunction: () => {},
    };
    const implWrapper = glueImplService.glueImpl(
      makeImplInterface({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const wrappedImpl = implWrapper(impl);

    wrappedImpl.callTestFunction(ARGUMENT);
  });

  it(`Creates validation error when validation of the implFn arguments failed, but still return a result`, () => {
    const ARGUMENT = 'some argument';
    const SCHEMA = 'test schema';
    const RESULT = 'RESULT';

    ports.validateValuesBySchemasUseCase.validateValuesBySchemas.mockImplementation(() => {
      return new Error('CUSTOM_VALIDATION_ERROR_MESSAGE');
    });

    const impl = {
      callTestFunction: () => {
        return RESULT;
      },
    };
    const implWrapper = glueImplService.glueImpl(
      makeImplInterface({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const wrappedImpl = implWrapper(impl);

    const result = wrappedImpl.callTestFunction(ARGUMENT);

    expect(ports.handleValidationErrorPort.handleValidationError.mock.calls).toEqual([
      [
        new Error(
          `Failed arguments validation for the interface "callTestFunction". Cause error: CUSTOM_VALIDATION_ERROR_MESSAGE`
        ),
      ],
    ]);
    expect(ports.validateValuesBySchemasUseCase.validateValuesBySchemas.mock.calls).toEqual([
      [{ schemas: [SCHEMA], values: [ARGUMENT] }],
    ]);
    expect(result).toBe(RESULT);
  });

  it(`Proxies implFn only once even when a interface glued multiple times`, () => {
    ports.validateValuesBySchemasUseCase.validateValuesBySchemas.mockImplementation(() => {
      return undefined;
    });

    const impl = {
      callTestFunction: () => {},
    };
    const firstImplWrapper = glueImplService.glueImpl(
      makeImplInterface({ name: 'callTestFunction' })
    );
    const secondImplWrapper = glueImplService.glueImpl(
      makeImplInterface({ name: 'callTestFunction' })
    );
    const wrappedImplOnce = firstImplWrapper(impl);
    const wrappedImplTwice = secondImplWrapper(wrappedImplOnce);

    expect(wrappedImplOnce).toBe(wrappedImplTwice);

    wrappedImplTwice.callTestFunction();

    expect(ports.validateValuesBySchemasUseCase.validateValuesBySchemas).toHaveBeenCalledTimes(1);
  });

  it(`Creates validation error when the implFn is already glued with another interface, but still return original impl`, () => {
    const SCHEMA = 'test schema';

    const impl = {
      callTestFunction: () => {},
    };
    const implWrapper1 = glueImplService.glueImpl(
      makeImplInterface({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const implWrapper2 = glueImplService.glueImpl(
      makeImplInterface({ name: 'callTestFunction2', args: [SCHEMA] })
    );
    const wrappedImpl1 = implWrapper1(impl);
    const impl2 = { callTestFunction2: wrappedImpl1.callTestFunction };
    const wrappedImpl2 = implWrapper2(impl2);

    expect(ports.handleValidationErrorPort.handleValidationError.mock.calls).toEqual([
      [
        new Error(
          'The implFn for the interface "callTestFunction2" already implements another interface "callTestFunction".'
        ),
      ],
    ]);
    expect(wrappedImpl2).toBe(impl2);
  });
});
