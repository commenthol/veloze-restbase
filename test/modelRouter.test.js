import assert from 'node:assert'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import supertest from 'supertest'
import { Router } from 'veloze'
import { MongoAdapter } from '../src/adapters/MongoAdapter.js'
import { SqlAdapter } from '../src/adapters/SqlAdapter.js'
// import from 'pg'
import { modelRouter } from '../src/index.js'
import { Sequelize } from 'sequelize'
import { dbItems, dbItemsSchema } from './fixtures/dbitems.js'
import {
  createDatabaseMariaDb,
  createDatabasePostgres
} from './support/sqlCreateDatabase.js'

dotenv.config()

const {
  MONGODB_URL = 'mongodb://root:example@127.0.0.1:27017',
  SQLDB_USER = 'root',
  SQLDB_PASSWORD = 'example',
  SQLDB_HOST = '127.0.0.01',
  SQLDB_PORT = '5432',
  SQLDB_DIALECT = 'postgres'
} = process.env

const UNDEF_REQ_ID = '00000000-0000-0000-0000-000000000000'
const MAX_BULK_INSERTS = 1e3

function testSet(options) {
  const cache = {}

  describe('basic operations', function () {
    it('shall fail to create document', function () {
      return supertest(options.router.handle)
        .post('/items')
        .type('json')
        .send(null)
        .expect(400)
        .then(({ body }) => {
          const { reqId: _, ...others } = body
          assert.deepEqual(others, {
            status: 400,
            message: 'no document provided'
          })
        })
    })

    it('shall create new item', function () {
      return supertest(options.router.handle)
        .post('/items')
        .type('json')
        .send({ item: 'diary' })
        .expect(201)
        .then((res) => {
          // console.log(res.body)
          cache.doc = res.body
          assert.equal(res.body.item, 'diary')
        })
    })

    it('shall fail to create item with wrong type', function () {
      return supertest(options.router.handle)
        .post('/items')
        .type('json')
        .send({ item: 'folder', quantity: 12.7, width: 21, height: 30 })
        .expect(400)
        .then(({ body }) => {
          const { reqId: _, ...others } = body
          assert.deepEqual(others, {
            status: 400,
            message: 'validation error',
            errors: { '/quantity': 'must be integer' }
          })
        })
    })

    it('shall fail to update item without payload', function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const { id } = cache.doc
      return supertest(options.router.handle)
        .put(`/items/${id}`)
        .type('json')
        .expect(400)
    })

    it('shall fail to update item without id', function () {
      assert.ok(cache.doc, 'need cache from previous tests')

      if (!options.optimisticLocking) return

      return supertest(options.router.handle)
        .put('/items')
        .type('json')
        .send({ item: 'paperclip' })
        .expect(400)
    })

    it('shall fail to update item without wrong type', function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const { id, v } = cache.doc
      return supertest(options.router.handle)
        .put(`/items/${id}`)
        .type('json')
        .send({ unit: 100, v })
        .expect(400)
        .then(({ body }) => {
          // console.log(body)
          assert.equal(body.message, 'validation error')
          assert.deepEqual(body.errors, {
            item: "must have required property 'item'",
            '/unit': 'must be equal to one of the allowed values'
          })
        })
    })

    it('shall update item', function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const { doc } = cache
      const { id } = doc
      return supertest(options.router.handle)
        .put(`/items/${id}`)
        .type('json')
        .send({ ...doc, item: 'paperclip' })
        .expect(200)
        .then(({ body }) => {
          // console.log(body)
          assert.equal(body.item, 'paperclip')
          assert.equal(body.v, 2)
        })
    })

    it('shall conditionally fail using same data', function () {
      assert.ok(cache.doc, 'need cache from previous tests')

      if (!options.optimisticLocking) return

      const { doc } = cache
      const { id } = doc
      return supertest(options.router.handle)
        .put(`/items/${id}`)
        .type('json')
        .send({ ...doc, item: 'paperclip' })
        .expect(409)
    })

    it('shall find record by id', function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const { doc } = cache
      const { id } = doc
      return supertest(options.router.handle)
        .get(`/items/${id}`)
        .expect(200)
        .then(({ body }) => {
          assert.equal(body.item, 'paperclip')
        })
    })

    it('shall fail to find record by id', function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const id = 'foobar'
      return supertest(options.router.handle)
        .get(`/items/${id}`)
        .expect(404)
        .then(({ body }) => {
          assert.equal(body.message, 'Not Found')
        })
    })

    it('shall fail to delete record by id', function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const id = 'foobar'
      return supertest(options.router.handle).delete(`/items/${id}`).expect(404)
    })

    it('shall delete record by id', function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const { id } = cache.doc
      return supertest(options.router.handle).delete(`/items/${id}`).expect(204)
    })

    it('shall delete all records marked as deleted', async function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const { id } = cache.doc

      if (this.adapter.instantDeletion) return

      await this.adapter.deleteDeleted(new Date())

      if (this.adapter.adapterType === 'mongo') {
        const result = await this.adapter.model.findOne({ id })
        assert.deepEqual(result, null)
      }

      if (this.adapter.adapterType === 'sequelize') {
        const result = await this.adapter.model.findOne({ where: { id } })
        assert.deepEqual(result, null)
      }
    })
  })

  describe('find', function () {
    const cache = {}

    before(async function () {
      for (const record of dbItems) {
        // console.log(record)
        await supertest(options.router.handle)
          .post('/items')
          .type('json')
          .send(record)
          .then(() => {})
      }
    })

    it('shall find all items', async function () {
      await supertest(options.router.handle)
        .get('/items')
        .expect(200)
        .then(({ body }) => {
          cache.data = body.data
          assert.equal(body.offset, 0)
          assert.equal(body.limit, 100)
          assert.equal(body.count, undefined)
          assert.equal(Array.isArray(body.data), true)
          assert.deepEqual(body.data.map((doc) => doc.item).sort(), [
            'journal',
            'notebook',
            'paper',
            'planner',
            'postcard'
          ])
        })
    })

    it('shall find multiple ids', async function () {
      assert.ok(cache.data, 'needs previous test')
      const id = cache.data.map(({ id }) => id).filter((id, i) => i % 2)
      await supertest(options.router.handle)
        .get('/items')
        .query({ id: id.join(',') })
        .expect(200)
        .then(({ body }) => {
          // console.log(body)
          assert.equal(body.offset, 0)
          assert.equal(body.limit, 100)
          assert.equal(body.count, undefined)
          assert.equal(Array.isArray(body.data), true)
          assert.deepEqual(body.data.map((doc) => doc.item).sort(), [
            'notebook',
            'planner'
          ])
        })
    })

    it('shall find all items with count', async function () {
      await supertest(options.router.handle)
        .get('/items')
        .query({ countDocs: true })
        .expect(200)
        .then(({ body }) => {
          assert.equal(body.offset, 0)
          assert.equal(body.limit, 100)
          assert.equal(body.count, 5)
          assert.equal(Array.isArray(body.data), true)
          assert.deepEqual(body.data.map((doc) => doc.item).sort(), [
            'journal',
            'notebook',
            'paper',
            'planner',
            'postcard'
          ])
        })
    })

    it('shall find all items with an `e`', async function () {
      await supertest(options.router.handle)
        .get('/items')
        .query({ item$like: 'e' })
        .expect(200)
        .then(({ body }) => {
          assert.equal(Array.isArray(body.data), true)
          assert.deepEqual(body.data.map((doc) => doc.item).sort(), [
            'notebook',
            'paper',
            'planner'
          ])
        })
    })

    it('shall find all items without an `e`', async function () {
      await supertest(options.router.handle)
        .get('/items')
        .query({ item$like$not: 'e' })
        .expect(200)
        .then(({ body }) => {
          assert.equal(Array.isArray(body.data), true)
          assert.deepEqual(body.data.map((doc) => doc.item).sort(), [
            'journal',
            'postcard'
          ])
        })
    })

    it('shall find all items which start with a `pa`', async function () {
      const value = this.adapter.adapterType === 'mongo' ? 'Pa' : 'pa'

      await supertest(options.router.handle)
        .get('/items')
        .query({ item$starts: value })
        .expect(200)
        .then(({ body }) => {
          assert.equal(Array.isArray(body.data), true)
          assert.deepEqual(body.data.map((doc) => doc.item).sort(), ['paper'])
        })
    })

    it('shall find all items which end with a `er`', async function () {
      await supertest(options.router.handle)
        .get('/items')
        .query({ item$ends: 'er' })
        .expect(200)
        .then(({ body }) => {
          assert.equal(Array.isArray(body.data), true)
          assert.deepEqual(body.data.map((doc) => doc.item).sort(), [
            'paper',
            'planner'
          ])
        })
    })

    it('shall fail with validation error', async function () {
      await supertest(options.router.handle)
        .get('/items')
        .query({ foobar$like: 10 })
        .expect(400)
        .then(({ body }) => {
          assert.equal(body.message, 'validation error')
          assert.deepEqual(body.errors, { foobar: 'unsupported property' })
        })
    })

    it('shall sort documents', async function () {
      await supertest(options.router.handle)
        .get('/items')
        .query({ sort: 'width,height$desc' })
        .expect(200)
        .then(({ body }) => {
          assert.deepEqual(
            body.data.map(({ item, width, height }) => ({
              item,
              width,
              height
            })),
            [
              {
                height: 9,
                item: 'notebook',
                width: 11
              },
              {
                height: 8.5,
                item: 'paper',
                width: 11
              },
              {
                height: 10,
                item: 'postcard',
                width: 15.25
              },
              {
                height: 14,
                item: 'journal',
                width: 21
              },
              {
                height: 22.85,
                item: 'planner',
                width: 30
              }
            ]
          )
        })
    })

    it('shall find several documents', async function () {
      await supertest(options.router.handle)
        // .search('/items')
        .post('/items/search')
        .type('json')
        .send({
          $or: [{ item: 'journal' }, { item: { $like: 'oo' } }]
        })
        .expect(200)
        .then(({ body }) => {
          const result = body.data.map(({ item, width, height }) => ({
            item,
            width,
            height
          }))
          assert.deepEqual(result, [
            { item: 'journal', width: 21, height: 14 },
            { item: 'notebook', width: 11, height: 9 }
          ])
        })
    })

    it('shall find several documents with $and', async function () {
      await supertest(options.router.handle)
        // .search('/items')
        .post('/items/search')
        .type('json')
        .send({
          offset: 0,
          limit: 10,
          sort: [
            {
              item: 1 // sort item ascending
            },
            {
              quantity: -1 // sort count descending
            }
          ],
          fields: ['item', 'quantity'],
          $and: [
            { item: { $like: 'paper', $not: true, $cs: false } },
            { quantity: { $gt: 5, $lte: 50 } }
          ]
        })
        .expect(200)
        .then(({ body }) => {
          assert.deepEqual(body, {
            offset: 0,
            limit: 10,
            data: [
              {
                item: 'journal',
                quantity: 25
              },
              {
                item: 'notebook',
                quantity: 50
              },
              {
                item: 'postcard',
                quantity: 45
              }
            ]
          })
        })
    })

    it('shall find several documents with $and', async function () {
      await supertest(options.router.handle)
        .search('/items')
        // .post('/items/search')
        .type('json')
        .send({
          sort: [{ height: 1 }],
          fields: ['item', 'height'],
          item: ['paper', 'journal']
        })
        .expect(200)
        .then(({ body }) => {
          assert.deepEqual(body, {
            offset: 0,
            limit: 100,
            data: [
              {
                height: 8.5,
                item: 'paper'
              },
              {
                height: 14,
                item: 'journal'
              }
            ]
          })
        })
    })
  })

  describe('bulk operations', function () {
    const store = {}
    describe('POST /items/create', function () {
      it('shall fail to create multiple documents as no documents are send', function () {
        return supertest(options.router.handle)
          .post('/items/create')
          .type('json')
          .expect(400, { status: 400, message: 'No documents' })
        // .then(({ body, headers, status }) => console.log({ body, headers, status }))
      })

      it('shall fail due to bad JSON', function () {
        return supertest(options.router.handle)
          .post('/items/create')
          .type('json')
          .send('{ item: "foo"')
          .expect(400, {
            status: 400,
            message: 'Invalid JSON (Unexpected "i" at position 3 in state STOP)'
          })
      })

      it('shall fail to create multiple documents if no array of documents is send', function () {
        return supertest(options.router.handle)
          .post('/items/create')
          .type('json')
          .send({ item: 'foo' })
          .expect(400, { status: 400, message: 'No documents' })
      })

      it('shall create multiple documents', function () {
        return supertest(options.router.handle)
          .post('/items/create')
          .type('json')
          .send([
            { item: 'test-a' },
            { item: 'test-b' },
            { item: 'test-c' },
            {},
            { item: 'test-d', id: 'foo' },
            null,
            'foo'
          ])
          .expect(200)
          .then(({ body, headers }) => {
            assert.equal(typeof headers['x-request-id'], 'string')
            assert.notEqual(headers['x-request-id'], UNDEF_REQ_ID)
            assert.deepEqual(stripIds(body), [
              { item: 'test-a', v: 1, unit: 'cm' },
              { item: 'test-b', v: 1, unit: 'cm' },
              { item: 'test-c', v: 1, unit: 'cm' },
              {
                status: 400,
                message: 'validation error',
                errors: { item: "must have required property 'item'" }
              },
              { status: 400, message: 'document must not contain id' },
              {
                status: 400,
                message: 'No document'
              }
            ])
            store.create = body
              .filter((item) => !item.status)
              .map(({ item, id, v }) => ({ item, id, v }))
          })
      })

      it('shall create 1000 documents', function () {
        this.timeout(3e3)
        const payload = []
        const max = MAX_BULK_INSERTS
        for (let i = 0; i < max; i++) {
          payload.push({ item: `many${i}`, quantity: i })
        }
        const start = Date.now()
        return supertest(options.router.handle)
          .post('/items/create')
          .type('json')
          .send(payload)
          .expect(200)
          .then(() => {
            const diff = Date.now() - start
            console.log(
              '%s inserts per second',
              ((max * 1000) / diff).toFixed(2)
            )
          })
      })
    })

    describe('PUT /items', function () {
      it('shall fail to update multiple documents as no documents are send', function () {
        return supertest(options.router.handle)
          .put('/items')
          .type('json')
          .expect(400, { status: 400, message: 'No documents' })
      })

      it('shall fail to create multiple documents if no array of documents is send', function () {
        return supertest(options.router.handle)
          .post('/items/create')
          .type('json')
          .send({ item: 'foo' })
          .expect(400, { status: 400, message: 'No documents' })
      })

      it('shall update multiple documents', function () {
        assert.ok(store.create, 'need result from create test')
        const payload = store.create.map((doc) => {
          doc.item += '1'
          return doc
        })
        payload.push({}, null, 'foo')

        return supertest(options.router.handle)
          .put('/items')
          .type('json')
          .send(payload)
          .expect(200)
          .then(({ body, headers }) => {
            assert.equal(typeof headers['x-request-id'], 'string')
            assert.notEqual(headers['x-request-id'], UNDEF_REQ_ID)
            assert.deepEqual(stripIds(body), [
              {
                item: 'test-a1',
                unit: 'cm',
                v: 2
              },
              {
                item: 'test-b1',
                unit: 'cm',
                v: 2
              },
              {
                item: 'test-c1',
                unit: 'cm',
                v: 2
              },
              {
                message: 'need id parameter',
                status: 400
              },
              {
                message: 'No document',
                status: 400
              }
            ])
            store.update = true
          })
      })
    })

    describe('POST /items/delete', function () {
      it('shall fail if query is empty', function () {
        return supertest(options.router.handle)
          .post('/items/delete')
          .type('json')
          .expect(400)
      })

      it('shall fail if query is empty', function () {
        return supertest(options.router.handle)
          .post('/items/delete')
          .type('json')
          .send({})
          .expect(400)
      })

      it('shall delete items by id', function () {
        assert.ok(store.create, 'need result from create test')
        const payload = {
          id: store.create.map((doc) => doc.id)
        }
        return supertest(options.router.handle)
          .post('/items/delete')
          .type('json')
          .send(payload)
          .expect(200)
          .then(({ headers, body }) => {
            assert.equal(typeof headers['x-request-id'], 'string')
            assert.notEqual(headers['x-request-id'], UNDEF_REQ_ID)
            assert.deepEqual(body, { deletedCount: 3 })
          })
      })

      it('shall delete 1000 documents', function () {
        this.timeout(3e3)
        const max = MAX_BULK_INSERTS
        const start = Date.now()
        return supertest(options.router.handle)
          .post('/items/delete')
          .type('json')
          .send({ item: { $starts: 'many' } })
          .expect(200)
          .then(() => {
            const diff = Date.now() - start
            console.log(
              '%s deletes per second',
              ((max * 1000) / diff).toFixed(2)
            )
          })
      })
    })
  })
}

