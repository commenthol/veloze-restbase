export const logger: Logger;
export type LogBase = import("debug-level").Log;
export type LogOptions = import("debug-level").LogOptions;
export type LoggerFn = (namespace: string, opts?: LogOptions | undefined) => LogBase;
export type LogFn = (namespace: string, options?: LogOptions) => LogBase;
/**
 * @typedef {import('debug-level').Log} LogBase
 * @typedef {import('debug-level').LogOptions} LogOptions
 * @typedef {(namespace: string, opts?: LogOptions | undefined) => LogBase} LoggerFn
 * @typedef {(namespace: string, options?: LogOptions) => LogBase} LogFn
 */
/**
 * @example
 * let log
 * logger.register(_logger => {
 *   log = _logger('namespace')
 * })
 */
declare class Logger extends EventEmitter<[never]> {
    constructor();
    logger: (namespace: any, opts: any) => any;
    /**
     * @param {(...args: any[]) => void} listener
     */
    register(listener: (...args: any[]) => void): this;
    /**
     * change logger function
     * @param {LogFn} fn
     */
    change(fn: LogFn): void;
}
import { EventEmitter } from 'node:events';
export {};
