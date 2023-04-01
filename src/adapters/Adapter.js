import merge from 'deepmerge'
import { Schema } from '../Schema.js'

/**
 * @typedef {object} AdapterOptions
 * @property {string} modelName required name for table
 * @property {object} jsonSchema required json schema for creating table or db schema
 * @property {boolean} [optimisticLocking=true] enable optimistic locking (based on version property)
 * @property {boolean} [instantDeletion=true] if `false` do not delete immediately but set `deletedAt` timestamp
 */

/**
 * @typedef {object} Sort {[field: string]: number} where number 1 = ascending -1 = descending
 *
 * @typedef {object} FindOptions
 * @property {number} [offset] pagination offset
 * @property {number} [limit] pagination limit
 * @property {boolean} [includeCount] include document count in response
 * @property {string[]} [fields] projection fields returned
 * @property {Sort} [sort] sort order
 */

const DEFAULT_SCHEMA = {
  required: [
    'id',
    'updatedAt'
  ],
  properties: {
    id: {
      type: 'string'
    },
    version: {
      type: 'integer',
      default: 1
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
    // createdAt: {
    //   type: 'string',
    //   format: 'date-time'
    // },
    // deletedAt: {
    //   type: 'string',
    //   format: 'date-time'
    // }
  }
}

export class Adapter {
  /**
   * @param {AdapterOptions} options
   */
  constructor (options) {
    const {
      modelName,
      jsonSchema,
      optimisticLocking = true,
      instantDeletion = true
    } = options

    if (!modelName) {
      throw new Error('need modelName')
    }
    if (!jsonSchema || typeof jsonSchema !== 'object') {
      throw new Error('need jsonSchema')
    }

    this._model = null
    this._modelName = modelName
    this._schema = new Schema(merge.all([DEFAULT_SCHEMA, jsonSchema]))
    this._optimisticLocking = optimisticLocking
    this._instantDeletion = instantDeletion
  }

  /**
   * gives access to the database driver
   * @returns {any} database driver for model
   */
  get model () {
    return this._model
  }

  /**
   * @returns {string}
   */
  get modelName () {
    return this._modelName
  }

  /**
   * @returns {boolean}
   */
  get optimisticLocking () {
    return this._optimisticLocking
  }

  /**
   * @returns {boolean}
   */
  get instantDeletion () {
    return this._instantDeletion
  }

  /**
   * @returns {Schema}
   */
  get schema () {
    return this._schema
  }

  /**
   * create document in database
   * @param {object} doc
   * @returns {Promise<object>} created doc
   */
  async create (doc) {
    return doc
  }

  /**
   * update doc in database
   * @param {object} doc
   * @returns {Promise<object>} updated doc
   */
  async update (doc) {
    return doc
  }

  /**
   * find one doc in database by id
   * @param {string} id
   * @returns {Promise<object>} found doc
   */
  async findById (id) {
  }

  /**
   * find many documents in database
   * @param {object} filter filter Rules for items
   * @param {object} findOptions
   * @returns {Promise<object[]>} found items
   */
  async findMany (filter, findOptions) {
    return []
  }

  /**
   * delete document from database
   * @param {string} id
   * @returns {Promise<object>} deleted stats
   */
  async deleteById (id) {
  }

  /**
   * delete all documents with deletedAt timestamp older than date
   * @param {Date} [date] defaults to Date.now() - 30d
   * @returns {Promise<object>} deleted stats
   */
  async deleteDeleted (date) {
  }
}
