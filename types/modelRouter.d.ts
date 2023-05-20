/**
 * @typedef {import('./types').Handler} Handler
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
export type Handler = import('./types').Handler;
export type Hooks = {
    all?: import("veloze/types").Handler | import("veloze/types").Handler[] | undefined;
    create?: import("veloze/types").Handler | import("veloze/types").Handler[] | undefined;
    update?: import("veloze/types").Handler | import("veloze/types").Handler[] | undefined;
    findById?: import("veloze/types").Handler | import("veloze/types").Handler[] | undefined;
    find?: import("veloze/types").Handler | import("veloze/types").Handler[] | undefined;
    search?: import("veloze/types").Handler | import("veloze/types").Handler[] | undefined;
    deleteById?: import("veloze/types").Handler | import("veloze/types").Handler[] | undefined;
    delete?: import("veloze/types").Handler | import("veloze/types").Handler[] | undefined;
};
export type SetupRestOptions = {
    adapter: import('../src/adapters/Adapter.js').Adapter;
    bodyParserOpts: import('veloze/types').BodyParserOptions;
    preHooks: Hooks;
    postHooks: Hooks;
};
import { Router } from 'veloze';
