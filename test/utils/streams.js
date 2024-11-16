import assert from 'node:assert/strict'
import { Readable, Transform } from 'node:stream'
import JsonStream from '@search-dump/jsonstream'
import { BodyLimit, ObjTransform, manyError } from '../../src/utils/streams.js'
import { HttpError } from 'veloze'

class Reader extends Readable {
  constructor(arr) {
    super()
    this._arr = arr
  }

  _read() {
    const next = this._arr.shift()
    if (next) {
      this.push(next)
    } else {
      this.push(null)
    }
  }
}

class Response extends Transform {
  constructor() {
    super()
    this.body = ''
  }

  _transform(chunk, encoding, callback) {
    this.body += chunk
    callback()
  }
}

describe('util/streams', function () {
  it('shall process stream', function (done) {
    const fn = async (str) => str
    const res = new Response()
    const jsonStream = JsonStream.parse('.*')
    const transform = new ObjTransform({ fn, res })
    const reader = new Reader(['[{"a":1},', '{"a":2}]'])
    reader
      .pipe(new BodyLimit({}))
      .pipe(jsonStream)
      .pipe(transform)
      .pipe(res)
      .pipe(
        new Transform({
          flush() {
            assert.equal(res.body, '[{"a":1}, {"a":2}]')
            done()
          }
        })
      )
  })

  it('shall pass stream errors', function (done) {
    let cnt = 0
    const fn = async (str) => {
      if (++cnt > 1) throw new Error('baam')
      return str
    }
    const res = new Response()
    const jsonStream = JsonStream.parse('.*')
    const transform = new ObjTransform({ fn, res })
    const reader = new Reader(['[{"a":1},', '{"a":2},{"a":3}]'])
    reader
      .pipe(new BodyLimit({}))
      .pipe(jsonStream)
      .pipe(transform)
      .pipe(res)
      .pipe(
        new Transform({
          flush() {
            assert.equal(
              res.body,
              '[{"a":1}, {"status":500,"message":"General Error"}, {"status":500,"message":"General Error"}]'
            )
            done()
          }
        })
      )
  })

  it('shall exit stream on max body limit', function (done) {
    const fn = async (str) => str
    const res = new Response()
    const jsonStream = JsonStream.parse('.*')
    const transform = new ObjTransform({ fn })
    const reader = new Reader(['[{"a":1},{"a":2}', ',{"a":3},{"a":4}]'])

    const handleErr = (httpErr) => res.end(manyError(httpErr, res) + ']')

    reader
      .pipe(new BodyLimit({ limit: 20 }))
      .on('error', handleErr)
      .pipe(jsonStream)
      .on('error', handleErr)
      .pipe(transform)
      .on('error', handleErr)
      .pipe(res)
      .pipe(
        new Transform({
          flush() {
            assert.equal(
              res.body,
              '[{"status":400,"message":"Max body limit 20 reached"}]'
            )
            done()
          }
        })
      )
  })

  it('shall exit stream on json error', function (done) {
    const fn = async (str) => str
    const res = new Response()
    const jsonStream = JsonStream.parse('.*')
    const transform = new ObjTransform({ fn })
    const reader = new Reader(['[{"a":1},{"a":2}', ',{"a":3},{a":4}]'])

    const handleErr = (httpErr) => res.end(manyError(httpErr, res) + ']')

    reader
      .pipe(new BodyLimit({}))
      .on('error', handleErr)
      .pipe(jsonStream)
      .on('error', (err) => {
        if (err.message.startsWith('Invalid JSON')) {
          err = new HttpError(400, err.message)
        }
        handleErr(err)
      })
      .pipe(transform)
      .on('error', handleErr)
      .pipe(res)
      .pipe(
        new Transform({
          flush() {
            assert.equal(
              res.body,
              '[{"status":400,"message":"Invalid JSON (Unexpected \\"a\\" at position 27 in state STOP)"}]'
            )
            done()
          }
        })
      )
  })
})
