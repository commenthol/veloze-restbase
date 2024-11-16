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
    constructor(schema: any, options?: Ajv2020.Options | undefined);
    _jsonSchema: any;
    _validate: any;
    _types: {} | undefined;
    get jsonSchema(): any;
    /**
     * get types by property names
     * @returns {{[property: string]: string}|{}}
     */
    getTypes(): {
        [property: string]: string;
    } | {};
    /**
     * @param {object} data
     * @returns {{
     *  valid: boolean
     *  validated: any
     *  errors?: FormErrors
     * }}
     */
    validate(data?: object): {
        valid: boolean;
        validated: any;
        errors?: FormErrors;
    };
    /**
     * @private
     * @param {ErrorObject[]|null|undefined} errors
     * @returns {object|FormErrors}
     */
    private _ajvToFormErrors;
}
export type ErrorObject = import("ajv").ErrorObject;
export type FormErrors = {
    [property: string]: string;
};
export type SchemaOptions = import("ajv").Options;
import Ajv2020 from 'ajv/dist/2020.js';
