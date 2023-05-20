import { nanoid } from '../src/utils/nanoid.js'

const ticks = Date.now() // new Date('2023-04-14T07:42:46.562Z').getTime()
console.log(nanoid(24, ticks))
