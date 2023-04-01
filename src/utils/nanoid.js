import { utils } from 'veloze'

export function nanoid (length = 24) {
  return utils.random64(length, true)
}
