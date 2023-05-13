import merge from 'deepmerge'
import { Schema } from '../Schema.js'
import { buildSearchSchema } from './buildSearchSchema.js'
import { LIMIT, MAX_ITEMS } from '../constants.js'

/**
 * @typedef {import('./query.js').ErrorsByField} ErrorsByField
 * @typedef {import('./query.js').FilterRule} FilterRule
 */

/**
 * @param {object} options
 * @param {Schema} options.modelSchema
 * @param {number} [options.limit=100]
 * @param {number} [options.maxItems=10000]
 */
export function searchSchema (options) {
  const {
    modelSchema,
    limit = LIMIT,
    maxItems = MAX_ITEMS
  } = options

  const { jsonSchema, findOptionNames } =
    buildSearchSchema({ modelSchema, maxItems })
  const searchSchema = new Schema(jsonSchema, { removeAdditional: false })

  const walkObj = (obj) => {
    let filter = {}
    for (const [field, value] of Object.entries(obj)) {
      filter = merge(filter, walk(field, value))
    }
    return filter
  }

  function walk (field, value) {
    const filter = {}

    if (Array.isArray(value)) {
      const arr = []
      for (let i = 0; i < value.length; i++) {
        const item = value[i]
        if (item && typeof item === 'object') {
          const filter = walkObj(item)
          arr.push(filter)
        } else if (item !== undefined) {
          arr.push({ [field]: { $eq: item } })
        }
      }
      if (['$or', '$and'].includes(field)) {
        filter[field] = (filter[field] || []).concat(arr)
      } else {
        filter.$or = (filter.$or || []).concat(arr)
      }
    } else if (value && typeof value === 'object') {
      filter[field] = walkObj(value)
    } else {
      filter[field] = value
    }

    return filter
  }

  /**
   * @param {object} body
   * @returns {{
   *  errors?: ErrorsByField|null|{}
   *  filter?: FilterRule|{}
   *  findOptions?: object
   * }}
   */
  function validate (body) {
    let filter = {}
    const findOptions = { offset: 0, limit }

    const { valid, validated, errors } = searchSchema.validate(body)
    if (!valid) {
      return { errors }
    }

    for (const [field, value] of Object.entries(validated)) {
      if (findOptionNames.includes(field)) {
        findOptions[field] = value
        continue
      }
      filter = merge(filter, walk(field, value))
    }

    return {
      filter,
      findOptions
    }
  }

  return {
    validate
  }
}
