import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { makeTrait } from '../entities/trait.entity';
import { makeGlueImplFactoryService } from './glueImplFactoryService';

describe('Test glueImplFactoryService options validation', () => {
  let glueImplFactoryService = null;

  beforeEach(() => {
    glueImplFactoryService = makeGlueImplFactoryService({ validatePort: { validate: () => {} } });
  });

  it(`Throws when the "name" option isn't provided`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory({});
    }).toThrowError(
      new Error('The "name" option of an implFactory is required and must be a string.')
    );
  });

  it(`Throws when the "implementsTraits" option isn't provided`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory({ name: 'IMPL_FACTORY_NAME' });
    }).toThrowError(
      new Error(
        'The "implementsTraits" property of the IMPL_FACTORY_NAME implFactory must be an array of interfaces.'
      )
    );
  });

  it(`Throws when the "implementsTraits" option is empty`, () => {
    expect(() => {
      glueImplFactoryService.glueImplFactory({ name: 'IMPL_FACTORY_NAME', implementsTraits: [] });
    }).toThrowError(
      new Error(
        'The "implementsTraits" property of the IMPL_FACTORY_NAME implFactory must be an array of interfaces.'
      )
    );
  });

  it(`Returns an implFactoryWrapper function when options provided without a problem `, () => {
    expect(
      glueImplFactoryService.glueImplFactory({
        name: 'IMPL_FACTORY_NAME',
        implementsTraits: [makeTrait({ name: 'TEST_TRAIT' })],
      })
    ).toBeInstanceOf(Function);
  });
});

describe('Test implFactoryWrapper created by glueImplFactoryService', () => {
  let glueImplFactoryService = null;
  let ports = null;

  beforeEach(() => {
    ports = {
      validatePort: {
        validate: jest.fn().mockImplementation(() => {
          return new Error('Validation error');
        }),
      },
    };
    glueImplFactoryService = makeGlueImplFactoryService(ports);
  });

  it(`Throws when the implFactory didn't implement a trait`, () => {
    const implFactory = () => {
      return {};
    };
    const implFactoryWrapper = glueImplFactoryService.glueImplFactory({
      name: 'IMPL_FACTORY_NAME',
      implementsTraits: [makeTrait({ name: 'callTestFunction' })],
    });

    expect(() => {
      implFactoryWrapper(implFactory)();
    }).toThrowError(
      new Error(
        "The implementation of the IMPL_FACTORY_NAME implFactory doesn't implement all the traits."
      )
    );
  });

  it(`Throws when the implFactory didn't implement all the required traits`, () => {
    const implFactory = () => {
      return {
        callTestFunction: () => {},
      };
    };
    const implFactoryWrapper = glueImplFactoryService.glueImplFactory({
      name: 'IMPL_FACTORY_NAME',
      implementsTraits: [
        makeTrait({ name: 'callTestFunction' }),
        makeTrait({ name: 'callTestFunction2' }),
      ],
    });

    expect(() => {
      implFactoryWrapper(implFactory)();
    }).toThrowError(
      new Error(
        "The implementation of the IMPL_FACTORY_NAME implFactory doesn't implement all the traits."
      )
    );
  });

  // TODO: Add a warning about unused properties that's gonna be configurable via the glueImplFactory options.
  it(`Doesn't throw when the implFactory implements all traits even though it may contain some unrelated properties`, () => {
    const implFactory = () => {
      return {
        foo: 'bar',
        callTestFunction: () => {},
        callTestFunction2: () => {},
      };
    };
    const implFactoryWrapper = glueImplFactoryService.glueImplFactory({
      name: 'IMPL_FACTORY_NAME',
      implementsTraits: [makeTrait({ name: 'callTestFunction' })],
    });

    expect(() => {
      implFactoryWrapper(implFactory)();
    }).not.toThrow();
  });

  it(`Doesn't throw when the impl fn called without arguments and trait doesn't require arguments too`, () => {
    const implFactory = () => {
      return {
        callTestFunction: () => {},
      };
    };
    const implFactoryWrapper = glueImplFactoryService.glueImplFactory({
      name: 'IMPL_FACTORY_NAME',
      implementsTraits: [makeTrait({ name: 'callTestFunction' })],
    });

    const impl = implFactoryWrapper(implFactory)();

    expect(() => {
      impl.callTestFunction();
    }).not.toThrow();
  });

  it(`Throws when the impl fn called with arguments that isn't described in trait`, () => {
    const implFactory = () => {
      return {
        callTestFunction: () => {},
      };
    };
    const implFactoryWrapper = glueImplFactoryService.glueImplFactory({
      name: 'IMPL_FACTORY_NAME',
      implementsTraits: [makeTrait({ name: 'callTestFunction' })],
    });

    const impl = implFactoryWrapper(implFactory)();

    expect(() => {
      impl.callTestFunction('some argument');
    }).toThrowError(
      new Error(
        'Failed arguments validation for the trait callTestFunction. Cause error: Provided more arguments than required for trait.'
      )
    );
  });

  it(`Throws when the impl fn is a generator function with invalid arguments`, () => {
    const implFactory = () => {
      return {
        *callTestFunction() {
          yield undefined;
        },
      };
    };
    const implFactoryWrapper = glueImplFactoryService.glueImplFactory({
      name: 'IMPL_FACTORY_NAME',
      implementsTraits: [makeTrait({ name: 'callTestFunction' })],
    });

    const impl = implFactoryWrapper(implFactory)();

    expect(() => {
      impl.callTestFunction('some argument');
    }).toThrowError(
      new Error(
        'Failed arguments validation for the trait callTestFunction. Cause error: Provided more arguments than required for trait.'
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

    const implFactory = () => {
      return {
        callTestFunction: () => {},
      };
    };
    const implFactoryWrapper = glueImplFactoryService.glueImplFactory({
      name: 'IMPL_FACTORY_NAME',
      implementsTraits: [makeTrait({ name: 'callTestFunction', args: [SCHEMA] })],
    });

    const impl = implFactoryWrapper(implFactory)();
    impl.callTestFunction(ARGUMENT);
  });

  it(`Throws when validation of impl fn arguments returns error`, () => {
    const ARGUMENT = 'some argument';
    const SCHEMA = 'test schema';

    const implFactory = () => {
      return {
        callTestFunction: () => {},
      };
    };
    const implFactoryWrapper = glueImplFactoryService.glueImplFactory({
      name: 'IMPL_FACTORY_NAME',
      implementsTraits: [makeTrait({ name: 'callTestFunction', args: [SCHEMA] })],
    });

    const impl = implFactoryWrapper(implFactory)();

    expect(() => {
      impl.callTestFunction(ARGUMENT);
    }).toThrowError(
      new Error(
        'Failed arguments validation for the trait callTestFunction. Cause error: Validation error'
      )
    );
  });
});
