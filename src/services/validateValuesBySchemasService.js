export const makeValidateValuesBySchemasService = ({ validatePort }) => {
  return {
    validateValuesBySchemas: ({ values, schemas }) => {
      if (schemas.length < values.length) {
        return new Error('Provided more values than schemas.');
      }
      for (let i = 0; i < schemas.length; i += 1) {
        const schema = schemas[i];
        const value = values[i];
        const validationResult = validatePort.validate({ schema, value });
        if (validationResult instanceof Error) {
          return validationResult;
        }
      }
      return undefined;
    },
  };
};
