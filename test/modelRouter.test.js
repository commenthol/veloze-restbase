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

function testSet (options) {
  const cache = {}

  describe('basic operations', function () {
    it('shall fail to create document', function () {
      return supertest(options.router.handle)
        .post('/items')
        .type('json')
        .send(null)
        .expect(400)
        .then(({ body }) => {
          const { reqId, ...others } = body
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
          const { reqId, ...others } = body
          assert.deepEqual(others, {
            status: 400,
            message: 'validation error',
            errors: { quantity: 'must be integer' }
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
        .expect(404)
    })

    it('shall fail to update item without wrong type', function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const { id, version } = cache.doc
      return supertest(options.router.handle)
        .put(`/items/${id}`)
        .type('json')
        .send({ unit: 100, version })
        .expect(400)
        .then(({ body }) => {
          // console.log(body)
          assert.equal(body.message, 'validation error')
          assert.deepEqual(body.errors, {
            item: "must have required property 'item'",
            unit: 'must be equal to one of the allowed values'
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
          assert.equal(body.version, 2)
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
      return supertest(options.router.handle)
        .delete(`/items/${id}`)
        .expect(404)
    })

    it('shall delete record by id', function () {
      assert.ok(cache.doc, 'need cache from previous tests')
      const { id } = cache.doc
      return supertest(options.router.handle)
        .delete(`/items/${id}`)
        .expect(204)
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
          .then(() => { })
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
        const router = (options.router = new Router())
        router.use(itemRouter.mountPath, itemRouter.handle)

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
      // eslint-disable-next-line eqeqeq
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
