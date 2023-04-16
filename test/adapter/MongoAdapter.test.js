import assert from 'node:assert/strict'
import { MongoAdapter } from '../../src/adapters/MongoAdapter.js'

const { convertFilterRule, convertFindOptions } = MongoAdapter

describe('adapters/MongoAdapter', function () {
  describe('general', function () {
    it('shall throw if there is no database name', function () {
      assert.throws(() => {
        // eslint-disable-next-line no-new
        new MongoAdapter({})
      }, (err) => err.message === 'need database')
    })

    it('shall throw if there is no modelName name', function () {
      assert.throws(() => {
        // eslint-disable-next-line no-new
        new MongoAdapter({ database: 'test' })
      }, (err) => err.message === 'need modelName')
    })

    it('shall throw if there is no jsonSchema name', function () {
      assert.throws(() => {
        // eslint-disable-next-line no-new
        new MongoAdapter({ database: 'test', modelName: 'tests' })
      }, (err) => err.message === 'need jsonSchema')
    })
  })

  describe('convertFilterRule()', function () {
    describe('string operators', function () {
      const VALUE = 'vAluE$'

      it('equal', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { eq: VALUE, type: 'string' }
          }), {
            str: /^value\$$/i
          }
        )
      })

      it('equal case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { cs: VALUE, type: 'string' }
          }), {
            str: VALUE
          }
        )
      })

      it('not equal', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { not: VALUE, type: 'string' }
          }), {
            str: { $not: /^value\$$/i }
          }
        )
      })

      it('not equal case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { not: VALUE, cs: VALUE, type: 'string' }
          }), {
            str: { $not: VALUE }
          }
        )
      })

      it('like', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { like: VALUE, type: 'string' }
          }), {
            str: /value\$/i
          }
        )
      })

      it('like case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { like: VALUE, cs: VALUE, type: 'string' }
          }), {
            str: /vAluE\$/
          }
        )
      })

      it('not like', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { not: VALUE, like: VALUE, type: 'string' }
          }), {
            str: { $not: /value\$/i }
          }
        )
      })

      it('not like case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { like: VALUE, not: VALUE, cs: VALUE, type: 'string' }
          }), {
            str: { $not: /vAluE\$/ }
          }
        )
      })

      it('starts', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { starts: VALUE, type: 'string' }
          }), {
            str: /^value\$/i
          }
        )
      })

      it('starts case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { starts: VALUE, cs: VALUE, type: 'string' }
          }), {
            str: /^vAluE\$/
          }
        )
      })

      it('not starts', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { not: VALUE, starts: VALUE, type: 'string' }
          }), {
            str: { $not: /^value\$/i }
          }
        )
      })

      it('not starts case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { starts: VALUE, not: VALUE, cs: VALUE, type: 'string' }
          }), {
            str: { $not: /^vAluE\$/ }
          }
        )
      })

      it('ends', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { ends: VALUE, type: 'string' }
          }), {
            str: /value\$$/i
          }
        )
      })

      it('ends case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { ends: VALUE, cs: VALUE, type: 'string' }
          }), {
            str: /vAluE\$$/
          }
        )
      })

      it('not ends', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { not: VALUE, ends: VALUE, type: 'string' }
          }), {
            str: { $not: /value\$$/i }
          }
        )
      })

      it('not ends case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { ends: VALUE, not: VALUE, cs: VALUE, type: 'string' }
          }), {
            str: { $not: /vAluE\$$/ }
          }
        )
      })
      it('not ends case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { ends: VALUE, not: VALUE, cs: VALUE, type: 'string' }
          }), {
            str: { $not: /vAluE\$$/ }
          }
        )
      })
    })

    describe('number operators', function () {
      it('equals', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { eq: 10, type: 'number' }
          }), {
            num: 10
          }
        )
      })

      it('not equals', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { ne: 10, type: 'number' }
          }), {
            num: { $ne: 10 }
          }
        )
      })

      it('less than', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { lt: 10, type: 'number' }
          }), {
            num: { $lt: 10 }
          }
        )
      })

      it('less than equal', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { lte: 10, type: 'number' }
          }), {
            num: { $lte: 10 }
          }
        )
      })

      it('greater than', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { gt: 10, type: 'number' }
          }), {
            num: { $gt: 10 }
          }
        )
      })

      it('greater than equal', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { gte: 10, type: 'number' }
          }), {
            num: { $gte: 10 }
          }
        )
      })

      it('range', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { gt: 5, lte: 10, type: 'number' }
          }), {
            num: { $lte: 10, $gt: 5 }
          }
        )
      })
    })

    describe('array', function () {
      it('query for multiple fields', function () {
        assert.deepEqual(
          convertFilterRule({
            id: { eq: ['10', '12', '14'], type: 'array' }
          }), {
            $and: [{ $or: [{ id: '10' }, { id: '12' }, { id: '14' }] }]
          }
        )
      })
    })
  })

  describe('convertFindOptions()', function () {
    it('shall convert', function () {
      assert.deepEqual(
        convertFindOptions({
          offset: 10,
          limit: 500,
          fields: ['aa', 'foo', 'bar'],
          sort: { aa: 1, bar: 0 }
        }),
        {
          skip: 10,
          limit: 500,
          projection: { _id: 0, aa: 1, foo: 1, bar: 1 },
          sort: { aa: 1, bar: 0 }
        }
      )
    })

    it('shall ignore', function () {
      assert.deepEqual(
        convertFindOptions({
          offset: '10a',
          limit: 500,
          fields: 'aa',
          sort: 'buuh'
        }),
        {
          limit: 500,
          projection: { _id: 0 }
        }
      )
    })
  })
})
