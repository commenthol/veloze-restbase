#!/usr/bin/env node

import shelljs from 'shelljs'
const { rm, exec, cd, cat } = shelljs

const dir = new URL('..', import.meta.url).pathname

cd(dir)
rm('-rf', './types')
exec('tsc')

cat('./types/index.d.ts', './types/types.d.ts').to('./types/index.d.ts')
