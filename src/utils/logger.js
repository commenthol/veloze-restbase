import { logger as loggerF } from 'debug-level'

export const logger = (namespace, opts) => loggerF(`rest-to-db:${namespace || ''}`, opts)
