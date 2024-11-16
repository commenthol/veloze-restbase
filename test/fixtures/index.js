/**
 * @see https://ajv.js.org/json-schema.html
 * @see https://github.com/ajv-validator/ajv-formats
 */
export const schema = {
  type: 'object',
  properties: {
    required: {
      type: 'boolean'
    },
    typeBoolean: {
      type: 'boolean'
    },
    typeBooleanTrue: {
      type: 'boolean',
      default: true
    },
    typeBooleanFalse: {
      type: 'boolean',
      default: false
    },
    typeNumber: {
      type: 'number'
    },
    typeNumberMinimum: {
      type: 'number',
      minimum: 1,
      default: 3.14
    },
    typeNumberMaximum: {
      type: 'number',
      maximum: 1
    },
    typeNumberExclusiveMinimum: {
      type: 'number',
      exclusiveMinimum: 1
    },
    typeNumberExclusiveMaximum: {
      type: 'number',
      exclusiveMaximum: 1
    },
    typeInteger: {
      type: 'integer'
    },
    typeIntegerMultipleOf: {
      type: 'integer',
      multipleOf: 5,
      default: 40
    },
    typeString: {
      type: 'string'
    },
    typeEmail: {
      type: 'string',
      format: 'email'
    },
    typeUri: {
      type: 'string',
      format: 'uri'
    },
    typePassword: {
      type: 'string',
      format: 'password'
    },
    pattern: {
      type: 'string',
      pattern: '[0-9]{1,2}x[0-9]{1,2}'
    },
    enum: {
      enum: ['one', 'two', 'three']
    },
    const: {
      const: 'one'
    },
    arrayOfIntegers: {
      type: 'array',
      items: {
        type: 'integer'
      }
    },
    arrayMinItemsOne: {
      minItems: 1,
      type: 'array'
    },
    arrayMinItems: {
      minItems: 2,
      type: 'array'
    },
    arrayMaxItems: {
      maxItems: 2,
      type: 'array'
    },
    uniqueArray: {
      uniqueItems: true,
      type: 'array',
      items: {
        type: 'integer'
      }
    },
    multiSelect: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: {
        enum: ['one', 'two', 'three', 'four']
      }
    }
  },
  additionalProperties: false,
  required: ['required']
}
