import assert from 'assert/strict'
import { Schema } from '../src/Schema.js'
import { schema } from './fixtures/index.js'

describe('schema', function () {
  it('validate', function () {
    const compiled = new Schema(schema)

    const { errors, validated } = compiled.validate({
      required: true
    })

    assert.equal(errors, undefined)
    assert.deepEqual(validated, {
      required: true,
      typeBooleanTrue: true,
      typeBooleanFalse: false,
      typeNumberMinimum: 3.14,
      typeIntegerMultipleOf: 40
    })
  })

  it('validate with errors', function () {
    const compiled = new Schema(schema)

    const { errors, validated } = compiled.validate({
      typeBoolean: '1a',
      typeNumber: '',
      typeNumberMinimum: 0,
      typeNumberMaximum: 10,
      typeNumberExclusiveMinimum: 0,
      typeNumberExclusiveMaximum: 10,
      typeInteger: 1.1,
      typeIntegerMultipleOf: 4,
      typeString: false,
      typeEmail: 'aa',
      typeUri: 'aa',
      typePassword: '',
      pattern: 'abc',
      enum: 'foo',
      const: 'foo',
      arrayOfIntegers: [1, 2, '3.1'],
      arrayMinItemsOne: [],
      arrayMinItems: [1],
      arrayMaxItems: [1, 2, 3],
      uniqueArray: [1, 1, 1],
      additionalProp: 'remove...'
    })

    // console.log(errors)
    assert.deepEqual(errors, {
      '/arrayMaxItems': 'must NOT have more than 2 items',
      '/arrayMinItems': 'must NOT have fewer than 2 items',
      '/arrayMinItemsOne': 'must NOT have fewer than 1 items',
      '/arrayOfIntegers/2': 'must be integer',
      '/const': 'must be equal to constant',
      '/enum': 'must be equal to one of the allowed values',
      '/pattern': 'must match pattern "[0-9]{1,2}x[0-9]{1,2}"',
      required: "must have required property 'required'",
      '/typeBoolean': 'must be boolean',
      '/typeEmail': 'must match format "email"',
      '/typeInteger': 'must be integer',
      '/typeIntegerMultipleOf': 'must be multiple of 5',
      '/typeNumber': 'must be number',
      '/typeNumberExclusiveMaximum': 'must be < 1',
      '/typeNumberExclusiveMinimum': 'must be > 1',
      '/typeNumberMaximum': 'must be <= 1',
      '/typeNumberMinimum': 'must be >= 1',
      '/typeUri': 'must match format "uri"',
      '/uniqueArray':
        'must NOT have duplicate items (items ## 2 and 1 are identical)'
    })
    // console.log(data)
    assert.deepEqual(validated, {
      typeBoolean: '1a',
      typeNumber: '',
      typeNumberMinimum: 0,
      typeNumberMaximum: 10,
      typeNumberExclusiveMinimum: 0,
      typeNumberExclusiveMaximum: 10,
      typeInteger: 1.1,
      typeIntegerMultipleOf: 4,
      typeString: 'false',
      typeEmail: 'aa',
      typeUri: 'aa',
      typePassword: '',
      pattern: 'abc',
      enum: 'foo',
      const: 'foo',
      arrayOfIntegers: [1, 2, '3.1'],
      arrayMinItemsOne: [],
      arrayMinItems: [1],
      arrayMaxItems: [1, 2, 3],
      uniqueArray: [1, 1, 1],
      typeBooleanTrue: true,
      typeBooleanFalse: false
    })
  })

  it('get types', function () {
    const compiled = new Schema(schema)

    assert.deepEqual(compiled.getTypes(), {
      arrayMaxItems: 'array',
      arrayMinItems: 'array',
      arrayMinItemsOne: 'array',
      arrayOfIntegers: 'array',
      const: 'string',
      enum: 'string',
      multiSelect: 'array',
      pattern: 'string',
      required: 'boolean',
      typeBoolean: 'boolean',
      typeBooleanFalse: 'boolean',
      typeBooleanTrue: 'boolean',
      typeEmail: 'string',
      typeInteger: 'integer',
      typeIntegerMultipleOf: 'integer',
      typeNumber: 'number',
      typeNumberExclusiveMaximum: 'number',
      typeNumberExclusiveMinimum: 'number',
      typeNumberMaximum: 'number',
      typeNumberMinimum: 'number',
      typePassword: 'string',
      typeString: 'string',
      typeUri: 'string',
      uniqueArray: 'array'
    })
  })

  it('remove additional properties', function () {
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        string: { type: 'string' }
      }
    }
    const compiled = new Schema(schema)
    const { errors, validated } = compiled.validate({ two: 12 })

    assert.equal(errors, undefined)
    assert.deepEqual(validated, {})
  })
})
