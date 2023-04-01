/**
 * @see https://sequelize.org/docs/v6/
 */
export class SqlAdapter extends Adapter {
    constructor(options: any);
    adapterType: string;
    init(options: any): Promise<void>;
    update(doc: any): Promise<any>;
    findById(id: any): Promise<any>;
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
import { Adapter } from './Adapter.js';
/**
 * convert json schema to sequelize table schema
 * @param {Schema|object} schema
 * @returns {object} Sequelize model
 */
declare function schemaToModel(schema: Schema | object): object;
/**
 * see https://sequelize.org/docs/v6/core-concepts/model-querying-basics/
 */
declare function convertFilterRule(filterRule: any): {};
declare function convertFindOptions(findOptions: any): {
    offset: number;
    limit: number;
    attributes: any[];
    order: any[];
};
export {};
