export class Adapter {
    /**
     * @param {AdapterOptions} options
     */
    constructor(options: AdapterOptions);
    _model: any;
    _modelName: string;
    _schema: Schema;
    _optimisticLocking: boolean;
    _instantDeletion: boolean;
    /**
     * gives access to the database driver
     * @returns {any} database driver for model
     */
    get model(): any;
    /**
     * @returns {string}
     */
    get modelName(): string;
    /**
     * @returns {boolean}
     */
    get optimisticLocking(): boolean;
    /**
     * @returns {boolean}
     */
    get instantDeletion(): boolean;
    /**
     * @returns {Schema}
     */
    get schema(): Schema;
    /**
     * create document in database
     * @param {object} doc
     * @returns {Promise<object>} created doc
     */
    create(doc: object): Promise<object>;
    /**
     * update doc in database
     * @param {object} doc
     * @returns {Promise<object>} updated doc
     */
    update(doc: object): Promise<object>;
    /**
     * find one doc in database by id
     * @param {string} id
     * @returns {Promise<object>} found doc
     */
    findById(id: string): Promise<object>;
    /**
     * find many documents in database
     * @param {object} filter filter Rules for items
     * @param {object} findOptions
     * @returns {Promise<object>} found items
     */
    findMany(filter: object, findOptions: object): Promise<object>;
    /**
     * delete document from database
     * @param {string} id
     * @returns {Promise<object>} deleted stats
     */
    deleteById(id: string): Promise<object>;
    /**
     * delete all documents with deletedAt timestamp older than date
     * @param {Date} [date] defaults to Date.now() - 30d
     * @returns {Promise<object>} deleted stats
     */
    deleteDeleted(date?: Date | undefined): Promise<object>;
}
export type AdapterOptions = {
    /**
     * required name for table
     */
    modelName: string;
    /**
     * required json schema for creating table or db schema
     */
    jsonSchema: object;
    /**
     * enable optimistic locking (based on version property)
     */
    optimisticLocking?: boolean | undefined;
    /**
     * if `false` do not delete immediately but set `deletedAt` timestamp
     */
    instantDeletion?: boolean | undefined;
};
/**
 * {[field: string]: number} where number 1 = ascending -1 = descending
 */
export type Sort = object;
export type FindOptions = {
    /**
     * pagination offset
     */
    offset?: number | undefined;
    /**
     * pagination limit
     */
    limit?: number | undefined;
    /**
     * include document count in response
     */
    includeCount?: boolean | undefined;
    /**
     * projection fields returned
     */
    fields?: string[] | undefined;
    /**
     * sort order
     */
    sort?: Sort;
};
import { Schema } from '../Schema.js';
