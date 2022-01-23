import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { makeTrait } from '../entities/trait.entity';
import { makeGlueTraitService } from './glueTraitService';

describe('Test glueTraitService', () => {
  let glueTraitService = null;
  let ports = null;

  beforeEach(() => {
    ports = {
      validatePort: {
        validate: jest.fn().mockImplementation(() => {
          return new Error('Validation error');
        }),
      },
    };
    glueTraitService = makeGlueTraitService(ports);
  });

  it(`Throws when the impl doesn't implement the trait`, () => {
    const impl = {};
    const implWrapper = glueTraitService.glueTrait(makeTrait({ name: 'callTestFunction' }));

    expect(() => {
      implWrapper(impl);
    }).toThrowError(new Error('The trait "callTestFunction" is not implemented.'));
  });

  it(`Doesn't throw when the impl fn called without arguments and trait doesn't require arguments too`, () => {
    const impl = {
      callTestFunction: () => {},
    };
    const implWrapper = glueTraitService.glueTrait(makeTrait({ name: 'callTestFunction' }));
    const wrappedImpl = implWrapper(impl);

    expect(() => {
      wrappedImpl.callTestFunction();
    }).not.toThrow();
  });

  it(`Throws when the impl fn called with arguments that aren't described in trait`, () => {
    const impl = {
      callTestFunction: () => {},
    };
    const implWrapper = glueTraitService.glueTrait(makeTrait({ name: 'callTestFunction' }));
    const wrappedImpl = implWrapper(impl);

    expect(() => {
      wrappedImpl.callTestFunction('some argument');
    }).toThrowError(
      new Error(
        'Failed arguments validation for the trait "callTestFunction". Cause error: Provided more arguments than required for trait.'
      )
    );
  });

  it(`Throws when the impl fn is a generator function with invalid arguments`, () => {
    const impl = {
      *callTestFunction() {
        yield undefined;
      },
    };
    const implWrapper = glueTraitService.glueTrait(makeTrait({ name: 'callTestFunction' }));
    const wrappedImpl = implWrapper(impl);

    expect(() => {
      wrappedImpl.callTestFunction('some argument');
    }).toThrowError(
      new Error(
        'Failed arguments validation for the trait "callTestFunction". Cause error: Provided more arguments than required for trait.'
      )
    );
  });

  it.todo(`Throws when the impl fn is a class method with invalid arguments`);

  it(`Calls validatePort when the impl fn called with arguments that described in trait`, () => {
    expect.assertions(2);

    const ARGUMENT = 'some argument';
    const SCHEMA = 'test schema';

    ports.validatePort.validate.mockImplementation(({ schema, value }) => {
      expect(schema).toBe(SCHEMA);
      expect(value).toBe(ARGUMENT);
      return undefined;
    });

    const impl = {
      callTestFunction: () => {},
    };
    const implWrapper = glueTraitService.glueTrait(
      makeTrait({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const wrappedImpl = implWrapper(impl);

    wrappedImpl.callTestFunction(ARGUMENT);
  });

  it(`Throws when validation of impl fn arguments returns error`, () => {
    expect.assertions(3);

    const ARGUMENT = 'some argument';
    const SCHEMA = 'test schema';

    ports.validatePort.validate.mockImplementation(({ schema, value }) => {
      expect(schema).toBe(SCHEMA);
      expect(value).toBe(ARGUMENT);
      return new Error('VALIDATION_ERROR_MESSAGE');
    });

    const impl = {
      callTestFunction: () => {},
    };
    const implWrapper = glueTraitService.glueTrait(
      makeTrait({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const wrappedImpl = implWrapper(impl);

    expect(() => {
      wrappedImpl.callTestFunction(ARGUMENT);
    }).toThrowError(
      new Error(
        `Failed arguments validation for the trait "callTestFunction". Cause error: VALIDATION_ERROR_MESSAGE`
      )
    );
  });

  it(`Proxies implFn only once even when a trait glued multiple times`, () => {
    expect.assertions(3);

    const ARGUMENT = 'some argument';
    const SCHEMA = 'test schema';

    ports.validatePort.validate.mockImplementation(({ schema, value }) => {
      expect(schema).toBe(SCHEMA);
      expect(value).toBe(ARGUMENT);
      return undefined;
    });

    const impl = {
      callTestFunction: () => {},
    };
    const firstImplWrapper = glueTraitService.glueTrait(
      makeTrait({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const secondImplWrapper = glueTraitService.glueTrait(
      makeTrait({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const wrappedImplOnce = firstImplWrapper(impl);
    const wrappedImplTwice = secondImplWrapper(wrappedImplOnce);
    expect(wrappedImplOnce).toBe(wrappedImplTwice);

    wrappedImplTwice.callTestFunction(ARGUMENT);
  });

  it(`Throws when the implFn is already glued with another trait`, () => {
    const SCHEMA = 'test schema';

    const impl = {
      callTestFunction: () => {},
    };
    const implWrapper1 = glueTraitService.glueTrait(
      makeTrait({ name: 'callTestFunction', args: [SCHEMA] })
    );
    const implWrapper2 = glueTraitService.glueTrait(
      makeTrait({ name: 'callTestFunction2', args: [SCHEMA] })
    );
    const wrappedImpl1 = implWrapper1(impl);

    expect(() => {
      implWrapper2({ callTestFunction2: wrappedImpl1.callTestFunction });
    }).toThrowError(
      new Error(
        'The implFn for the trait "callTestFunction2" already implements another trait "callTestFunction".'
      )
    );
  });
});
