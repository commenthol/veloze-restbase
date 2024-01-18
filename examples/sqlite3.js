/**
 * Example using Modeladapter to store data according to schema
 *
 * needs sqlite3 installed
 */

// import * as sqlite3 from 'sqlite3'
import { Sequelize } from 'sequelize'
import { ModelAdapter, SqlAdapter } from '../src/index.js'
import { fileURLToPath } from 'url'

const STORAGE_PATH = fileURLToPath(new URL('./db.sqlite', import.meta.url))

const nap = (ms = 100) =>
  new Promise((resolve) => setTimeout(() => resolve(ms), ms))

// 1. define a JSON-schema
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
const indexes = [{ fields: ['item'], unique: true }]

// 2. create sqlite adapter
const database = 'inventory'
const client = new Sequelize({
  database,
  dialect: 'sqlite',
  // dialectModule: sqlite3,
  storage: STORAGE_PATH,
  logging: false
})
// creates db if not exists
await client.sync()
await client.authenticate()

const adapter = new SqlAdapter({
  database,
  modelName: 'items',
  optimisticLocking: true,
  jsonSchema,
  indexes
})
await adapter.init({ client })
adapter.close = async () => {
  await nap()
}

// 3. create the model
const itemsModel = new ModelAdapter(adapter)

// create some entries
let quantity = 0
for (const item of ['paper', 'stone', 'scissor']) {
  await itemsModel.create({ item, quantity }).catch(console.error)
  quantity++
}

// search all items which contain "e"
const allWithE = (await itemsModel.findMany({ item$like: 'e' }))?.data
console.log(allWithE)

// update 1st item
const first = allWithE[0]
const updated = await itemsModel.update({ ...first, quantity: 100 })
console.log(updated)

// delete all items
const all = (await itemsModel.findMany({ fields: ['id'] }))?.data
const ids = all.reduce((acc, { id }) => {
  acc.push(id)
  return acc
}, [])
const deleted = await itemsModel.deleteMany({ id: ids })
console.log(deleted)
