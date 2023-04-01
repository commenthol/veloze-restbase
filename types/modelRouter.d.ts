/**
 * @typedef {import('./types').Handler} Handler
 *
 * @typedef {object} Hooks
 * @property {Handler|Handler[]} [all]
 * @property {Handler|Handler[]} [create]
 * @property {Handler|Handler[]} [update]
 * @property {Handler|Handler[]} [findById]
 * @property {Handler|Handler[]} [find]
 * @property {Handler|Handler[]} [deleteById]
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
    all?: import("veloze/types/types.js").Handler | import("veloze/types/types.js").Handler[] | undefined;
    create?: import("veloze/types/types.js").Handler | import("veloze/types/types.js").Handler[] | undefined;
    update?: import("veloze/types/types.js").Handler | import("veloze/types/types.js").Handler[] | undefined;
    findById?: import("veloze/types/types.js").Handler | import("veloze/types/types.js").Handler[] | undefined;
    find?: import("veloze/types/types.js").Handler | import("veloze/types/types.js").Handler[] | undefined;
    deleteById?: import("veloze/types/types.js").Handler | import("veloze/types/types.js").Handler[] | undefined;
};
export type SetupRestOptions = {
    adapter: import('../src/adapters/Adapter.js').Adapter;
    bodyParserOpts: import('veloze/types').BodyParserOptions;
    preHooks: Hooks;
    postHooks: Hooks;
};
import { Router } from 'veloze';
