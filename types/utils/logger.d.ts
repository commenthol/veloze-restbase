export const logger: Logger;
export type LogBase = import('debug-level/types/LogBase').LogBase;
export type LogOptions = import('debug-level/types/node').LogOptions;
export type LoggerFn = (namespace: string, opts?: LogOptions | undefined) => LogBase;
export type LogFn = (namespace: string, options?: LogOptions) => LogBase;
/**
 * @typedef {import('debug-level/types/LogBase').LogBase} LogBase
 * @typedef {import('debug-level/types/node').LogOptions} LogOptions
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
declare class Logger extends EventEmitter {
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
