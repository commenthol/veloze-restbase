import assert from 'node:assert/strict'
import { uuid7 } from '../../src/utils/index.js'

describe('utils/uuid7', function () {
  it('shall generate distinct uuids', function () {
    const uuid1 = uuid7()
    const uuid2 = uuid7()
    assert.equal(uuid1.length, 36)
    assert.ok(uuid1 !== uuid2)
  })
})
