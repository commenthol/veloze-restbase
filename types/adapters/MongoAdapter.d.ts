/**
 * @see https://www.mongodb.com/docs/drivers/node/current/usage-examples/
 */
export class MongoAdapter extends Adapter {
    /**
     * @param {MongoAdapterOptions} options
     */
    constructor(options: MongoAdapterOptions);
    adapterType: string;
    _database: string;
    /**
     * @param {MongoInitOptions} options
     */
    init(options: MongoInitOptions): Promise<void>;
    create(doc: any): Promise<any>;
    update(doc: any): Promise<any>;
    findById(id: any): Promise<any>;
    deleteById(id: any): Promise<{
        deletedCount: any;
    }>;
    deleteDeleted(date: any): Promise<{
        deletedCount: any;
    }>;
}
export namespace MongoAdapter {
    export { convertFilterRule };
    export { convertFindOptions };
}
export type Index = import('../types').Index;
export type MongoInitOptions = {
    client?: import("mongodb").MongoClient | undefined;
    indexes?: import("../types").Index | undefined;
};
export type AdapterOptions = import('./Adapter').AdapterOptions;
export type MongoAdapterOptionsExt = {
    /**
     * database name
     */
    database: string;
};
export type MongoAdapterOptions = AdapterOptions & MongoAdapterOptionsExt & MongoInitOptions;
export type MongoClientUri = {
    uri: string;
    database: string;
    /**
     * MongoDb Database Index https://www.mongodb.com/basics/database-index
     */
    index: object[];
    /**
     * random id generation function
     */
    randomUuid: Function;
};
import { Adapter } from './Adapter.js';
/**
 * @see https://www.mongodb.com/docs/manual/reference/operator/query
 * @param {object} filterRule
 * @returns {object} mongo filter
 */
declare function convertFilterRule(filterRule: object): object;
/**
 * @see https://www.mongodb.com/docs/v6.0/reference/command/find/#std-label-find-cmd-sort
 * @param {{
 *  offset?: number
 *  limit?: number
 *  fields?: string[]
 *  sort?: object[]
 * }} findOptions
 * @returns {object}
 */
declare function convertFindOptions(findOptions: {
    offset?: number | undefined;
    limit?: number | undefined;
    fields?: string[] | undefined;
    sort?: any[] | undefined;
}): object;
export {};
