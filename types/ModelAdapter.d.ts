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
    /**
     * delete all documents with deletedAt timestamp older than date
     * @param {Date} [date] defaults to Date.now() - 30d
     * @returns {Promise<object>} deleted stats
     */
    deleteDeleted(date?: Date | undefined): Promise<object>;
    /**
     * @param {Request} req
     * @param {Response} res
     */
    createMany(req: Request, res: Response): void;
    /**
     * @param {Request} req
     * @param {Response} res
     */
    updateMany(req: Request, res: Response): void;
    deleteMany(body: any): Promise<{
        deletedCount: number;
    }>;
}
export type Request = import('veloze/types').Request;
export type Response = import('veloze/types').Response;
export type Adapter = import('../src/adapters/Adapter').Adapter;
export type ModelAdapterOptions = {
    /**
     * A random UUID function which shall guarantee a strong order on time. This is required to guarantee the order of records on querying. Do not use a function like UUIDv4 unless you ensure this ordering by other means, e.g. use createdAt timestamp together with an index. Consider the use of the provided `uuid7()` method. Defaults to `nanoid()` which gives a 24 char long time based randomized id.
     */
    randomUuid?: Function | undefined;
    limit?: number | undefined;
};
