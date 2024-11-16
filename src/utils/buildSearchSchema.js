import {
  OBJECT,
  ARRAY,
  STRING,
  INTEGER,
  NUMBER,
  BOOLEAN,
  MAX_ITEMS
} from '../constants.js'
import { getOperatorTypes } from './query.js'
import { logger } from './logger.js'

let log
logger.register((_logger) => {
  log = _logger('utils:buildSearchSchema')
})

/**
 * @typedef {import('../Schema.js').Schema} Schema
 */

/**
 * @param {object} options
 * @param {Schema} options.modelSchema
 * @param {number} [options.maxItems=10000] array max-items
 * @returns {{
 *  jsonSchema: object
 *  fieldNames: string[]
 *  findOptionNames: string[]
 *  operatorTypes: Record<string, string>
 * }}
 */
export const buildSearchSchema = (options) => {
  const { modelSchema, maxItems = MAX_ITEMS } = options

  /** @type {string[]|[]} */
  const fieldNames = []
  const fieldProperties = {}
  const sortProperties = {}

  const iterator = [
    ['id', { type: 'string' }],
    ...Object.entries(modelSchema.jsonSchema.properties)
  ]

  const operatorTypes = getOperatorTypes(iterator)

  for (const [field, propSchema] of iterator) {
    // @ts-expect-error
    fieldNames.push(/** @type {string} */ field)
    sortProperties[field] = { type: INTEGER, enum: [-1, 1] }

    const { type } = propSchema
    switch (type) {
      case NUMBER:
      case INTEGER: {
        fieldProperties[field] = {
          oneOf: [
            propSchema,
            { type: ARRAY, maxItems, items: propSchema },
            { $ref: '#/$defs/numberOps' }
          ]
        }
        break
      }
      case 'string': {
        fieldProperties[field] = {
          oneOf: [
            propSchema,
            { type: ARRAY, maxItems, items: propSchema },
            { $ref: '#/$defs/stringOps' }
          ]
        }
        break
      }
      case BOOLEAN: {
        fieldProperties[field] = propSchema
        break
      }
      /* c8 ignore next 3 */
      default: {
        throw TypeError(`unsupported type: ${type}`)
      }
    }
  }

  const findOptionsProperties = {
    offset: { type: INTEGER, minimum: 0 },
    limit: { type: INTEGER, exclusiveMinimum: -1 },
    countDocs: { type: BOOLEAN },
    sort: {
      type: ARRAY,
      items: {
        type: OBJECT,
        additionalProperties: false,
        properties: sortProperties
      }
    },
    fields: {
      type: ARRAY,
      items: { type: STRING, enum: fieldNames },
      maxItems: fieldNames.length
    }
  }

  const findOptionNames = Object.keys(findOptionsProperties)

  const jsonSchema = {
    type: OBJECT,
    anyOf: [
      { $ref: '#/$defs/and' },
      { $ref: '#/$defs/or' },
      // { $ref: '#/$defs/not' },
      { $ref: '#/$defs/fieldsFindOptions' }
    ],
    $defs: {
      and: {
        type: OBJECT,
        required: ['$and'],
        properties: {
          $and: {
            type: ARRAY,
            items: {
              anyOf: [
                { $ref: '#/$defs/fields' },
                { $ref: '#/$defs/or' }
                // { $ref: '#/$defs/not' }
              ]
            }
          }
        }
      },
      or: {
        type: OBJECT,
        required: ['$or'],
        properties: {
          $or: {
            type: ARRAY,
            items: {
              anyOf: [
                { $ref: '#/$defs/fields' },
                { $ref: '#/$defs/and' }
                // { $ref: '#/$defs/not' }
              ]
            }
          }
        }
      },
      // not: {
      //   type: OBJECT,
      //   required: ['$not'],
      //   properties: {
      //     $not: {
      //       type: OBJECT,
      //       anyOf: [
      //         { $ref: '#/$defs/fields' },
      //         { $ref: '#/$defs/and' },
      //         { $ref: '#/$defs/or' }
      //       ]
      //     }
      //   }
      // },
      numberOps: {
        type: OBJECT,
        additionalProperties: false,
        properties: {
          $gt: { type: NUMBER },
          $gte: { type: NUMBER },
          $lt: { type: NUMBER },
          $lte: { type: NUMBER },
          $ne: { type: NUMBER },
          $eq: { type: NUMBER }
        }
      },
      stringOps: {
        type: OBJECT,
        additionalProperties: false,
        properties: {
          $like: { type: STRING },
          $starts: { type: STRING },
          $ends: { type: STRING },
          $eq: { type: STRING },
          $not: { anyOf: [{ type: STRING }, { type: BOOLEAN }] },
          $cs: { anyOf: [{ type: STRING }, { type: BOOLEAN }] }
        }
      },
      fields: {
        additionalProperties: false,
        type: OBJECT,
        properties: fieldProperties
      },
      fieldsFindOptions: {
        type: OBJECT,
        additionalProperties: false,
        properties: {
          ...fieldProperties,
          ...findOptionsProperties
        }
      }
    }
  }

  log.debug(jsonSchema)

  return { jsonSchema, fieldNames, findOptionNames, operatorTypes }
}
