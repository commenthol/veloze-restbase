/**
 * @typedef {import('./types.js').Handler} Handler
 *
 * @typedef {object} Hooks
 * @property {Handler|Handler[]} [all]
 * @property {Handler|Handler[]} [create]
 * @property {Handler|Handler[]} [update]
 * @property {Handler|Handler[]} [findById]
 * @property {Handler|Handler[]} [find]
 * @property {Handler|Handler[]} [search]
 * @property {Handler|Handler[]} [deleteById]
 * @property {Handler|Handler[]} [delete]
 */
/**
 * @typedef {object} SetupRestOptions
 * @property {import('../src/adapters/Adapter.js').Adapter} adapter
 * @property {import('veloze/types').BodyParserOptions} bodyParserOpts
 * @property {Hooks} preHooks
 * @property {Hooks} postHooks
 */
/**
 * @param {SetupRestOptions} options
 * @returns {Router}
 */
export function modelRouter(options: SetupRestOptions): Router;
export type Handler = import("./types.js").Handler;
export type Hooks = {
    all?: Handler | Handler[];
    create?: Handler | Handler[];
    update?: Handler | Handler[];
    findById?: Handler | Handler[];
    find?: Handler | Handler[];
    search?: Handler | Handler[];
    deleteById?: Handler | Handler[];
    delete?: Handler | Handler[];
};
export type SetupRestOptions = {
    adapter: import("../src/adapters/Adapter.js").Adapter;
    bodyParserOpts: import("veloze/types").BodyParserOptions;
    preHooks: Hooks;
    postHooks: Hooks;
};
import { Router } from 'veloze';