describe('modelRouter', function () {
  describe('MongoAdapter', function () {
    describe('MongoAdapter optimisticLocking=true', function () {
      const options = {}

      before(async function () {
        // create a db connection (might be reused for various routers)
        this.client = new MongoClient(MONGODB_URL)

        const database = 'test'
        try {
          const db = await this.client.db(database)
          db.createCollection('items')
        } catch (e) {
          // console.error(e)
        }

        // create db-adapter with the jsonSchema
        const adapter = (this.adapter = new MongoAdapter({
          client: this.client,
          modelName: 'items',
          database,
          jsonSchema: dbItemsSchema
        }))

        // define our rest-router based on the db-adapter
        const itemRouter = modelRouter({ adapter })
        // mount it
        options.router = new Router()
        options.router.use(itemRouter.mountPath, itemRouter.handle)

        // cleanup collection
        await this.adapter.model.deleteMany({})
        options.adapter = adapter
        options.optimisticLocking = adapter.optimisticLocking
        options.instantDeletion = adapter.instantDeletion
      })

      after(async function () {
        this.client.close()
      })

      testSet(options)
    })

    describe('MongoAdapter optimisticLocking=false instantDeletion=false', function () {
      const options = {}

      before(async function () {
        // create a db connection (might be reused for various routers)
        this.client = new MongoClient(MONGODB_URL)

        const database = 'test'
        try {
          const db = await this.client.db(database)
          db.createCollection('items')
        } catch (e) {
          // console.error(e)
        }

        // create db-adapter with the jsonSchema
        const adapter = (this.adapter = new MongoAdapter({
          client: this.client,
          modelName: 'items',
          database,
          jsonSchema: dbItemsSchema,
          optimisticLocking: false,
          instantDeletion: false
        }))

        // define our rest-router based on the db-adapter
        const itemRouter = modelRouter({ adapter })
        // mount it
        const router = (options.router = new Router())
        router.use(itemRouter.mountPath, itemRouter.handle)

        // cleanup collection
        await this.adapter.model.deleteMany({})
      })

      after(async function () {
        this.client.close()
      })

      testSet(options)
    })
  })

  describe('SqlAdapter', function () {
    const database = 'test'

    before(async function () {
      if (SQLDB_DIALECT !== 'postgres') {
        return
      }

      if (SQLDB_PORT == 26257) {
        await createDatabasePostgres({
          user: SQLDB_USER,
          password: SQLDB_PASSWORD,
          host: SQLDB_HOST,
          port: SQLDB_PORT,
          database: 'root'
        })
      }
      await createDatabasePostgres({
        user: SQLDB_USER,
        password: SQLDB_PASSWORD,
        host: SQLDB_HOST,
        port: SQLDB_PORT,
        database
      })
    })

    before(async function () {
      if (!['mariadb', 'mysql'].includes(SQLDB_DIALECT)) {
        return
      }
      await createDatabaseMariaDb({
        user: SQLDB_USER,
        password: SQLDB_PASSWORD,
        host: SQLDB_HOST,
        port: SQLDB_PORT,
        database
      })
    })

    describe('SqlAdapter optimisticLocking=true', function () {
      const options = {}

      before(async function () {
        // create a db connection (might be reused for various routers)
        this.client = new Sequelize(database, SQLDB_USER, SQLDB_PASSWORD, {
          host: SQLDB_HOST,
          port: SQLDB_PORT,
          dialect: SQLDB_DIALECT,
          logging: false
          // logging: (...msg) => console.dir(msg, { depth: null })
          // logging: (...msg) => console.log(msg)
        })

        // create db-adapter with the jsonSchema
        const adapter = (this.adapter = new SqlAdapter({
          modelName: 'items',
          database,
          jsonSchema: dbItemsSchema
        }))
        await adapter.init({ client: this.client })
        // define our rest-router based on the db-adapter
        const userRouter = modelRouter({ adapter })
        // mount it
        const router = (options.router = new Router())
        router.use(userRouter.mountPath, userRouter.handle)

        // cleanup collection
        await this.adapter.model.destroy({
          where: {},
          truncate: true
        })
      })

      after(function () {
        this.client.close()
      })

      testSet(options)
    })

    describe('SqlAdapter optimisticLocking=false instantDeletion=false', function () {
      const options = {}

      before(async function () {
        // create a db connection (might be reused for various routers)
        this.client = new Sequelize(database, SQLDB_USER, SQLDB_PASSWORD, {
          host: SQLDB_HOST,
          port: SQLDB_PORT,
          dialect: SQLDB_DIALECT,
          logging: false
          // logging: (...msg) => console.dir(msg, { depth: null })
          // logging: (...msg) => console.log(msg)
        })

        // create db-adapter with the jsonSchema
        const adapter = (this.adapter = new SqlAdapter({
          modelName: 'items',
          database,
          jsonSchema: dbItemsSchema,
          optimisticLocking: false,
          instantDeletion: false
        }))
        await adapter.init({ client: this.client })
        // define our rest-router based on the db-adapter
        const userRouter = modelRouter({ adapter })
        // mount it
        const router = (options.router = new Router())
        router.use(userRouter.mountPath, userRouter.handle)

        // cleanup collection
        await this.adapter.model.destroy({
          where: {},
          truncate: true
        })
      })

      after(function () {
        this.client.close()
      })

      testSet(options)
    })
  })
})

const stripIds = (arr) =>
  arr.map(({ id: _, createdAt: _1, updatedAt: _2, ...rest }) => rest)
