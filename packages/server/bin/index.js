#!/usr/bin/env node
// make useStatic work after publish
process.env.NODE_ENV = 'production'
import('../dist/server/index.js')
