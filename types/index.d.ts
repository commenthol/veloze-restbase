export { Schema } from "./Schema.js";
export { ModelAdapter } from "./ModelAdapter.js";
export { modelRouter } from "./modelRouter.js";
export { Adapter, SqlAdapter, MongoAdapter } from "./adapters/index.js";
import { Handler } from 'veloze/types'

export { Handler }

export interface JsonSchema extends Object {
}

/**
 * database index
 * @see https://sequelize.org/docs/v6/other-topics/indexes/
 * @see https://www.mongodb.com/docs/drivers/node/current/fundamentals/indexes/
 * @example 
 * // unique index, mongo and sql
 * { fields: ['otherId'], unique: true }
 * // text index, mongo only 
 * { fields: [{'item': 'text'}], default_language: 'english' }
 * // geo-spatial index, mongo only 
 * { fields: [{'location.geo': '2dsphere'}] }
 */
export interface Index {
  /**
   * fields to get indexed
   */
  fields: (string|object)[]
  /**
   * unique index
   */
  unique?: true
  /**
   * any other options
   */
  [option: string]: any
}

