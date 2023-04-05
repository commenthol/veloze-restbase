import { LIMIT } from '../constants.js'
import { Schema } from '../Schema.js'

/**
 * ### numeric
 *
 * operator | description
 * ---------|------------
 * $gt      | Matches values that are greater than a specified value.
 * $gte     | Matches values that are greater than or equal to a specified value.
 * $lt      | Matches values that are less than a specified value.
 * $lte     | Matches values that are less than or equal to a specified value.
 * $ne      | Matches all values that are not equal to a specified value.
 *
 * **Example**
 * ```js
 * { // parsed query object
 *  'width$gt': 10,
 *  'width$lte': 15, // 10 < width <= 15
 *  'height$ne': 17, // height !== 17
 * }
 * ```
 *
 * ### string
 *
 * operator | description
 * ---------|------------
 * $starts  | starts-with search
 * $like    | contains
 * $ends    | ends-with search
 * $cs      | (modifier) case sensitive search; not applicable to `$regex`
 * $not     | (modifier) inverse search e.g. `field$not$like=foobar`
 *
 * **Example**
 * ```js
 * { // parsed query object
 *  'item$not$like': 'paper', // search all `item`s which do not contain `paper` case-insensitive
 *  'article$starts$cs': 'Jacket' // search all `article`s which start-witch `Jacket` case-sensitive
 * }
 * ```
 *
 * @typedef {string} StringWithOperator
 */

export const NUMBER_OPS = ['gt', 'gte', 'lt', 'lte', 'ne']
export const STRING_OPS = ['starts', 'like', 'ends', 'not', 'cs']

const OPERATORS = {
  number: NUMBER_OPS,
  integer: NUMBER_OPS,
  date: NUMBER_OPS,
  string: STRING_OPS
}

const NO_OPERATOR_PROPS = ['offset', 'limit', 'fields', 'sort', 'countDocs']

const OP_SEP = '$'

/**
 * creates a query json schema to validate correctness of values
 * @param {Schema} schema
 * @returns {{
 *  querySchema: Schema
 *  queryJsonSchema: object
 *  operatorTypes: Record<string, string>|{}
 * }}
 */
export const getQuerySchema = (schema) => {
  const fields = Object.keys(schema.getTypes())
  const queryJsonSchema = {
    type: 'object',
    properties: {
      offset: {
        type: 'integer',
        minimum: 0
      },
      limit: {
        type: 'integer',
        exclusiveMinimum: -1
      },
      countDocs: {
        type: 'boolean'
      },
      fields: {
        type: 'array',
        items: {
          enum: fields
        },
        maxItems: fields.length
      },
      sort: {
        type: 'string'
      }
    }
  }

  const operatorTypes = {}

  const iterator = [...Object.entries(queryJsonSchema.properties), ...Object.entries(schema.schema.properties)]

  for (const [field, data] of iterator) {
    const { type, format } = data
    operatorTypes[field] = type
    if (type === 'string' && format?.includes('date')) {
      operatorTypes[field] = 'date'
    }

    // do not use `offset`, `limit`, `fields`, `sort` as table prop
    if (!queryJsonSchema.properties[field]) {
      queryJsonSchema.properties[field] = { type }
    }
  }

  return {
    querySchema: new Schema(queryJsonSchema),
    queryJsonSchema,
    operatorTypes
  }
}

const normalizeJson = (operatorType, value, field) =>
  field === 'fields'
    ? String(value).split(',')
    : ['number', 'integer'].includes(operatorType)
        ? isNaN(Number(value))
          ? value
          : Number(value)
        : value

const normalize = (operatorType, value) =>
  operatorType === 'date'
    ? new Date(value)
    : normalizeJson(operatorType, value)

/**
 * @typedef {Record<string, string>} ErrorsByField errors by field
 *
 * @typedef {string|number|boolean} Value
 *
 * @typedef {Value|{[operator: string]: Value}} ValueOrRule
 *
 * @typedef {{[field: string]: ValueOrRule}} FilterRule
 */

/**
 * @param {{
 *  querySchema: Schema
 *  operatorTypes: Record<string, string>|{}
 *  limit?: number
 * }} param0
 * @param {Record<StringWithOperator, string>} reqQuery
 * @returns {{
 *  errors: ErrorsByField|null|{}
 *  filter: FilterRule|{}
 *  findOptions: object
 * }}
 */
export const getFilterRule = (param0, reqQuery) => {
  const { querySchema, operatorTypes, limit = LIMIT } = param0
  const errors = {}
  const filter = {}
  const findOptions = { offset: 0, limit }

  for (const [fieldWithOps, _value] of Object.entries(reqQuery)) {
    const [field, ...ops] = fieldWithOps.split(OP_SEP)
    const operatorType = operatorTypes[field]

    const { errors: _errors, validated } =
      querySchema.validate({ [field]: normalizeJson(operatorType, _value, field) })
    Object.assign(errors, _errors)

    if (NO_OPERATOR_PROPS.includes(field)) {
      findOptions[field] = validated[field]
      if (field === 'sort' && _value) {
        findOptions.sort = _value.split(',').reduce((curr, val) => {
          const [field, op] = val.split(OP_SEP)
          curr[field] = op === 'desc' ? -1 : 1
          return curr
        }, {})
      }
      continue
    }

    if (!operatorType) {
      errors[field] = 'unsupported property'
      continue
    }

    const value = normalize(operatorType, _value)

    const allowedOps = OPERATORS[operatorType] || []
    filter[field] = {
      type: operatorType
    }
    if (!ops.length) {
      filter[field].eq = value
    }
    for (const op of ops) {
      if (!allowedOps.includes(op)) {
        errors[field] = `unsupported operator ${op}`
        break
      }
      filter[field][op] = value
    }
  }

  return {
    errors: Object.keys(errors).length ? errors : null,
    filter,
    findOptions
  }
}
