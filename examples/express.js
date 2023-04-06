/**
 * example requires to have a postgres database up and running
 *
 * ```sh
 * # start database with docker-compose
 * npm run dcup -- postgres
 * docker ps
 * # run server (this file)
 * node examples/express.js
 * # make some traffic
 * node examples/traffic.js
* ```
 */

import dotenv from 'dotenv'
import express from 'express'

import pg from 'pg'
import { Sequelize } from 'sequelize'
import { modelRouter, SqlAdapter } from '../src/index.js'

// let's read env vars from a .env file
dotenv.config()
const {
  HTTP_PORT = 3000,
  SQLDB_USER = 'root',
  SQLDB_PASSWORD = 'example',
  SQLDB_HOST = '127.0.0.01',
  SQLDB_PORT = '5432',
  SQLDB_DIALECT = 'postgres'
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
const database = 'inventory'
try {
  const client = new pg.Client({
    user: SQLDB_USER,
    password: SQLDB_PASSWORD,
    host: SQLDB_HOST,
    port: SQLDB_PORT,
    database: 'postgres'
  })
  client.connect()
  await client.query(`CREATE DATABASE ${database}`)
  client.end()
} catch (e) {
  if (e.message !== `database "${database}" already exists`) {
    throw e
  }
}

const client = new Sequelize(
  database, SQLDB_USER, SQLDB_PASSWORD, {
    host: SQLDB_HOST,
    port: SQLDB_PORT,
    dialect: SQLDB_DIALECT,
    logging: false
    // logging: (...msg) => console.log(msg)
  })
const adapter = new SqlAdapter({
  client,
  database: 'inventory',
  modelName: 'items', // use plural form!!
  jsonSchema
})
// 3. create the rest-router
const itemsRouter = modelRouter({ adapter })
// 4. our application
const app = express()
// 5. mount the router
app.use('/items', itemsRouter.handle)
// 6. start up the server
const server = app.listen(HTTP_PORT)
console.info('server started %j', server.address())

process.on('SIGTERM', () => {
  // 7. don't forget to close the db-connection
  client.close()
})
