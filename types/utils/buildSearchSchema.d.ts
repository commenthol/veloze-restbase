export function buildSearchSchema(options: {
    modelSchema: Schema;
    maxItems?: number | undefined;
}): {
    jsonSchema: object;
    fieldNames: string[];
    findOptionNames: string[];
    operatorTypes: Record<string, string>;
};
export type Schema = import('../Schema.js').Schema;
