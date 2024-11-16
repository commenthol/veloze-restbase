import { Server } from 'veloze'
import supertest from 'supertest'
import { MongoClient } from 'mongodb'
import { modelRouter, MongoAdapter } from '../src/index.js'

const {
  HTTP_PORT = 3000,
  MONGODB_URL = 'mongodb://root:example@127.0.0.1:27017'
} = process.env

const url = `http://127.0.0.1:${HTTP_PORT}`

const jsonSchema = {
  type: 'object',
  required: ['item'],
  properties: {
    item: {
      type: 'string',
      maxLength: 255
    },
    quantity: {
      type: 'integer',
      minimum: 0,
      default: 0
    }
  }
}

const ITEMS = ['paper', 'scissor', 'stone', 'bicycle', 'rabbit', 'turtle']
const randomInt = (max) => Math.floor(Math.random() * max)
const randomItem = () => ({
  item: ITEMS[randomInt(ITEMS.length)],
  quantity: randomInt(100)
})
const randomItems = (num = 1000) =>
  new Array(num).fill(1).map(() => randomItem())

const create = (agent, data) =>
  agent
    .post('/items')
    .type('json')
    .send(data)
    .then((res) => res.body)

const bulkCreate = (agent, data) =>
  agent
    .post('/items/create')
    .type('json')
    .send(data)
    .then((res) => res.body)

const find = (agent, query) =>
  agent
    .get('/items')
    .query(query)
    .accept('json')
    .then((res) => res.body)

describe.skip('performance tests', function () {
  let server
  let client
  before(function () {
    client = new MongoClient(MONGODB_URL) // db driver
  })
  after(function () {
    client.close()
  })
  before(function () {
    const adapter = new MongoAdapter({
      client,
      database: 'performance',
      modelName: 'items', // use plural form!!
      jsonSchema
    })
    const itemsRouter = modelRouter({ adapter })
    server = new Server({ onlyHTTP1: true })
    server.use('/items', itemsRouter.handle)
    server.listen(HTTP_PORT)
  })
  after(function () {
    server.close()
  })

  it('create items', async function () {
    this.timeout(7e3)
    const agent = supertest.agent(url)
    let cnt = 0
    const duration = 5e3
    const end = Date.now() + duration
    while (Date.now() < end) {
      cnt++
      await create(agent, randomItem())
    }
    const reqPerSec = ((cnt * 1000) / duration).toFixed(1)
    console.log(`${reqPerSec} creates per second`)
  })

  it('find items', async function () {
    this.timeout(7e3)
    const agent = supertest.agent(url)
    let cnt = 0
    const duration = 5e3
    const end = Date.now() + duration
    while (Date.now() < end) {
      cnt++
      const { item } = randomItem()
      // eslint-disable-next-line no-unused-vars
      const res = await find(agent, { item })
      // console.log(item, res.data.length)
    }
    const reqPerSec = ((cnt * 1000) / duration).toFixed(1)
    console.log(`${reqPerSec} finds per second`)
  })

  it('bulk create items', async function () {
    this.timeout(7e3)
    const agent = supertest.agent(url)
    const max = 100
    let cnt = 0
    const duration = 5e3
    const end = Date.now() + duration
    while (Date.now() < end) {
      cnt++
      // eslint-disable-next-line no-unused-vars
      const res = await bulkCreate(agent, randomItems(max))
      // console.log(res)
    }
    const reqPerSec = (cnt * 1000) / duration
    console.log(
      `${reqPerSec.toFixed(1)} bulk creates per second (${(reqPerSec * max).toFixed(1)})`
    )
  })
})
