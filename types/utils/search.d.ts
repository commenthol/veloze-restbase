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
export function searchSchema(options: {
    modelSchema: Schema;
    limit?: number | undefined;
    maxItems?: number | undefined;
}): {
    validate: (body: object) => {
        errors?: {} | import("./query.js").ErrorsByField | null | undefined;
        filter?: {} | import("./query.js").FilterRule | undefined;
        findOptions?: object;
    };
};
export type ErrorsByField = import('./query.js').ErrorsByField;
export type FilterRule = import('./query.js').FilterRule;
import { Schema } from '../Schema.js';
