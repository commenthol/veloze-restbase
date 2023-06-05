import { HttpError } from 'veloze'
import { logger } from './index.js'
import { Transform } from 'node:stream'

let log
logger.register(_logger => {
  log = _logger('util:streams')
})

/**
 * @param {HttpError} err
 * @param {import('node:http').ServerResponse} [res]
 * @returns {string}
 */
export function manyError (err, res) {
  const status = err.status || 500
  const message = err.status ? err.message : 'General Error'
  const errors = err.info
  if (res) res.statusCode = status
  log[status < 500 ? 'warn' : 'error'](err)
  return JSON.stringify({ status, message, errors })
}

/**
 * Transform to check if streamed objects are from an array;
 * after executing fn, returns success or failure into response
 */
export class ObjTransform extends Transform {
  constructor ({ fn }) {
    super({ objectMode: true })
    this._fn = fn
    this._cnt = 0
  }

  _transform (chunk, _encoding, callback) {
    const { _cnt, _fn } = this
    if (_cnt === 0) {
      if (typeof chunk !== 'object') {
        this.emit('error', new HttpError(400, 'No documents'))
        return
      }
      this.push('[')
    } else {
      this.push(', ')
    }
    if (typeof chunk !== 'object') {
      this.emit('error', new HttpError(400, 'No document'))
      return
    }
    this._cnt++
    _fn(chunk)
      .then(result => this.push(JSON.stringify(result)))
      .catch((/** @type {Error|any} */ err) => this.push(manyError(err)))
      .finally(() => callback())
  }

  _flush () {
    const { _cnt } = this
    if (_cnt) {
      this.push(']')
    } else {
      this.emit('error', new HttpError(400, 'No documents'))
      return
    }
    this.push(null)
  }
}

export class BodyLimit extends Transform {
  constructor ({ limit, ...opts }) {
    super(opts)
    this._limit = limit || 1e6
    this._cnt = this._limit
  }

  _transform (chunk, encoding, callback) {
    this._cnt -= chunk.length
    if (this._cnt < 0) {
      const err = new HttpError(400, `Max body limit ${this._limit} reached`)
      this.emit('error', err)
      callback()
      return
    }
    this.push(chunk, encoding)
    callback()
  }
}
