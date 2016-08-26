#!/usr/bin/env node

var args = require('minimist')(process.argv.splice(2), {
  alias: {p: 'port', q: 'quiet', v: 'version'},
  boolean: ['snapshot', 'exit', 'list', 'quiet', 'version', 'utp'],
  default: {
    logspeed: 200
  }
})

process.title = 'dat'

// set debug before requiring other modules
if (args.debug) {
  var debug = args.debug
  if (typeof args.debug === 'boolean') debug = '*' // default
  process.env.DEBUG = debug
}

if (args.version) {
  var pkg = require('../package.json')
  console.log(pkg.version)
  process.exit(0)
}

args.logspeed = +args.logspeed
if (isNaN(args.logspeed)) args.logspeed = 200

var command = args._.shift() // remove command arg so extensions can parse args like normal
if (!command) require('../usage')('root.txt')
else run()

function run () {
  if (command === 'share') require('../commands/share')(args)
  else if (command === 'download') require('../commands/download')(args)
  else {
    try {
      require(`dat-${command}`)(args)
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND' || e.message.indexOf(`dat-${command}`) === -1) {
        console.error('Extension Error:')
        return onerror(e)
      }
      onerror(`dat extension ${command} not found. Make sure you have dat-${command} installed.`)
    }
  }
}

function onerror (msg) {
  console.error(msg)
  process.exit(1)
}
