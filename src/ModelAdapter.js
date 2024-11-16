import { HttpError } from 'veloze'
import { logger, nanoid, querySchema, searchSchema } from './utils/index.js'
import { LIMIT, MAX_BODY_LIMIT } from './constants.js'
import { ObjTransform, BodyLimit, manyError } from './utils/streams.js'
import JsonStream from '@search-dump/jsonstream'

/**
 * @typedef {import('veloze/types').Request} Request
 * @typedef {import('veloze/types').Response} Response
 *
 * @typedef {import('../src/adapters/Adapter.js').Adapter} Adapter
 *
 * @typedef {object} ModelAdapterOptions
 * @property {Function} [randomUuid] A random UUID function which shall guarantee a strong order on time. This is required to guarantee the order of records on querying. Do not use a function like UUIDv4 unless you ensure this ordering by other means, e.g. use createdAt timestamp together with an index. Consider the use of the provided `uuid7()` method. Defaults to `nanoid()` which gives a 24 char long time based randomized id.
 * @property {number} [limit=LIMIT] pagination limit
 * @property {number} [bodyLimit=10e6] max body limit for bulk create and update operations
 */

const UNDEF_REQ_ID = '00000000-0000-0000-0000-000000000000'
const CONTENT_TYPE = 'content-type'
const MIME_JSON = 'application/json; charset=utf-8'
const X_REQUEST_ID = 'x-request-id'

let log
logger.register((_logger) => {
  log = _logger('ModelAdapter')
})

export class ModelAdapter {
  /**
   * @param {Adapter} adapter
   * @param {ModelAdapterOptions} [options]
   */
  constructor(adapter, options) {
    const {
      randomUuid = nanoid,
      bodyLimit = MAX_BODY_LIMIT,
      limit = LIMIT
    } = options || {}

    this._adapter = adapter
    this._schema = adapter.schema
    this._querySchema = querySchema({ modelSchema: adapter.schema, limit })
    this._searchSchema = searchSchema({ modelSchema: adapter.schema, limit })
    this._randomUuid = randomUuid
    this._bodyLimit = bodyLimit
  }

  get modelName() {
    return this._adapter.modelName
  }

  /* c8 ignore next 3 */
  get model() {
    return this._adapter.model
  }

  /**
   * create doc
   * @param {object} doc
   * @returns {Promise<object>} created doc
   */
  async create(doc) {
    if (!doc) {
      throw new HttpError(400, 'no document provided')
    }
    /* c8 ignore next 3 */
    if (doc.id) {
      throw new HttpError(400, 'document must not contain id')
    }

    const createdAtDate = new Date()
    const _doc = {
      ...doc,
      // need ISO string for validation!
      updatedAt: createdAtDate.toISOString(),
      id: this._randomUuid(),
      v: 1
    }

    const { errors, validated } = this._schema.validate(_doc)
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
  async update(doc) {
    /* c8 ignore next 3 */
    if (!doc) {
      throw new HttpError(400)
    }
    /* c8 ignore next 3 */
    if (!doc.id) {
      throw new HttpError(400, 'need id parameter')
    }
    const { createdAt: _, ..._doc } = doc
    if (_doc.updatedAt instanceof Date) {
      // schema validation does not work with dates
      _doc.updatedAt = _doc.updatedAt.toISOString()
    }
    const { errors, validated } = this._schema.validate(_doc)
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
  async findById(id) {
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
  async findMany(query) {
    const { errors, filter, findOptions } = this._querySchema.validate(query)
    if (errors) {
      throw new HttpError(400, 'validation error', { info: errors })
    }
    log.debug('findMany %j %j', filter, findOptions)
    const data = await this._adapter.findMany(filter, findOptions)
    const { offset, limit } = findOptions
    return { offset, limit, count: data?.count, data: data?.data }
  }

  async searchMany(body) {
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
  async deleteById(id) {
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
  deleteDeleted(date) {
    return this._adapter.deleteDeleted(date)
  }

  /**
   * @param {Request} req
   * @param {Response} res
   */
  createMany(req, res) {
    const handleErr = (httpErr) => {
      let body = manyError(httpErr, res)
      if (res.headersSent) {
        body += ']'
      }
      res.end(body)
    }

    res.setHeader(CONTENT_TYPE, MIME_JSON)
    res.setHeader(X_REQUEST_ID, req.id || UNDEF_REQ_ID)

    req
      .pipe(new BodyLimit({ limit: this._bodyLimit }))
      .on('error', handleErr)
      .pipe(JsonStream.parse('.*'))
      .on('error', (err) => {
        if (err.message.startsWith('Invalid JSON')) {
          err = new HttpError(400, err.message)
        }
        handleErr(err)
      })
      .pipe(new ObjTransform({ fn: this.create.bind(this) }))
      .on('error', handleErr)
      .pipe(res)
      .on('error', handleErr)
  }

  /**
   * @param {Request} req
   * @param {Response} res
   */
  updateMany(req, res) {
    const handleErr = (httpErr) => {
      let body = manyError(httpErr, res)
      if (res.headersSent) {
        body += ']'
      }
      res.end(body)
    }

    res.setHeader(CONTENT_TYPE, MIME_JSON)
    res.setHeader(X_REQUEST_ID, req.id || UNDEF_REQ_ID)

    req
      .pipe(new BodyLimit({ limit: this._bodyLimit }))
      .on('error', handleErr)
      .pipe(JsonStream.parse('.*'))
      .on('error', (err) => {
        if (err.message.startsWith('Invalid JSON')) {
          err = new HttpError(400, err.message)
        }
        handleErr(err)
      })
      .pipe(new ObjTransform({ fn: this.update.bind(this) }))
      .on('error', handleErr)
      .pipe(res)
  }

  async deleteMany(body) {
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
