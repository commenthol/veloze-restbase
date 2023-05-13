import { HttpError } from 'veloze'
import { logger, nanoid, querySchema, searchSchema } from './utils/index.js'
import { LIMIT } from './constants.js'

/**
 * @typedef {import('../src/adapters/Adapter').Adapter} Adapter
 *
 * @typedef {object} ModelAdapterOptions
 * @property {Function} [randomUuid] A random UUID function which shall guarantee a strong order on time. This is required to guarantee the order of records on querying. Do not use a function like UUIDv4 unless you ensure this ordering by other means, e.g. use createdAt timestamp together with an index. Consider the use of the provided `uuid7()` method. Defaults to `nanoid()` which gives a 24 char long time based randomized id.
 * @property {number} [limit=100]
 */

const log = logger('ModelAdapter')

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
}
