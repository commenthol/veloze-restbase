import merge from 'deepmerge'
import { DataTypes, Op } from 'sequelize'
import { HttpError } from 'veloze'
import { Adapter } from './Adapter.js'
import { logger, escapeLike } from '../utils/index.js'
import { DAY } from '../constants.js'

/**
 * @typedef {import('../Schema.js').Schema} Schema
 */

const MIN_SAFE_INTEGER = -2147483647 // (1 << 31)
const MAX_SAFE_INTEGER = 2147483647 // ~(1 << 31)

const log = logger('SqlAdapter')

const isNumber = (num) => num !== undefined && !isNaN(Number(num))
const isSafeInt = (num) =>
  isNumber(num) && num <= MAX_SAFE_INTEGER && num >= MIN_SAFE_INTEGER

/**
 * @typedef {import('../types').Index} Index
 *//**
 * @typedef {object} SqlInitOptions
 * @property {import('sequelize').Sequelize} client
 * @property {Index} [indexes]
 *//**
 * @typedef {import('./Adapter').AdapterOptions} AdapterOptions
 *//**
 * @typedef {object} SqlAdapterOptionsExt
 * @property {string} database database name
 *//**
 * @typedef {AdapterOptions & SqlAdapterOptionsExt & SqlInitOptions} SqlAdapterOptions
 */

/**
 * @see https://sequelize.org/docs/v6/
 */
export class SqlAdapter extends Adapter {
  /**
   * @param {SqlAdapterOptions} options
   */
  constructor (options) {
    const {
      modelName,
      jsonSchema,
      optimisticLocking,
      instantDeletion,
      client,
      indexes
    } = options

    super({ modelName, jsonSchema, optimisticLocking, instantDeletion })
    if (client) {
      this.init({ client, indexes }).catch(err => log.error(err))
    }
    this.adapterType = 'sequelize'
  }

  /**
   * @param {SqlInitOptions} options
   */
  async init (options) {
    const { client, indexes = [] } = options
    await client.authenticate()

    const _schema = merge.all([
      schemaToModel(this.schema),
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true
        },
        version: {
          type: DataTypes.INTEGER
        },
        updatedAt: {
          type: DataTypes.DATE
        },
        createdAt: {
          type: DataTypes.DATE
        },
        deletedAt: {
          type: DataTypes.DATE
        }
      }
    ])
    log.debug('schema: %j', _schema)

    const _indexes = [
      { fields: ['version'] },
      // @ts-ignore
      ...indexes
    ]

    // @ts-expect-error
    this._model = client.define(this.modelName, _schema, {
      indexes: _indexes,
      tableName: this.modelName,
      timestamps: false
    })

    await client.sync()
  }

  async create (doc) {
    const result = await this._model.create(doc)
    if (!result?.dataValues) {
      throw new HttpError(400, 'document creation failed')
    }
    return nullToUndef(result.dataValues)
  }

  async update (doc) {
    const { id, version, ..._doc } = doc
    const filter = { id, deletedAt: null }
    if (this.optimisticLocking) {
      filter.version = version
    }
    // update date-time and version
    _doc.updatedAt = new Date()
    _doc.version = version + 1

    const result = await this._model.update(_doc, { where: filter })
    if (!result) {
      throw new HttpError(400, 'document update failed')
    } else if (result[0] !== 1) {
      throw new HttpError(409)
    }
    return _doc
  }

  async findById (id) {
    const where = { id, deletedAt: null }
    const result = await this._model.findOne({ where })
    if (!result?.dataValues) {
      return
    }
    return nullToUndef(result.dataValues)
  }

  async findMany (filter, findOptions) {
    const where = {
      ...convertFilterRule(filter),
      deletedAt: null
    }
    const findFilter = {
      ...convertFindOptions(findOptions),
      where
    }
    // console.dir(findFilter, { depth: null })
    log.debug('findMany %j', findFilter)
    const results = await this._model.findAll(findFilter)
    const obj = {
      data: toArray(results)
    }
    if (findOptions.countDocs) {
      obj.count = await this._model.count({ where })
    }
    return obj
  }

  async deleteById (id) {
    const where = { id, deletedAt: null }
    const result = this.instantDeletion
      ? await this._model.destroy({ where })
      : (await this._model.update({ deletedAt: new Date() }, { where }))?.[0]

    if (!result) {
      throw new HttpError(404)
    }
    return {
      deletedCount: result
    }
  }

  /**
   * @param {object} filter filter Rules for items
   * @returns {Promise<{
   *  deletedCount: number
   * }>}
   */
  async deleteMany (filter) {
    const where = {
      ...convertFilterRule(filter),
      deletedAt: null
    }
    log.debug('deleteMany %j', where)

    const result = this.instantDeletion
      ? await this._model.destroy({ where })
      : (await this._model.update({ deletedAt: new Date() }, { where }))?.[0]

    if (!result) {
      throw new HttpError(404)
    }
    return {
      deletedCount: result
    }
  }

  async deleteDeleted (date) {
    date = date || new Date(Date.now() - 30 * DAY)
    const result = await this._model.destroy({ where: { deletedAt: { [Op.lte]: date } } })
    return {
      deletedCount: result
    }
  }
}

/**
 * convert json schema to sequelize table schema
 * @param {Schema|object} schema
 * @returns {object} Sequelize model
 */
function schemaToModel (schema) {
  const _schema = schema.jsonSchema || schema
  if (!_schema) {
    throw new Error('need a schema')
  }
  if (_schema.type !== 'object') {
    throw new Error('need a schema with type equals object')
  }
  return convert(_schema)
}
SqlAdapter.schemaToModel = schemaToModel

/**
 * @see https://sequelize.org/docs/v6/core-concepts/model-querying-basics/
 */
