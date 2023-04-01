import merge from 'deepmerge'
import { DataTypes } from 'sequelize'
import { Adapter } from './Adapter.js'
import { HttpError } from 'veloze'
import { logger } from '../utils/logger.js'

/**
 * @typedef {import('../Schema.js').Schema} Schema
 */

const MIN_SAFE_INTEGER = -2147483647 // (1 << 31)
const MAX_SAFE_INTEGER = 2147483647 // ~(1 << 31)

const log = logger('sqladapter')

const isNumber = num => num !== undefined && !isNaN(Number(num))
const isSafeInt = (num) => isNumber(num) && num < MAX_SAFE_INTEGER && num > MIN_SAFE_INTEGER

/**
 * @see https://sequelize.org/docs/v6/
 */
export class SqlAdapter extends Adapter {
  constructor (options) {
    const { modelName, jsonSchema, client } = options

    super({ modelName, jsonSchema })
    if (client) {
      this.init({ client })
    }
  }

  get model () {
    return this._model
  }

  async init (options) {
    const { client } = options
    await client.authenticate()

    const _schema = merge.all([
      schemaToModel(this.schema),
      {
        id: {
          primaryKey: true
        },
        version: {
          type: DataTypes.BIGINT
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
    log.debug(_schema)

    const indexes = [
      {
        fields: ['version']
      }
    ]

    this._model = client.define(this.modelName, _schema, {
      indexes,
      tableName: this.modelName,
      timestamps: false
    })

    await client.sync()
  }

  /**
   * create doc in database
   * @param {object} doc
   * @returns {Promise<object>} created doc
   */
  async create (doc) {
    doc.updatedAt = updatedAtToInt(doc)
    const result = await this._model.create(doc)
    if (!result?.dataValues) {
      throw new HttpError(500, 'document creation failed')
    }
    return fixUpdatedAtDate(result.dataValues)
  }

  async update (doc) {
    const { id, updatedAt, ..._doc } = doc
    const filter = { id, updatedAt: updatedAtToInt(doc) }
    doc.updatedAt = Date.now()
    const result = await this._model.update(_doc, { where: filter })
    if (!result) {
      throw new HttpError(500, 'document update failed')
    } else if (result[0] !== 1) {
      throw new HttpError(409)
    }
    return fixUpdatedAtDate(doc)
  }

  async findById (id) {
    const result = await this._model.findOne({ where: { id } })
    if (!result?.dataValues) {
      return
    }
    const { _id, ...other } = result.dataValues
    return other
  }

  /**
   * find many items in database
   * @param {object} query
   * @returns {Promise<object[]>} found items
   */
  async findMany (query) {
    // TODO:
    return []
  }

  async deleteById (id) {
    const result = await this._model.destroy({ where: { id } })
    if (!result) {
      throw new HttpError(404)
    }
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
export function schemaToModel (schema) {
  const _schema = schema.schema || schema
  if (!_schema) {
    throw new Error('need a schema')
  }
  if (_schema.type !== 'object') {
    throw new Error('need a schema with type equals object')
  }
  return convert(_schema)
}

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

      const useTypeInt = isSafeInt(minimum || exclusiveMinimum) ||
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
        minimum,
        exclusiveMinimum,
        maximum,
        exclusiveMaximum,
        default: _default
      } = obj

      const useTypeInt = isSafeInt(minimum || exclusiveMinimum) ||
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
          if (maxLength > 255) {
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

/**
 * extract updatedAt timestamp from document and convert to integer
 * @param {object} doc
 * @returns {number}
 */
const updatedAtToInt = (doc) => new Date(doc.updatedAt).getTime()

/**
 * convert updatedAt from integer to Date on document
 * @param {object} doc
 * @returns {object}
 */
const fixUpdatedAtDate = (doc) => {
  const { updatedAt } = doc
  doc.updatedAt = new Date(updatedAt)
  return doc
}
