import Ajv2020 from 'ajv/dist/2020.js'

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

    const ajv = new Ajv2020({
      strict: true,
      allErrors: true,
      coerceTypes: true, // some databases return string instead of number
      useDefaults: true,
      removeAdditional: true,
      ...ajvOpts
    })

    ajvFormats(ajv)
    ajv.addKeyword('$anchor')
    this._jsonSchema = schema
    this._validate = ajv.compile(this._jsonSchema)

    this._types = undefined
  }

  get jsonSchema () {
    return this._jsonSchema
  }

  /**
   * get types by property names
   * @returns {{[property: string]: string}|{}}
   */
  getTypes () {
    /* c8 ignore next 3 */
    if (this._types) {
      return this._types
    }
    const curr = {}
    for (const [prop, { type = 'string' }] of Object.entries(
      this._jsonSchema.properties
    )) {
      curr[prop] = type
    }
    this._types = curr
    return this._types
  }

  /**
   * @param {object} data
   * @returns {{
   *  valid: boolean
   *  validated: any
   *  errors?: FormErrors
   * }}
   */
  validate (data = {}) {
    const validated = structuredClone(data)
    // @note this._validate modifies data object if `default` is set!
    const valid = this._validate(validated)
    if (valid) {
      return { valid, validated }
    }
    const errors = this._ajvToFormErrors(this._validate.errors)
    return { valid, errors, validated }
  }

  /**
   * @private
   * @param {ErrorObject[]|null|undefined} errors
   * @returns {object|FormErrors}
   */
  _ajvToFormErrors (errors) {
    /* c8 ignore next 3 */
    if (!errors) {
      return
    }

    const errs = {}

    log.debug(errors)

    for (const { instancePath, keyword, params, message } of errors) {
      // eslint-disable-next-line no-unused-vars
      let field = instancePath
      switch (keyword) {
        case 'required':
          field = params?.missingProperty
          break
        case 'additionalProperties':
          field = params?.additionalProperty
          break
      }

      if (!field) {
        log.debug(errors)
        continue
      }
      if (message?.startsWith('must have required property \'$')) {
        continue
      }

      errs[field] = errs[field] || message
    }

    return errs
  }
}
