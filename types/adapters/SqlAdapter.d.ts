/**
 * convert json schema to sequelize table schema
 * @param {Schema|object} schema
 * @returns {object} Sequelize model
 */
export function schemaToModel(schema: Schema | object): object;
/**
 * @see https://sequelize.org/docs/v6/
 */
export class SqlAdapter extends Adapter {
    constructor(options: any);
    init(options: any): Promise<void>;
    update(doc: any): Promise<any>;
    findById(id: any): Promise<any>;
    /**
     * find many items in database
     * @param {object} query
     * @returns {Promise<object[]>} found items
     */
    findMany(query: object): Promise<object[]>;
    deleteById(id: any): Promise<{
        deletedCount: any;
    }>;
}
export type Schema = import('../Schema.js').Schema;
import { Adapter } from './Adapter.js';
