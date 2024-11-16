import assert from 'node:assert/strict'
import { Schema } from '../../src/Schema.js'
import { querySchema } from '../../src/utils/query.js'
import { dbItemsSchema } from '../fixtures/dbitems.js'

describe('utils/query', function () {
  let _querySchema

  before(function () {
    const modelSchema = new Schema(dbItemsSchema)
    _querySchema = querySchema({ modelSchema })
  })

  describe('getQuerySchema()', function () {
    let schema
    before(function () {
      schema = _querySchema.schema
    })

    it('offset=0', function () {
      const { errors, validated } = schema.validate({ offset: 0 })
      assert.equal(errors, undefined)
      assert.deepEqual(validated, { offset: 0 })
    })

    it('offset=-10 fails', function () {
      const { errors } = schema.validate({ offset: -10 })
      assert.deepEqual(errors, { '/offset': 'must be >= 0' })
    })

    it('limit=0', function () {
      const { errors, validated } = schema.validate({ limit: 0 })
      assert.equal(errors, undefined)
      assert.deepEqual(validated, { limit: 0 })
    })

    it('limit=-1 fails', function () {
      const { errors } = schema.validate({ limit: -1 })
      assert.deepEqual(errors, { '/limit': 'must be > -1' })
    })

    it('limit=-10 fails', function () {
      const { errors } = schema.validate({ limit: -10 })
      assert.deepEqual(errors, { '/limit': 'must be > -1' })
    })

    it('fields=item,width', function () {
      const { errors, validated } = schema.validate({
        fields: ['item', 'width']
      })
      assert.equal(errors, undefined)
      assert.deepEqual(validated, {
        fields: ['item', 'width']
      })
    })

    it('fields=item,width,notThere fails', function () {
      const { errors } = schema.validate({
        fields: ['item', 'width', 'notThere']
      })
      assert.deepEqual(errors, {
        '/fields/2': 'must be equal to one of the allowed values'
      })
    })

    it('width=10', function () {
      const { errors } = schema.validate({ width: '10a' })
      assert.deepEqual(errors, { '/width': 'must be number' })
    })

    it('countDocs=true', function () {
      const { errors, validated } = schema.validate({ countDocs: 'true' })
      assert.deepEqual(errors, undefined)
      assert.deepEqual(validated, {
        countDocs: true
      })
    })

    it('countDocs=10', function () {
      const { errors } = schema.validate({ countDocs: 10 })
      assert.deepEqual(errors, { '/countDocs': 'must be boolean' })
    })
  })

  describe('querySchema.validate()', function () {
    it('shall extract only first string operator', function () {
      const reqQuery = {
        status: 'A',
        status$like$cs: 'D'
      }

      const result = _querySchema.validate(reqQuery)

      assert.deepEqual(result.errors, {
        status: 'duplicated string operator $like'
      })
      assert.deepEqual(result.filter, {
        status: {
          $eq: 'A'
        }
      })
      assert.deepEqual(result.findOptions, {
        limit: 100,
        offset: 0
      })
    })

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
        height: '2',
        status: 'A',
        unit$cs: 'cm',
        createdAt$gte: '2023-01-03'
      }

      const result = _querySchema.validate(reqQuery)

      assert.deepEqual(result.errors, null)
      assert.deepEqual(result.filter, {
        createdAt: {
          $gte: new Date('2023-01-03T00:00:00.000Z')
        },
        item: {
          $like: 'pap',
          $not: 'pap'
        },
        status: {
          $eq: 'A'
        },
        unit: {
          $cs: 'cm'
        },
        height: {
          $eq: 2
        },
        width: {
          $gte: 10,
          $lt: 15
        }
      })
      assert.deepEqual(result.findOptions, {
        countDocs: true,
        fields: ['item', 'width'],
        offset: 20,
        limit: 200,
        sort: [{ item: 1 }, { status: -1 }]
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

      const result = _querySchema.validate(reqQuery)

      assert.deepEqual(result.errors, {
        '/fields/2': 'must be equal to one of the allowed values',
        notThere: 'unsupported property',
        status: 'unsupported operator $notlike',
        '/width': 'must be number',
        createdAt: 'unsupported operator $like'
      })
      assert.deepEqual(result.filter, {
        createdAt: {},
        item: {
          $like: 'pap',
          $not: 'pap'
        },
        status: {
          $eq: 'A'
        },
        unit: {
          $cs: 'cm'
        },
        width: {
          $gte: '10a'
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
      const result = _querySchema.validate(reqQuery)
      assert.deepEqual(result.filter, {
        id: {
          $eq: ['10,12', '14']
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
      const modelSchema = new Schema(jsonSchema)
      const _querySchema = querySchema({ modelSchema })

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

        const result = _querySchema.validate(reqQuery)
        assert.deepEqual(result.filter, {
          ends: {
            $ends: '^End$'
          },
          equal: {
            $eq: 'EquaL'
          },
          like: {
            $like: 'lIke'
          },
          notEnds: {
            $ends: '!^End$',
            $not: '!^End$'
          },
          notEqual: {
            $not: '!EquaL'
          },
          notLike: {
            $like: '!lIke',
            $not: '!lIke'
          },
          notStarts: {
            $not: '!START$',
            $starts: '!START$'
          },
          starts: {
            $starts: 'START$'
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

        const result = _querySchema.validate(reqQuery)
        assert.deepEqual(result.errors, null)
        assert.deepEqual(result.filter, {
          ends: {
            $cs: '^End$',
            $ends: '^End$'
          },
          equal: {
            $cs: 'EquaL'
          },
          like: {
            $cs: 'lIke',
            $like: 'lIke'
          },
          notEnds: {
            $cs: '!^End$',
            $ends: '!^End$',
            $not: '!^End$'
          },
          notEqual: {
            $cs: '!EquaL',
            $not: '!EquaL'
          },
          notLike: {
            $cs: '!lIke',
            $like: '!lIke',
            $not: '!lIke'
          },
          notStarts: {
            $cs: '!START$',
            $not: '!START$',
            $starts: '!START$'
          },
          starts: {
            $cs: 'START$',
            $starts: 'START$'
          }
        })
      })
    })
  })
})
