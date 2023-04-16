import { Adapter } from './Adapter.js'
import { HttpError } from 'veloze'
import { escapeRegExp, logger } from '../utils/index.js'
import { DAY } from '../constants.js'

const log = logger('MongoAdapter')

/**
 * @typedef {import('../types').Index} Index
 *//**
 * @typedef {object} MongoInitOptions
 * @property {import('mongodb/mongodb').MongoClient} [client]
 * @property {Index} [indexes]
 *//**
 * @typedef {import('./Adapter').AdapterOptions} AdapterOptions
 *//**
 * @typedef {object} MongoAdapterOptionsExt
 * @property {string} database database name
 *//**
 * @typedef {AdapterOptions & MongoAdapterOptionsExt & MongoInitOptions} MongoAdapterOptions
 *//**
 * @typedef {object} MongoClientUri
 * @property {string} uri
 * @property {string} database
 * @property {object[]} index MongoDb Database Index https://www.mongodb.com/basics/database-index
 * @property {function} randomUuid random id generation function
 */

/**
 * @see https://www.mongodb.com/docs/drivers/node/current/usage-examples/
 */
export class MongoAdapter extends Adapter {
  /**
   * @param {MongoAdapterOptions} options
   */
  constructor (options) {
    const {
      modelName,
      jsonSchema,
      optimisticLocking,
      instantDeletion,
      database,
      client,
      indexes
    } = options

    if (!database) {
      throw new Error('need database')
    }
    super({ modelName, jsonSchema, optimisticLocking, instantDeletion })

    this.adapterType = 'mongo'
    this._database = database
    if (client) {
      this.init({ client, indexes }).catch(err => log.error(err))
    }
  }

  /**
   * @param {MongoInitOptions} options
   */
  async init (options) {
    const { client, indexes = [] } = options
    // @ts-expect-error
    this._model = client.db(this._database).collection(this.modelName)
    // always create index on id and version

    const _indexes = [
      { fields: ['id'], unique: true },
      { fields: ['version'] },
      // @ts-ignore
      ...indexes
    ]

    for (const { fields, ...options } of _indexes) {
      const _fields = fields.reduce((curr, field) => {
        if (typeof field === 'object') {
          Object.assign(curr, field)
        } else {
          curr['' + field] = 1
        }
        return curr
      }, {})
      log.debug('createIndex(%j, %j)', _fields, options)

      await this._model.createIndex(_fields, { background: true, ...options })
    }
  }

  async create (doc) {
    const result = await this._model.insertOne({ ...doc })
    if (!result?.acknowledged) {
      throw new HttpError(400, 'document creation failed')
    }
    return doc
  }

  async update (doc) {
    const { id, updatedAt, version, ..._doc } = doc
    const filter = { id, deletedAt: { $exists: false } }
    if (this.optimisticLocking) {
      filter.version = version
    }
    // update date-time and version
    _doc.updatedAt = new Date()
    _doc.version = version + 1

    const result = await this._model.updateOne(filter, { $set: _doc })
    if (!result?.acknowledged) {
      throw new HttpError(400, 'document update failed')
    } else if (!result.modifiedCount) {
      throw new HttpError(409)
    }
    return { id, ..._doc }
  }

  async findById (id) {
    const result = await this._model.findOne(
      { id, deletedAt: { $exists: false } },
      { projection: { _id: 0 } }
    )
    if (!result) {
      return
    }
    return result
  }

  /**
   * find many items in database
   * @see https://www.mongodb.com/docs/v6.0/tutorial/query-documents/
   * @param {object} filter filter Rules for items
   * @param {object} findOptions
   * @returns {Promise<object>} found items
   */
  async findMany (filter, findOptions) {
    const _filter = {
      ...convertFilterRule(filter),
      deletedAt: { $exists: false }
    }
    const _findOptions = convertFindOptions(findOptions)
    const cursor = await this._model.find(_filter, _findOptions)
    const obj = {}
    obj.data = await cursor.toArray()
    if (findOptions.countDocs) {
      obj.count = await this._model.countDocuments(_filter)
    }
    return obj
  }

  async deleteById (id) {
    const result = this.instantDeletion
      ? await this._model.deleteOne({ id })
      : await this._model.updateOne({ id }, { $set: { deletedAt: new Date() } })

    if (!result?.acknowledged) {
      throw new HttpError(404)
    }
    return {
      deletedCount: result.deletedCount || result.modifiedCount
    }
  }

  async deleteDeleted (date) {
    date = date || new Date(Date.now() - 30 * DAY)
    const result = await this._model.deleteMany({ deletedAt: { $lte: date } })
    return {
      deletedCount: result?.deletedCount || 0
    }
  }
}

/**
 * @param {object} filterRule
 * @returns {object} mongo filter
 */
const convertFilterRule = (filterRule) => {
  const filter = {}
  for (const [field, rules] of Object.entries(filterRule)) {
    /* c8 ignore next 4 */
    if (typeof rules !== 'object') {
      filter[field] = rules
      continue
    }

    const isCs = !!rules.cs
    const isNot = !!rules.not
    const type = rules.type

    let tmp
    if (type === 'array') {
      if (Array.isArray(rules.eq)) {
        filter.$and = filter.$and || []
        filter.$and.push({ $or: rules.eq.map(item => ({ [field]: item })) })
      }
      continue
    } else if (type === 'string') {
      for (const [op, value] of Object.entries(rules)) {
        const esc = escapeRegExp(isCs ? value : value.toLowerCase())

        switch (op) {
          case 'like': {
            const re = new RegExp(esc, isCs ? '' : 'i')
            tmp = isNot ? { $not: re } : re
            break
          }
          case 'starts': {
            const re = new RegExp('^' + esc, isCs ? '' : 'i')
            tmp = isNot ? { $not: re } : re
            break
          }
          case 'ends': {
            const re = new RegExp(esc + '$', isCs ? '' : 'i')
            tmp = isNot ? { $not: re } : re
            break
          }
          case 'cs':
          case 'eq':
          case 'not': {
            if (tmp) break
            const re = isCs ? value : new RegExp('^' + esc + '$', 'i')
            tmp = isNot ? { $not: re } : re
            break
          }
        }
      }
    } else {
      // 'number', 'date'
      tmp = {}
      for (const [op, value] of Object.entries(rules)) {
        if (op === 'type') {
          continue
        }
        if (op === 'eq') {
          tmp = value
          break
        }
        tmp['$' + op] = value
      }
    }

    filter[field] = tmp
  }

  return filter
}
MongoAdapter.convertFilterRule = convertFilterRule

/**
 * @see https://www.mongodb.com/docs/v6.0/reference/command/find/#std-label-find-cmd-sort
 * @param {{
 *  offset?: number
 *  limit?: number
 *  fields?: string[]
 *  sort?: ??
 * }} findOptions
 * @returns {object}
 */
const convertFindOptions = (findOptions) => {
  const { offset, limit, fields, sort } = findOptions
  const options = {
    projection: { _id: 0 }
  }

  if (typeof offset === 'number') {
    options.skip = offset
  }
  if (typeof limit === 'number') {
    options.limit = limit
  }
  if (Array.isArray(fields)) {
    for (const field of fields) {
      options.projection[field] = 1
    }
  }
  if (sort && typeof sort === 'object') {
    options.sort = sort
  }

  return options
}
MongoAdapter.convertFindOptions = convertFindOptions
