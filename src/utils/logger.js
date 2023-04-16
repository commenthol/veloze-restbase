import { logger as loggerF } from 'debug-level'

export const logger = (namespace, opts) => loggerF(`veloze-restbase:${namespace || ''}`, opts)
