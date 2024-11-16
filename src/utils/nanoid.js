import { webcrypto as crypto } from 'node:crypto'

/** timestamp size in chars */
const TS_SIZE = 9

/**
 * A random ID where the first 9 bytes represent the current date.
 *
 * The ID is sortable. Length must be greater 9 chars.
 *
 * The first 9 chars encode the timestamp in unix epoch. All other characters
 * are random.
 *
 * @param {number} [length=24]
 * @returns {string}
 */
export const nanoid = (length = 24, ticks = Date.now()) => {
  const _length = Math.max(length, TS_SIZE) - TS_SIZE
  const rand = crypto.getRandomValues(new Uint8Array(_length))
  let id = Math.abs(ticks).toString(36).slice(0, TS_SIZE).padStart(TS_SIZE, '0')
  for (let i = 0; i < _length; i += 1) {
    const byte = rand[i] % 61
    id +=
      byte < 36
        ? byte.toString(36).toUpperCase() // 0-9 A-Z
        : (byte - 26).toString(36) // a-z
  }
  return id
}
