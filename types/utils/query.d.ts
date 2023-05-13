/**
 * @param {object} options
 * @param {Schema} options.modelSchema
 * @param {number} [options.limit=100]
 */
export function querySchema(options: {
    modelSchema: Schema;
    limit?: number | undefined;
}): {
    schema: Schema;
    validate: (query: Record<StringWithOperator, string>) => {
        errors: ErrorsByField | null | {};
        filter: FilterRule | {};
        findOptions: object;
    };
};
/**
 * @param {Array} iterator
 * @returns {Record<string, string>|{}}
 */
export function getOperatorTypes(iterator: any[]): Record<string, string> | {};
export function getSort(value: any): any[] | undefined;
export namespace OPERATORS {
    export { NUMBER_OPS as number };
    export { NUMBER_OPS as integer };
    export { NUMBER_OPS as date };
    export { STRING_OPS as string };
}
export const NO_OPERATOR_PROPS: string[];
export function getFindOptionsSchema(fields: any): {
    type: string;
    properties: {
        offset: {
            type: string;
            minimum: number;
        };
        limit: {
            type: string;
            exclusiveMinimum: number;
        };
        countDocs: {
            type: string;
        };
        fields: {
            type: string;
            items: {
                type: string;
                enum: any;
            };
            maxItems: any;
        };
        sort: {
            oneOf: ({
                type: string;
                items?: undefined;
            } | {
                type: string;
                items: {
                    type: string;
                    enum: number[];
                };
            })[];
        };
    };
};
export function splitDoubleEnc(str: any, sep?: string): string[];
export function splitByOp(str: any, sep?: string): any;
export function normalizeJson(operatorType: any, value: any): any;
export function normalize(operatorType: any, value: any): any;
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
declare const NUMBER_OPS: string[];
declare const STRING_OPS: string[];
export {};
