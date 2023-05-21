import { HttpError } from 'veloze'
import { logger, nanoid, querySchema, searchSchema } from './utils/index.js'
import { LIMIT } from './constants.js'
import { Transform } from 'node:stream'
import JsonStream from '@search-dump/jsonstream'

/**
 * @typedef {import('veloze/types').Request} Request
 * @typedef {import('veloze/types').Response} Response
 *
 * @typedef {import('../src/adapters/Adapter').Adapter} Adapter
 *
 * @typedef {object} ModelAdapterOptions
 * @property {Function} [randomUuid] A random UUID function which shall guarantee a strong order on time. This is required to guarantee the order of records on querying. Do not use a function like UUIDv4 unless you ensure this ordering by other means, e.g. use createdAt timestamp together with an index. Consider the use of the provided `uuid7()` method. Defaults to `nanoid()` which gives a 24 char long time based randomized id.
 * @property {number} [limit=100]
 */

let log

export class ModelAdapter {
  /**
   * @param {Adapter} adapter
   * @param {ModelAdapterOptions} [options]
   */
  constructor (adapter, options) {
    const {
      randomUuid = nanoid,
      limit = LIMIT
    } = options || {}

    log = log || logger('ModelAdapter')

    this._adapter = adapter
    this._schema = adapter.schema
    this._querySchema = querySchema({ modelSchema: adapter.schema, limit })
    this._searchSchema = searchSchema({ modelSchema: adapter.schema, limit })
    this._randomUuid = randomUuid
  }

  get modelName () {
    return this._adapter.modelName
  }

  /* c8 ignore next 3 */
  get model () {
    return this._adapter.model
  }

  /**
   * create doc
   * @param {object} doc
   * @returns {Promise<object>} created doc
   */
  async create (doc) {
    if (!doc) {
      throw new HttpError(400, 'no document provided')
    }
    /* c8 ignore next 3 */
    if (doc.id) {
      throw new HttpError(400, 'document must not contain id')
    }

    const createdAtDate = new Date()
    // need ISO string for validation!
    doc.updatedAt = createdAtDate.toISOString()
    doc.id = this._randomUuid()
    doc.version = 1

    const { errors, validated } = this._schema.validate(doc)
    log.debug({ create: true, errors, validated })
    if (errors) {
      throw new HttpError(400, 'validation error', { info: errors })
    }

    validated.createdAt = createdAtDate
    validated.updatedAt = createdAtDate
    const createdItem = await this._adapter.create(validated)
    return createdItem
  }

  /**
   * update doc
   * @param {object} doc
   * @returns {Promise<object>} updated doc
   */
  async update (doc) {
    /* c8 ignore next 3 */
    if (!doc) {
      throw new HttpError(400)
    }
    /* c8 ignore next 3 */
    if (!doc.id) {
      throw new HttpError(400, 'need id parameter')
    }

    Reflect.deleteProperty(doc, 'createdAt')
    const { errors, validated } = this._schema.validate(doc)
    log.debug({ update: true, errors, validated })
    if (errors) {
      throw new HttpError(400, 'validation error', { info: errors })
    }

    const updatedItem = await this._adapter.update(validated)
    return updatedItem
  }

  /**
   * find one doc in database by id
   * @param {string} id
   * @returns {Promise<object>} found doc
   */
  async findById (id) {
    /* c8 ignore next 3  */
    if (!id) {
      throw new HttpError(400, 'need id parameter')
    }
    const found = await this._adapter.findById(id)
    if (!found) {
      throw new HttpError(404)
    }
    return found
  }

  /**
   * find many items in database
   * @param {object} query
   * @returns {Promise<object>} found items
   */
  async findMany (query) {
    const { errors, filter, findOptions } = this._querySchema.validate(query)
    if (errors) {
      throw new HttpError(400, 'validation error', { info: errors })
    }
    log.debug('findMany %j %j', filter, findOptions)
    const data = await this._adapter.findMany(filter, findOptions)
    const { offset, limit } = findOptions
    return { offset, limit, count: data?.count, data: data?.data }
  }

