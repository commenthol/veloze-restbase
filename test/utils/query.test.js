import assert from 'node:assert'
import { Schema } from '../../src/Schema.js'
import { getQuerySchema, getFilterRule } from '../../src/utils/query.js'
import { dbItemsSchema } from '../fixtures/dbitems.js'

describe('utils/query', function () {
  let querySchemaOperatorTypes
  let querySchema

  before(function () {
    const modelSchema = new Schema(dbItemsSchema)
    querySchemaOperatorTypes = getQuerySchema(modelSchema)
    querySchema = querySchemaOperatorTypes.querySchema
  })

  describe('getQuerySchema()', function () {
    it('offset=0', function () {
      const { errors, validated } = querySchema.validate({ offset: 0 })
      assert.equal(errors, undefined)
      assert.deepEqual(validated, { offset: 0 })
    })

    it('offset=-10 fails', function () {
      const { errors } = querySchema.validate({ offset: -10 })
      assert.deepEqual(errors, { offset: 'must be >= 0' })
    })

    it('limit=0', function () {
      const { errors, validated } = querySchema.validate({ limit: 0 })
      assert.equal(errors, undefined)
      assert.deepEqual(validated, { limit: 0 })
    })

    it('limit=-1 fails', function () {
      const { errors } = querySchema.validate({ limit: -1 })
      assert.deepEqual(errors, { limit: 'must be > -1' })
    })

    it('limit=-10 fails', function () {
      const { errors } = querySchema.validate({ limit: -10 })
      assert.deepEqual(errors, { limit: 'must be > -1' })
    })

    it('fields=item,width', function () {
      const { errors, validated } = querySchema.validate({
        fields: ['item', 'width']
      })
      assert.equal(errors, undefined)
      assert.deepEqual(validated, {
        fields: ['item', 'width']
      })
    })

    it('fields=item,width,notThere fails', function () {
      const { errors } = querySchema.validate({
        fields: ['item', 'width', 'notThere']
      })
      assert.deepEqual(errors, {
        fields: 'must be equal to one of the allowed values'
      })
    })

    it('width=10', function () {
      const { errors } = querySchema.validate({ width: '10a' })
      assert.deepEqual(errors, { width: 'must be number' })
    })

    it('countDocs=true', function () {
      const { errors, validated } = querySchema.validate({ countDocs: 'true' })
      assert.deepEqual(errors, undefined)
      assert.deepEqual(validated, {
        countDocs: true
      })
    })

    it('countDocs=10', function () {
      const { errors } = querySchema.validate({ countDocs: 10 })
      assert.deepEqual(errors, { countDocs: 'must be boolean' })
    })
  })

  describe('getFilterRule', function () {
    it('shall extract query parameters', function () {
      const reqQuery = {
        offset: '20',
        limit: '200',
        countDocs: 'true',
        sort: 'item,status$desc',
        fields: 'item,width',
        item$not$like: 'pap',
        width$gte: '10',
        width$lt: '15',
        status: 'A',
        status$like: 'D',
        unit$cs: 'cm',
        createdAt$gte: '2023-01-03'
      }

      const result = getFilterRule(querySchemaOperatorTypes, reqQuery)

      assert.deepEqual(result.errors, null)
      assert.deepEqual(result.filter, {
        createdAt: {
          type: 'date',
          gte: new Date('2023-01-03T00:00:00.000Z')
        },
        item: {
          type: 'string',
          like: 'pap',
          not: 'pap'
        },
        status: {
          type: 'string',
          like: 'D'
        },
        unit: {
          type: 'string',
          cs: 'cm'
        },
        width: {
          type: 'number',
          lt: 15
        }
      })
      assert.deepEqual(result.findOptions, {
        countDocs: true,
        fields: ['item', 'width'],
        offset: 20,
        limit: 200,
        sort: { item: 1, status: -1 }
      })
    })

    it('shall fail with bad query parameters', function () {
      const reqQuery = {
        fields: 'item,width,foo',
        item$not$like: 'pap',
        width$gte: '10a',
        status: 'A',
        status$notlike: 'D',
        unit$cs: 'cm',
        createdAt$like: '2023-01-03',
        notThere: 'foo'
      }

      const result = getFilterRule(querySchemaOperatorTypes, reqQuery)

      assert.deepEqual(result.errors, {
        fields: 'must be equal to one of the allowed values',
        notThere: 'unsupported property',
        status: 'unsupported operator notlike',
        width: 'must be number',
        createdAt: 'unsupported operator like'
      })
      assert.deepEqual(result.filter, {
        createdAt: {
          type: 'date'
        },
        item: {
          type: 'string',
          like: 'pap',
          not: 'pap'
        },
        status: {
          type: 'string'
        },
        unit: {
          type: 'string',
          cs: 'cm'
        },
        width: {
          type: 'number',
          gte: '10a'
        }
      })
      assert.deepEqual(result.findOptions, {
        fields: ['item', 'width', 'foo'],
        limit: 100,
        offset: 0
      })
    })

    it('id=10,,12, ,14', function () {
      const reqQuery = { id: '10,,12, ,14' }
      const result = getFilterRule(querySchemaOperatorTypes, reqQuery)
      assert.deepEqual(result.filter, {
        id: {
          eq: ['10,12', '14'],
          type: 'array'
        }
      })
    })

    describe('string variations', function () {
      const jsonSchema = {
        type: 'object',
        properties: {
          equal: { type: 'string' },
          notEqual: { type: 'string' },
          like: { type: 'string' },
          notLike: { type: 'string' },
          starts: { type: 'string' },
          notStarts: { type: 'string' },
          ends: { type: 'string' },
          notEnds: { type: 'string' }
        }
      }
      const querySchemaOperatorTypes = getQuerySchema(new Schema(jsonSchema))

      it('case insensitive', function () {
        const reqQuery = {
          equal: 'EquaL',
          notEqual$not: '!EquaL',
          like$like: 'lIke',
          notLike$not$like: '!lIke',
          starts$starts: 'START$',
          notStarts$not$starts: '!START$',
          ends$ends: '^End$',
          notEnds$not$ends: '!^End$'
        }

        const result = getFilterRule(querySchemaOperatorTypes, reqQuery)
        assert.deepEqual(result.filter, {
          ends: {
            type: 'string',
            ends: '^End$'
          },
          equal: {
            type: 'string',
            eq: 'EquaL'
          },
          like: {
            type: 'string',
            like: 'lIke'
          },
          notEnds: {
            type: 'string',
            ends: '!^End$',
            not: '!^End$'
          },
          notEqual: {
            type: 'string',
            not: '!EquaL'
          },
          notLike: {
            type: 'string',
            like: '!lIke',
            not: '!lIke'
          },
          notStarts: {
            type: 'string',
            not: '!START$',
            starts: '!START$'
          },
          starts: {
            type: 'string',
            starts: 'START$'
          }
        })
      })

      it('case sensitive', function () {
        const reqQuery = {
          equal$cs: 'EquaL',
          notEqual$not$cs: '!EquaL',
          like$cs$like: 'lIke',
          notLike$not$cs$like: '!lIke',
          starts$starts$cs: 'START$',
          notStarts$not$starts$cs: '!START$',
          ends$ends$cs: '^End$',
          notEnds$not$ends$cs: '!^End$'
        }

        const result = getFilterRule(querySchemaOperatorTypes, reqQuery)
        assert.deepEqual(result.filter, {
          ends: {
            type: 'string',
            cs: '^End$',
            ends: '^End$'
          },
          equal: {
            type: 'string',
            cs: 'EquaL'
          },
          like: {
            type: 'string',
            cs: 'lIke',
            like: 'lIke'
          },
          notEnds: {
            type: 'string',
            cs: '!^End$',
            ends: '!^End$',
            not: '!^End$'
          },
          notEqual: {
            type: 'string',
            cs: '!EquaL',
            not: '!EquaL'
          },
          notLike: {
            type: 'string',
            cs: '!lIke',
            like: '!lIke',
            not: '!lIke'
          },
          notStarts: {
            type: 'string',
            cs: '!START$',
            not: '!START$',
            starts: '!START$'
          },
          starts: {
            type: 'string',
            cs: 'START$',
            starts: 'START$'
          }
        })
      })
    })
  })
})
