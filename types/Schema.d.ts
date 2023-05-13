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
    constructor(schema: any, options?: import("ajv").Options | undefined);
    _schema: any;
    _validate: import("ajv").ValidateFunction<unknown>;
    _types: {} | undefined;
    get schema(): any;
    /**
     * get types by property names
     * @returns {{[property: string]: string}|{}}
     */
    getTypes(): {} | {
        [property: string]: string;
    };
    /**
     * @param {object} data
     * @returns {{
     *  validated: any
     *  errors?: FormErrors
     * }}
     */
    validate(data?: object): {
        validated: any;
        errors?: FormErrors | undefined;
    };
    /**
     * @private
     * @param {ErrorObject[]|null|undefined} errors
     * @returns {object|FormErrors}
     */
    private _ajvToFormErrors;
}
export type ErrorObject = import('ajv').ErrorObject;
export type FormErrors = {
    [property: string]: string;
};
export type SchemaOptions = import('ajv').Options;
