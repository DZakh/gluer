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
    };
    glueImplService = makeGlueImplService(ports);
  });

  it(`Throws when the impl doesn't implement the interface`, () => {
    const impl = {};
    const implWrapper = glueImplService.glueImpl(makeImplInterface({ name: 'callTestFunction' }));

    expect(() => {
      implWrapper(impl);
    }).toThrowError(new Error('The interface "callTestFunction" is not implemented.'));
  });

  it(`Throws when the implFn called with invalid arguments`, () => {
    const impl = {
      callTestFunction: () => {},
    };
    const implWrapper = glueImplService.glueImpl(makeImplInterface({ name: 'callTestFunction' }));
    const wrappedImpl = implWrapper(impl);

    expect(() => {
      wrappedImpl.callTestFunction('some argument');
    }).toThrowError(
      new Error(
        'Failed arguments validation for the interface "callTestFunction". Cause error: VALIDATION_ERROR_MESSAGE'
      )
    );
  });

  it(`Throws when the implFn is a generator function with invalid arguments`, () => {
    const impl = {
      *callTestFunction() {
        yield undefined;
      },
    };
    const implWrapper = glueImplService.glueImpl(makeImplInterface({ name: 'callTestFunction' }));
    const wrappedImpl = implWrapper(impl);

    expect(() => {
      wrappedImpl.callTestFunction('some argument');
    }).toThrowError(
      new Error(
        'Failed arguments validation for the interface "callTestFunction". Cause error: VALIDATION_ERROR_MESSAGE'
      )
    );
  });

  it.todo(`Throws when the implFn is a class method with invalid arguments`);

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

  it(`Throws when validation of implFn arguments returns error`, () => {
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

    const impl = {
      callTestFunction: () => {},
    };
    const implWrapper = glueImplService.glueImpl(
      makeImplInterface({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const wrappedImpl = implWrapper(impl);

    expect(() => {
      wrappedImpl.callTestFunction(ARGUMENT);
    }).toThrowError(
      new Error(
        `Failed arguments validation for the interface "callTestFunction". Cause error: VALIDATION_ERROR_MESSAGE`
      )
    );
  });

  it(`Proxies implFn only once even when a interface glued multiple times`, () => {
    expect.assertions(3);

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
    const firstImplWrapper = glueImplService.glueImpl(
      makeImplInterface({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const secondImplWrapper = glueImplService.glueImpl(
      makeImplInterface({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const wrappedImplOnce = firstImplWrapper(impl);
    const wrappedImplTwice = secondImplWrapper(wrappedImplOnce);
    expect(wrappedImplOnce).toBe(wrappedImplTwice);

    wrappedImplTwice.callTestFunction(ARGUMENT);
  });

  it(`Throws when the implFn is already glued with another interface`, () => {
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

    expect(() => {
      implWrapper2({ callTestFunction2: wrappedImpl1.callTestFunction });
    }).toThrowError(
      new Error(
        'The implFn for the interface "callTestFunction2" already implements another interface "callTestFunction".'
      )
    );
  });
});
