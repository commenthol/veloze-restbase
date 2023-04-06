/**
 * example requires to have a mongo database up and running
 *
 * ```sh
 * # start database with docker-compose
 * npm run dcup -- mongodb
 * docker ps
 * # run server (this file)
 * node examples/index.js
 * # make some traffic
 * node examples/traffic.js
 * ```
 */

import dotenv from 'dotenv'
import { Server } from 'veloze'

import { MongoClient } from 'mongodb'
import { modelRouter, MongoAdapter } from '../src/index.js'

// let's read env vars from a .env file
dotenv.config()
const {
  HTTP_PORT = 3000,
  MONGODB_URL = 'mongodb://root:example@127.0.0.1:27017'
} = process.env

// 1. define a JSON-schema
const jsonSchema = {
  type: 'object',
  required: [
    'item'
  ],
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
// 2. create an adapter
const client = new MongoClient(MONGODB_URL) // db driver (reuse for multiple data object)
const adapter = new MongoAdapter({
  client,
  database: 'inventory',
  modelName: 'items', // use plural form!!
  jsonSchema
})
// 3. create the rest-router
const itemsRouter = modelRouter({ adapter })
// 4. our Server
const server = new Server({ onlyHTTP1: true })
// 5. mount the router
server.use('/items', itemsRouter.handle)
// 6. start up the server
server.listen(HTTP_PORT)
console.info('server started %j', server.address())

process.on('SIGTERM', () => {
  // 7. don't forget to close the db-connection
  client.close()
})
