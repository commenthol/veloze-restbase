import Ajv from 'ajv'
import ajvFormats from 'ajv-formats'
import { logger } from './utils/index.js'

const log = logger('schema')

/**
 * @typedef {import('ajv').ErrorObject} ErrorObject
 *
 * @typedef {{[property: string]: string}} FormErrors
 *
 * @typedef {import('ajv').Options} SchemaOptions
 */

export class Schema {
  /**
   * @see https://ajv.js.org/options.html for SchemaOptions
   * @param {any} schema JSON schema
   * @param {SchemaOptions} [options]
   */
  constructor (schema, options) {
    const {
      ...ajvOpts
    } = options || {}

    const ajv = new Ajv({
      strict: true,
      allErrors: true,
      coerceTypes: true, // some databases return string instead of number
      useDefaults: true,
      removeAdditional: true,
      ...ajvOpts
    })

    ajvFormats(ajv)
    this._schema = { additionalProperties: false, ...schema }
    this._validate = ajv.compile(this._schema)

    this._doRemoveAdditional = !schema.additionalProperties
    this._types = undefined
  }

  get schema () {
    return this._schema
  }

  /**
   * get types by property names
   * @returns {{[property: string]: string}|{}}
   */
  getTypes () {
    if (this._types) {
      return this._types
    }
    const curr = {}
    for (const [prop, { type = 'string' }] of Object.entries(
      this._schema.properties
    )) {
      curr[prop] = type
    }
    this._types = curr
    return this._types
  }

  /**
   * @param {object} data
   * @returns {{
   *  validated: any
   *  errors?: FormErrors
   * }}
   */
  validate (data = {}) {
    const validated = { ...data }
    // @note this._validate modifies data object if `default` is set!
    const valid = this._validate(validated)
    if (valid) {
      return {
        validated: this._removeAdditional(validated)
      }
    }
    const errors = this._ajvToFormErrors(this._validate.errors)
    return { errors, validated }
  }

  /**
   * @private
   * @param {ErrorObject[]|null|undefined} errors
   * @returns {object|FormErrors}
   */
  _ajvToFormErrors (errors) {
    if (!errors) {
      return
    }

    const errs = {}

    for (const { instancePath, keyword, params, message } of errors) {
      // eslint-disable-next-line no-unused-vars
      let [_, field] = instancePath.split('/')
      if (keyword === 'required') {
        field = params?.missingProperty
      }

      if (!field) {
        log.debug(errors)
        log.error('no field found for instancePath:%s', instancePath)
        continue
      }

      errs[field] = message
    }

    return errs
  }

  /**
   * @private
   * @param {object|null|undefined} values
   * @returns {object}
   */
  _removeAdditional (values) {
    if (!this._doRemoveAdditional || !values) {
      return values || {}
    }
    const curr = {}
    for (const [prop, value] of Object.entries(values)) {
      if (this._schema.properties[prop]) {
        curr[prop] = value
      }
    }
    return curr
  }
}
