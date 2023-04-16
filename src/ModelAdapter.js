import { HttpError } from 'veloze'
import { logger, nanoid, getQuerySchema, getFilterRule } from './utils/index.js'

/**
 * @typedef {import('../src/adapters/Adapter').Adapter} Adapter
 *
 * @typedef {object} ModelAdapterOptions
 * @property {Function} [randomUuid]
 */

const log = logger('ModelAdapter')

export class ModelAdapter {
  /**
   * @param {Adapter} adapter
   * @param {ModelAdapterOptions} [options]
   */
  constructor (adapter, options) {
    const {
      randomUuid = nanoid
    } = options || {}

    this._adapter = adapter
    this._schema = adapter.schema
    this._querySchemaTypes = getQuerySchema(adapter.schema)
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
    const { errors, filter, findOptions } = getFilterRule(this._querySchemaTypes, query)
    if (errors) {
      throw new HttpError(400, 'validation error', { info: errors })
    }

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