function convertFilterRule (filterRule) {
  const filter = {}
  for (const [field, rules] of Object.entries(filterRule)) {
    /* c8 ignore next 4 */
    if (typeof rules !== 'object') {
      filter[field] = rules
      continue
    }

    // const isCs = !!rules.$cs
    const isNot = !!rules.$not

    let tmp
    // if (['$not'].includes(field)) {
    //   filter[field] = convertFilterRule(rules)
    //   continue
    // } else
    if (['$and', '$or'].includes(field)) {
      filter[Op[field.slice(1)]] = rules.map(rule => convertFilterRule(rule))
      continue
    }
    if (Array.isArray(rules.$eq)) {
      filter[Op.and] = filter[Op.and] || []
      filter[Op.and].push({ [Op.or]: rules.$eq.map(item => ({ [field]: item })) })
      continue
    }

    for (const [op, value] of Object.entries(rules)) {
      switch (op) {
        case '$like': {
          const _op = isNot ? Op.notLike : Op.like
          tmp = { [_op]: `%${escapeLike(value)}%` }
          break
        }
        case '$starts': {
          const v = { [Op.startsWith]: value }
          tmp = isNot ? { [Op.not]: v } : v
          break
        }
        case '$ends': {
          const v = { [Op.endsWith]: value }
          tmp = isNot ? { [Op.not]: v } : v
          break
        }
        case '$cs':
        case '$not':
        case '$eq': {
          if (tmp !== undefined) break
          switch (typeof value) {
            case 'string': {
              tmp = isNot ? { [Op.not]: value } : value
              break
            }
            default:
              // type number, boolean
              tmp = value
          }
          break
        }
        case '$lt':
        case '$lte':
        case '$gt':
        case '$gte':
        case '$ne': {
          tmp = tmp || {}
          tmp[Op[op.slice(1)]] = value
          break
        }
      }
    }
    filter[field] = tmp
  }

  return filter
}
SqlAdapter.convertFilterRule = convertFilterRule

function convertFindOptions (findOptions) {
  const { offset, limit, fields, sort } = findOptions
  const options = {
    offset: 0,
    limit: 100,
    order: [['id', 'ASC']]
  }

  if (typeof offset === 'number') {
    options.offset = offset
  }
  if (typeof limit === 'number') {
    options.limit = limit
  }
  if (Array.isArray(fields)) {
    options.attributes = fields
  }
  if (Array.isArray(sort)) {
    options.order = []
    for (const item of sort) {
      for (const [field, order] of Object.entries(item)) {
        options.order.push([field, order === 1 ? 'ASC' : 'DESC'])
      }
    }
  }

  return options
}
SqlAdapter.convertFindOptions = convertFindOptions

/**
 * conversion helper for schemaToModel
 * @param {object} obj
 * @returns {object}
 */
const convert = (obj) => {
  const { type } = obj
  switch (type) {
    case 'object': {
      // TODO: required allowNull: false
      const def = {}
      for (const [property, data] of Object.entries(obj.properties)) {
        def[property] = convert(data)
      }
      return def
    }
    case 'boolean': {
      const { default: _default } = obj
      const def = { type: DataTypes.BOOLEAN }
      if (typeof _default === 'boolean') {
        def.defaultValue = _default
      }
      return def
    }
    case 'number': {
      const {
        minimum,
        exclusiveMinimum,
        maximum,
        exclusiveMaximum,
        default: _default
      } = obj

      const useTypeInt =
        isSafeInt(minimum || exclusiveMinimum) ||
        isSafeInt(maximum || exclusiveMaximum)

      // DataTypes.FLOAT  4byte precision  0-23
      // DataTypes.DOUBLE 8byte precision 24-53
      const def = { type: useTypeInt ? DataTypes.FLOAT : DataTypes.DOUBLE }
      if (typeof _default === 'number') {
        def.defaultValue = _default
      }
      return def
    }
    case 'integer': {
      const {
        minimum = MIN_SAFE_INTEGER,
        exclusiveMinimum,
        maximum = MAX_SAFE_INTEGER,
        exclusiveMaximum,
        default: _default
      } = obj

      const useTypeInt =
        isSafeInt(minimum || exclusiveMinimum) ||
        isSafeInt(maximum || exclusiveMaximum)

      const def = { type: useTypeInt ? DataTypes.INTEGER : DataTypes.BIGINT }
      if (typeof _default === 'number' && Number.isSafeInteger(_default)) {
        def.defaultValue = _default
      }
      return def
    }
    case 'array': {
      throw new Error('type array is not supported')
    }
    default: {
      const { default: _default, format, maxLength } = obj
      const def = {}
      if (typeof _default === 'string') {
        def.defaultValue = obj.default
      }
      switch (format) {
        case 'date-time': {
          def.type = DataTypes.DATE
          break
        }
        case 'date': {
          def.type = DataTypes.DATEONLY
          break
        }
        case 'time': {
          throw new Error('type string($time) is not supported')
        }
        case 'uuid': {
          def.type = DataTypes.UUID
          break
        }
        default: {
          if (maxLength > 8000) {
            def.type = DataTypes.TEXT
          } else if (maxLength > 255) {
            def.type = DataTypes.STRING(maxLength)
          } else {
            def.type = DataTypes.STRING
          }
        }
      }
      return def
    }
  }
}

const toArray = (results) => {
  const data = []
  for (const result of results) {
    data.push(nullToUndef(result.dataValues))
  }
  return data
}

const nullToUndef = (doc) => {
  if (!doc) return
  for (const [field, value] of Object.entries(doc)) {
    if (value === null) {
      Reflect.deleteProperty(doc, field)
    }
  }
  return doc
}
