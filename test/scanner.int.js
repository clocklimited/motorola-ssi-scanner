const Scanner = require('../scanner')
const assert = require('assert')
const opcodes = require('../lib/opcodes')

describe('scanner', function () {
  it('should find device and emit ready', function (done) {

    const scanner = new Scanner()

    scanner.on('ready', function () {
      scanner.send(opcodes.stopScanSession, null, done)
    })

    scanner.start()

  })

  it('should error on bad port', function (done) {
    const scanner = new Scanner({ port: '/jim' })

    scanner.on('ready', function () {
      assert.fail('This should not run')
    })

    scanner.on('error', function () {
      done()
    })

    scanner.start()

  })

})
