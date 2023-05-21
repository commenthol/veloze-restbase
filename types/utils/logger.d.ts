export function setLoggerFn(loggerFn: LoggerFn): void;
export function logger(namespace?: string | undefined, opts?: import("debug-level/types/node").LogOptions | undefined): LogBase;
export type LogBase = import('debug-level/types/LogBase').LogBase;
export type LogOptions = import('debug-level/types/node').LogOptions;
export type LoggerFn = (namespace: string, opts?: LogOptions | undefined) => LogBase;