  async searchMany (body) {
    const { errors, filter, findOptions } = this._searchSchema.validate(body)
    if (errors) {
      throw new HttpError(400, 'validation error', { info: errors })
    }
    log.debug('searchMany %j %j', filter, findOptions)
    const data = await this._adapter.findMany(filter, findOptions)
    const { offset, limit } = findOptions
    return { offset, limit, count: data?.count, data: data?.data }
  }

  /**
   * delete doc from database
   * @param {string} id
   * @returns {Promise<object>}
   */
  async deleteById (id) {
    /* c8 ignore next 3 */
    if (!id) {
      throw new HttpError(400, 'need id parameter')
    }
    const found = await this._adapter.deleteById(id)
    if (!found || !found.deletedCount) {
      throw new HttpError(404)
    }
    return found
  }

  /**
   * delete all documents with deletedAt timestamp older than date
   * @param {Date} [date] defaults to Date.now() - 30d
   * @returns {Promise<object>} deleted stats
   */
  deleteDeleted (date) {
    return this._adapter.deleteDeleted(date)
  }

  // TODO: limit body size
  /**
   * @param {Request} req
   * @param {Response} res
   */
  createMany (req, res) {
    const transform = new ObjTransform({ res, fn: this.create.bind(this) })
    res.setHeader(CONTENT_TYPE, MIME_JSON)
    res.setHeader(X_REQUEST_ID, req.id || UNDEF_REQ_ID)
    const jsonStream = JsonStream.parse('.*')
    jsonStream.on('error', () => {
      res.end(manyError(new HttpError(400, 'Invalid JSON'), res))
    })
    req.pipe(jsonStream).pipe(transform).pipe(res)
  }

  // TODO: limit body size
  /**
   * @param {Request} req
   * @param {Response} res
   */
  updateMany (req, res) {
    const transform = new ObjTransform({ res, fn: this.update.bind(this) })
    res.setHeader(CONTENT_TYPE, MIME_JSON)
    res.setHeader(X_REQUEST_ID, req.id || UNDEF_REQ_ID)
    const jsonStream = JsonStream.parse('.*')
    jsonStream.on('error', () => {
      res.end(manyError(new HttpError(400, 'Invalid JSON'), res))
    })
    req.pipe(jsonStream).pipe(transform).pipe(res)
  }

  async deleteMany (body) {
    const { errors, filter } = this._searchSchema.validate(body)
    if (errors || !Object.keys(filter || {}).length) {
      // @ts-expect-error
      throw new HttpError(400, 'validation error', { info: errors })
    }
    log.debug('deleteMany %j', filter)
    const data = await this._adapter.deleteMany(filter)
    return data
  }
}

const UNDEF_REQ_ID = '00000000-0000-0000-0000-000000000000'
const CONTENT_TYPE = 'content-type'
const MIME_JSON = 'application/json; charset=utf-8'
const X_REQUEST_ID = 'x-request-id'

class ObjTransform extends Transform {
  constructor ({ res, fn }) {
    super({ objectMode: true })
    this.res = res
    this.fn = fn
    this.cnt = 0
  }

  async _transform (chunk, encoding, callback) {
    const { cnt, res, fn } = this
    if (cnt === 0) {
      if (typeof chunk !== 'object') {
        res.write(manyError(new HttpError(400, 'No documents'), res))
        this.push(null)
        callback()
        return
      }
      this.push('[')
    } else {
      this.push(', ')
    }
    if (typeof chunk !== 'object') {
      this.push(manyError(new HttpError(400, 'No document')))
      callback()
      return
    }
    this.cnt++
    try {
      const result = await fn(chunk)
      this.push(JSON.stringify(result))
    } catch (/** @type {Error|any} */ err) {
      this.push(manyError(err))
    }
    callback()
  }

  _flush () {
    const { cnt, res } = this
    if (cnt) {
      this.push(']')
    } else {
      res.write(manyError(new HttpError(400, 'No documents'), res))
    }
    this.push(null)
  }
}

/**
 * @param {HttpError} err
 * @param {import('node:http').ServerResponse} [res]
 * @returns {string}
 */
function manyError (err, res) {
  const status = err.status || 500
  const message = err.status ? err.message : 'General Error'
  const errors = err.info
  if (res) res.statusCode = status
  log[status < 500 ? 'warn' : 'error'](err)
  return JSON.stringify({ status, message, errors })
}
