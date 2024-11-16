import assert from 'node:assert/strict'
import { buildSearchSchema } from '../../src/utils/buildSearchSchema.js'
import { Schema } from '../../src/Schema.js'

const itDisabled = () => null

describe('utils/buildSearchSchema', function () {
  let modelSchema

  before(function () {
    modelSchema = new Schema({
      type: 'object',
      properties: {
        str: { type: 'string' },
        int: { type: 'integer' },
        bool: { type: 'boolean' }
      }
    })
  })

  it('shall build schema', function () {
    const { jsonSchema, fieldNames, findOptionNames } = buildSearchSchema({
      modelSchema
    })
    assert.equal(typeof jsonSchema, 'object')
    assert.deepEqual(fieldNames, ['id', 'str', 'int', 'bool'])
    assert.deepEqual(findOptionNames, [
      'offset',
      'limit',
      'countDocs',
      'sort',
      'fields'
    ])
  })

  describe('verify with schema', function () {
    let searchSchema
    before(function () {
      const { jsonSchema } = buildSearchSchema({ modelSchema })
      searchSchema = new Schema(jsonSchema, { removeAdditional: false })
    })

    const testValid = (data, validated) => {
      const result = searchSchema.validate(data)
      // console.log(result)
      assert.ok(result.valid)
      if (validated) {
        assert.deepEqual(result.validated, validated)
      }
    }
    const testFail = (data, errors) => {
      const result = searchSchema.validate(data)
      // console.log(result)
      assert.ok(!result.valid)
      if (errors) {
        assert.deepEqual(result.errors, errors)
      }
    }

    describe('good tests', function () {
      it('str: hi', function () {
        testValid({ str: 'hi' })
      })
      it('coerce str: 7', function () {
        testValid({ str: 7 }, { str: '7' })
      })
      it('str: [hi, ho, foo]', function () {
        testValid({ str: ['hi', 'ho', 'foo'] })
      })
      it('int: 7', function () {
        testValid({ int: 7 })
      })
      it('bool: false', function () {
        testValid({ bool: false })
      })
      it('str: $like: hi', function () {
        testValid({ str: { $like: 'hi' } })
      })
      it('int: $gte: 7', function () {
        testValid({ int: { $gte: 7 } })
      })
      it('findOptions', function () {
        testValid({
          offset: 10,
          limit: 10,
          fields: ['str'],
          countDocs: true,
          sort: [{ int: -1 }]
        })
      })
      it('and rule', function () {
        testValid({ $and: [{ str: 'hi' }, { int: 7 }, { bool: true }] })
      })
      it('or rule', function () {
        testValid({ $or: [{ str: 'hi' }, { int: 7 }, { bool: true }] })
      })
      it('or rule with offset', function () {
        testValid({
          $or: [{ str: 'hi' }, { int: 7 }, { bool: true }],
          offset: 1
        })
      })
      itDisabled('not rule', function () {
        /// disable $not rule
        testValid({ $not: { str: 'hi' }, int: 7 })
      })
      itDisabled('or not rule', function () {
        /// disable $not rule
        testValid({ $or: [{ $not: { str: 'hi' }, int: 7 }] })
      })
      it('and or and not rule', function () {
        testValid({
          $and: [
            {
              $or: [
                {
                  $and: [
                    {
                      $not: { str: 'hi' },
                      $or: [{ int: { $lt: 7 } }, { int: { $gte: 1 } }]
                    }
                  ]
                }
              ]
            }
          ]
        })
      })
    })

    describe('failing tests', function () {
      it('int: hi', function () {
        testFail(
          { int: 'hi' },
          {
            '/int': 'must be integer'
          }
        )
      })
      it('int: $foo: 7', function () {
        testFail(
          { int: { $foo: 7 } },
          {
            $foo: 'must NOT have additional properties',
            '/int': 'must be integer'
          }
        )
      })
      it('bool: hi', function () {
        testFail(
          { bool: 'hi' },
          {
            '/bool': 'must be boolean'
          }
        )
      })
      it('bool: hi, offset: foo', function () {
        testFail(
          { bool: 'hi', offset: 'foo' },
          {
            '/bool': 'must be boolean',
            '/offset': 'must be integer'
          }
        )
      })
      it('additional prop ', function () {
        testFail(
          { str: 'hi', foo: 'bar' },
          {
            foo: 'must NOT have additional properties'
          }
        )
      })
      itDisabled('not additional prop', function () {
        /// disable $not rule
        testFail(
          { $not: { offset: 7 } },
          {
            $not: 'must NOT have additional properties',
            '/$not': 'must match a schema in anyOf',
            offset: 'must NOT have additional properties'
          }
        )
      })
      it('and rule with additional prop', function () {
        testFail(
          { $and: [{ str: 'hi' }, { foo: 'bar' }, { int: 7 }, { bool: true }] },
          {
            $and: 'must NOT have additional properties',
            '/$and/1': 'must match a schema in anyOf',
            foo: 'must NOT have additional properties'
          }
        )
      })
      it('and rule with additional prop 2', function () {
        testFail(
          { $and: [{ str: 'hi', foo: 'bar' }, { int: 7 }, { bool: true }] },
          {
            $and: 'must NOT have additional properties',
            '/$and/0': 'must match a schema in anyOf',
            foo: 'must NOT have additional properties'
          }
        )
      })
    })
  })
})
