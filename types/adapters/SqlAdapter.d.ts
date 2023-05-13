/**
 * @typedef {import('../types').Index} Index
 */ /**
* @typedef {object} SqlInitOptions
* @property {import('sequelize').Sequelize} client
* @property {Index} [indexes]
*/ /**
* @typedef {import('./Adapter').AdapterOptions} AdapterOptions
*/ /**
* @typedef {object} SqlAdapterOptionsExt
* @property {string} database database name
*/ /**
* @typedef {AdapterOptions & SqlAdapterOptionsExt & SqlInitOptions} SqlAdapterOptions
*/
/**
 * @see https://sequelize.org/docs/v6/
 */
export class SqlAdapter extends Adapter {
    /**
     * @param {SqlAdapterOptions} options
     */
    constructor(options: SqlAdapterOptions);
    adapterType: string;
    /**
     * @param {SqlInitOptions} options
     */
    init(options: SqlInitOptions): Promise<void>;
    create(doc: any): Promise<any>;
    update(doc: any): Promise<any>;
    findById(id: any): Promise<any>;
    findMany(filter: any, findOptions: any): Promise<{
        data: any[];
    }>;
    deleteById(id: any): Promise<{
        deletedCount: any;
    }>;
    deleteDeleted(date: any): Promise<{
        deletedCount: any;
    }>;
}
export namespace SqlAdapter {
    export { schemaToModel };
    export { convertFilterRule };
    export { convertFindOptions };
}
export type Schema = import('../Schema.js').Schema;
export type Index = import('../types').Index;
export type SqlInitOptions = {
    client: import('sequelize').Sequelize;
    indexes?: import("../types").Index | undefined;
};
export type AdapterOptions = import('./Adapter').AdapterOptions;
export type SqlAdapterOptionsExt = {
    /**
     * database name
     */
    database: string;
};
export type SqlAdapterOptions = AdapterOptions & SqlAdapterOptionsExt & SqlInitOptions;
import { Adapter } from './Adapter.js';
/**
 * convert json schema to sequelize table schema
 * @param {Schema|object} schema
 * @returns {object} Sequelize model
 */
declare function schemaToModel(schema: Schema | object): object;
/**
 * @see https://sequelize.org/docs/v6/core-concepts/model-querying-basics/
 */
declare function convertFilterRule(filterRule: any): {};
declare function convertFindOptions(findOptions: any): {
    offset: number;
    limit: number;
    order: string[][];
};
export {};
