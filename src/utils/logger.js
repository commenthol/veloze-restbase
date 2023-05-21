import { logger as loggerFn } from 'debug-level'

/**
 * @typedef {import('debug-level/types/LogBase').LogBase} LogBase
 * @typedef {import('debug-level/types/node').LogOptions} LogOptions
 * @typedef {(namespace: string, opts?: LogOptions | undefined) => LogBase} LoggerFn
 */

let loggerF = loggerFn

/**
 * overwrite logger function
 * @param {LoggerFn} loggerFn
 */
export const setLoggerFn = (loggerFn) => {
  loggerF = loggerFn
}

/**
 * @param {string} [namespace]
 * @param {import('debug-level/types/node').LogOptions} [opts]
 * @returns {LogBase}
 */
export const logger = (namespace, opts) =>
  loggerF(`veloze-restbase:${namespace || ''}`, opts)
