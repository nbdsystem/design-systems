import { Validator, type Schema } from '@cfworker/json-schema';
import data from '../data/design-systems.json' assert { type: 'json' };
import schema from '../src/schemas/design-systems.schema.json' assert { type: 'json' };

const validator = new Validator(schema as Schema);

const result = validator.validate(data);
if (result.valid === false) {
  console.log(result.errors);
  throw new Error('Invalid design-systems.json file');
}
