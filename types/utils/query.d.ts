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
export const NUMBER_OPS: string[];
export const STRING_OPS: string[];
export function getQuerySchema(schema: Schema): {
    querySchema: Schema;
    queryJsonSchema: object;
    operatorTypes: Record<string, string> | {};
};
export function getFilterRule(param0: {
    querySchema: Schema;
    operatorTypes: Record<string, string> | {};
    limit?: number | undefined;
}, reqQuery: Record<StringWithOperator, string>): {
    errors: ErrorsByField | null | {};
    filter: FilterRule | {};
    findOptions: object;
};
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
 */
export type StringWithOperator = string;
/**
 * errors by field
 */
export type ErrorsByField = Record<string, string>;
export type Value = string | number | boolean;
export type ValueOrRule = Value | {
    [operator: string]: Value;
};
export type FilterRule = {
    [field: string]: ValueOrRule;
};
import { Schema } from '../Schema.js';
