import assert from 'node:assert/strict'
import { nanoid } from '../../src/utils/index.js'

describe('utils/nanoid', function () {
  it('shall generate distinct uuids', function () {
    const uuid1 = nanoid()
    const uuid2 = nanoid()
    assert.equal(uuid1.length, 24)
    assert.ok(uuid1 !== uuid2)
  })

  it('shall generate safe timestamp', function () {
    const uuid = nanoid(9, Number.MAX_SAFE_INTEGER)
    // note: an id with less than 9 chars has no randomized part!
    assert.equal(uuid, '2gosa7pa2')
  })

  it('shall generate safe timestamp for negative ticks', function () {
    const uuid = nanoid(9, -Number.MAX_SAFE_INTEGER)
    // note: an id with less than 9 chars has no randomized part!
    assert.equal(uuid, '2gosa7pa2')
  })
})
