#!/usr/bin/env node

import shelljs from 'shelljs'
const { rm, exec, find, cp, cd, cat } = shelljs

const dir = new URL('..', import.meta.url).pathname

cd(dir)
rm('-rf', './types')
exec('tsc')

find('./src/**/*.d.ts').forEach((source) => {
  const dest = source.replace('./src/', './types/')
  cp(source, dest)
})

cat('./types/index.d.ts', './types/types.d.ts').to('./types/index.d.ts')
