import assert from 'node:assert/strict'
import { Schema } from '../../src/Schema.js'
import { searchSchema } from '../../src/utils/search.js'
import { dbItemsSchema } from '../fixtures/dbitems.js'

const itDisabled = () => null

describe('utils/search', function () {
  let _searchSchema

  before(function () {
    const modelSchema = new Schema(dbItemsSchema)
    _searchSchema = searchSchema({ modelSchema })
  })

  describe('getSearchRule()', function () {
    it('array to or rule', function () {
      const body = { atem: 'a' }
      const result = _searchSchema.validate(body)
      assert.deepEqual(result, {
        errors: { atem: 'must NOT have additional properties' }
      })
    })

    it('array to or rule', function () {
      const body = { id: ['a', 'b'], offset: 1 }
      const result = _searchSchema.validate(body)
      assert.deepEqual(result, {
        filter: {
          $or: [{ id: { $eq: 'a' } }, { id: { $eq: 'b' } }]
        },
        findOptions: { offset: 1, limit: 100 }
      })
    })

    it('array to or rule with number and string', function () {
      const body = { count: [2, 4], width: [1.2, 3.14], id: ['a'], limit: 10 }
      const result = _searchSchema.validate(body)
      assert.deepEqual(result, {
        errors: { count: 'must NOT have additional properties' }
      })
    })

    itDisabled('not rule', function () {
      /// disable $not rule
      const body = { $not: { id: 'a' }, limit: 10 }
      const result = _searchSchema.validate(body)
      assert.deepEqual(result, {
        filter: { $not: { id: { $eq: 'a', type: 'string' } } },
        findOptions: { offset: 0, limit: 10 }
      })
    })

    it('array to or rule with $ne', function () {
      const body = {
        $and: [{ id: ['a', 'b'] }, { height: { $ne: 5 } }]
      }
      const result = _searchSchema.validate(body)
      assert.deepEqual(result, {
        filter: {
          $and: [
            {
              $or: [{ id: { $eq: 'a' } }, { id: { $eq: 'b' } }]
            },
            { height: { $ne: 5 } }
          ]
        },
        findOptions: { offset: 0, limit: 100 }
      })
    })

    it('combined and-or rule', function () {
      const body = {
        $and: [{ id: ['a', 'b'] }, { width: 5 }]
      }
      const result = _searchSchema.validate(body)
      assert.deepEqual(result, {
        filter: {
          $and: [
            {
              $or: [{ id: { $eq: 'a' } }, { id: { $eq: 'b' } }]
            },
            { width: 5 }
          ]
        },
        findOptions: { offset: 0, limit: 100 }
      })
    })
  })
})
