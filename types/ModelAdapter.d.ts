export class ModelAdapter {
    /**
     * @param {Adapter} adapter
     * @param {ModelAdapterOptions} [options]
     */
    constructor(adapter: Adapter, options?: ModelAdapterOptions | undefined);
    _adapter: import("../src/adapters/Adapter").Adapter;
    _schema: import("./Schema.js").Schema;
    _querySchema: {
        schema: import("./Schema.js").Schema;
        validate: (query: Record<string, string>) => {
            errors: {} | import("./utils/query.js").ErrorsByField | null;
            filter: {} | import("./utils/query.js").FilterRule;
            findOptions: any;
        };
    };
    _searchSchema: {
        validate: (body: any) => {
            errors?: {} | import("./utils/query.js").ErrorsByField | null | undefined;
            filter?: {} | import("./utils/query.js").FilterRule | undefined;
            findOptions?: any;
        };
    };
    _randomUuid: Function;
    get modelName(): string;
    get model(): any;
    /**
     * create doc
     * @param {object} doc
     * @returns {Promise<object>} created doc
     */
    create(doc: object): Promise<object>;
    /**
     * update doc
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
     * find many items in database
     * @param {object} query
     * @returns {Promise<object>} found items
     */
    findMany(query: object): Promise<object>;
    searchMany(body: any): Promise<{
        offset: any;
        limit: any;
        count: any;
        data: any;
    }>;
    /**
     * delete doc from database
     * @param {string} id
     * @returns {Promise<object>}
     */
    deleteById(id: string): Promise<object>;
}
export type Adapter = import('../src/adapters/Adapter').Adapter;
export type ModelAdapterOptions = {
    randomUuid?: Function | undefined;
    limit?: number | undefined;
};
