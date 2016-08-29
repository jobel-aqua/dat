#!/usr/bin/env node

var spawn = require('child_process').spawn

var args = process.argv.slice(0)
var parsedArgs = require('minimist')(process.argv.splice(2), {
  alias: {p: 'port', q: 'quiet', v: 'version'},
  boolean: ['snapshot', 'exit', 'list', 'quiet', 'version', 'utp'],
  default: {
    logspeed: 200
  }
})

process.title = 'dat'

// set debug before requiring other modules
if (parsedArgs.debug) {
  var debugArgs = parsedArgs.debug
  if (typeof parsedArgs.debug === 'boolean') debugArgs = '*' // default
  process.env.DEBUG = debugArgs
}
var debug = require('debug')('dat') // require this after setting process.env.DEBUG

if (parsedArgs.version) {
  var pkg = require('../package.json')
  console.log(pkg.version)
  process.exit(0)
}

parsedArgs.logspeed = +parsedArgs.logspeed
if (isNaN(parsedArgs.logspeed)) parsedArgs.logspeed = 200

var command = parsedArgs._.shift()
var extensionArgs = args.splice(3)
if (!command) require('../usage')('root.txt')
else run()

function run () {
  debug(`Running Dat ${command}`)
  if (command === 'share') require('../commands/share')(parsedArgs)
  else if (command === 'download') require('../commands/download')(parsedArgs)
  else {
    tryExecExtension(function (err) {
      if (err) return onerror(err)
    })
  }
}

function tryExecExtension (cb) {
  var extension = spawn(`dat-${command}`, extensionArgs)
  debug(`Running executable extension: dat-${command} with args [${extensionArgs}]`)
  extension.stdout.pipe(process.stdout)
  extension.stderr.pipe(process.stderr)
  extension.on('error', function (err) {
    var isMissingExt = (err.code === 'ENOENT' && err.message.indexOf(`spawn dat-${command} ENOENT`) > -1)
    if (!isMissingExt) return cb(err)
    extension.on('close', tryLocalExtension)
    extension.kill()
  })
  extension.on('exit', function (code) {
    debug('Extension exited with code: ' + code)
  })
}

function tryLocalExtension () {
  try {
    require(`dat-${command}`)(extensionArgs)
  } catch (err) {
    var isMissingExt = (err.code === 'MODULE_NOT_FOUND' && err.message.indexOf(`dat-${command}`) > -1)
    if (!isMissingExt) return onerror(err)
    return onerror(`dat-${command} extension not found. Make sure you have dat-${command} installed and it is executable.`)
  }
}

function onerror (msg) {
  console.error(msg)
  process.exit(1)
}
