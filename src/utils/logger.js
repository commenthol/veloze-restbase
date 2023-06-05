import { EventEmitter } from 'node:events'
import { logger as loggerF } from 'debug-level'

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
class Logger extends EventEmitter {
  constructor () {
    super()
    this.logger = (namespace, opts) => loggerF(`veloze-restbase:${namespace || ''}`, opts)
  }

  /**
   * @param {(...args: any[]) => void} listener
   */
  register (listener) {
    super.on('log', listener)
    listener(this.logger)
    return this
  }

  /**
   * change logger function
   * @param {LogFn} fn
   */
  change (fn) {
    this.logger = fn
    this.emit('log', fn)
  }
}

export const logger = new Logger()
