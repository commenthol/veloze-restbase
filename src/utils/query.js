import { LIMIT, STRING } from '../constants.js'
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

/**
 * @typedef {Record<string, string>} ErrorsByField errors by field
 *
 * @typedef {string|number|boolean} Value
 *
 * @typedef {Value|{[operator: string]: Value}} ValueOrRule
 *
 * @typedef {{[field: string]: ValueOrRule}} FilterRule
 */

const NUMBER_OPS = ['$gt', '$gte', '$lt', '$lte', '$ne']
const STRING_OPS = ['$starts', '$like', '$ends', '$not', '$cs']

export const OPERATORS = {
  number: NUMBER_OPS,
  integer: NUMBER_OPS,
  date: NUMBER_OPS,
  string: STRING_OPS
}

export const NO_OPERATOR_PROPS = [
  'offset',
  'limit',
  'fields',
  'sort',
  'countDocs'
]

/**
 * @param {object} options
 * @param {Schema} options.modelSchema
 * @param {number} [options.limit=100]
 */
export function querySchema (options) {
  const { modelSchema, limit: defaultLimit = LIMIT } = options
  const fields = Object.keys(modelSchema.getTypes())

  const queryJsonSchema = getFindOptionsSchema(fields)
  queryJsonSchema.properties.id = {
    type: 'array',
    items: {
      type: 'string'
    }
  }

  const iterator = [
    ...Object.entries(queryJsonSchema.properties),
    ...Object.entries(modelSchema.jsonSchema.properties)
  ]

  const operatorTypes = getOperatorTypes(iterator)

  for (const [field, data] of iterator) {
    const { type } = data
    // do not use `offset`, `limit`, `fields`, `sort`, 'countDocs' as table prop
    if (!queryJsonSchema.properties[field]) {
      queryJsonSchema.properties[field] = { type }
    }
  }

  const schema = new Schema(queryJsonSchema)

  /**
   * @param {Record<StringWithOperator, string>} query
   * @returns {{
   *  errors: ErrorsByField|null|{}
   *  filter: FilterRule|{}
   *  findOptions: object
   * }}
   */
  function validate (query) {
    const errors = {}
    const filter = {}
    const findOptions = { offset: 0, limit: defaultLimit }

    for (const [fieldWithOps, _value] of Object.entries(query)) {
      const [field, ...ops] = splitByOp(fieldWithOps)
      const operatorType = operatorTypes[field]

      const { errors: _errors, validated } = schema.validate({
        [field]: normalizeJson(operatorType, _value)
      })
      Object.assign(errors, _errors)

      if (NO_OPERATOR_PROPS.includes(field)) {
        findOptions[field] = validated[field]
        if (field === 'sort') {
          findOptions.sort = getSort(_value)
        }
        continue
      }

      if (!operatorType) {
        errors[field] = 'unsupported property'
        continue
      }

      const value = normalize(operatorType, _value)

      const allowedOps = OPERATORS[operatorType] || []
      filter[field] = filter[field] || {}
      if (!ops.length) {
        filter[field].$eq = value
      }
      for (const op of ops) {
        if (!allowedOps.includes(op)) {
          errors[field] = `unsupported operator ${op}`
          break
        }
        if (operatorType === STRING &&
          !['$cs', '$not'].includes(op) &&
          intersection(Object.keys(filter[field] || {}),
            ['$starts', '$like', '$ends', '$eq']).length
        ) {
          errors[field] = `duplicated string operator ${op}`
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

  return {
    schema,
    validate
  }
}

// ---- helpers ----

export const getFindOptionsSchema = (fields) => ({
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
        type: 'string',
        enum: fields
      },
      maxItems: fields.length
    },
    sort: {
      oneOf: [
        { type: 'string' },
        { type: 'array', items: { type: 'integer', enum: [-1, 1] } }
      ]
    }
  }
})

/**
 * split string by `sep` separation char. If char is double-encoded then do not
 * split the string.
 *
 * E.g. 'a,,b,c' gives ['a,b', 'c']
 *
 * @param {string} str
 * @param {*} [sep=',']
 * @returns {string[]}
 */
export const splitDoubleEnc = (str, sep = ',') => {
  const arr = []
  let tmp = ''
  for (let i = 0; i < [...str].length; i++) {
    const char = str.at(i)
    if (char !== sep) {
      tmp += char
    } else {
      if (str.at(i + 1) === char) {
        tmp += char
        i++
      } else {
        tmp = tmp.trim()
        tmp && arr.push(tmp)
        tmp = ''
      }
    }
  }
  tmp && arr.push(tmp)
  return arr
}

export const splitByOp = (str, sep = '$') =>
  str.split(sep).map((item, i) => (i === 0 ? item : `$${item}`))

/**
 * @param {Array} iterator
 * @returns {Record<string, string>|{}}
 */
export function getOperatorTypes (iterator) {
  const operatorTypes = {}
  for (const [field, data] of iterator) {
    const { type, format } = data
    if (!operatorTypes[field]) {
      operatorTypes[field] = type
      if (type === 'string' && format?.startsWith('date')) {
        operatorTypes[field] = 'date'
      }
    }
  }
  return operatorTypes
}

export const normalizeJson = (operatorType, value) => {
  switch (operatorType) {
    case 'array':
      return splitDoubleEnc(value || '')
    case 'number':
    case 'integer':
      return isNaN(Number(value)) ? value : Number(value)
    default: // date, string
      return value
  }
}

export const normalize = (operatorType, value) =>
  operatorType === 'date'
    ? new Date(value)
    : normalizeJson(operatorType, value)

export function getSort (value) {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string') {
    return value.split(',')
      .map((val) => {
        const [field, op] = splitByOp(val)
        return { [field]: op === '$desc' ? -1 : 1 }
      })
  }
}

const intersection = (arr, comp) =>
  arr.filter(item => comp.some((el) => el === item))
