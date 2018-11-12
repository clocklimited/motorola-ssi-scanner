const Scanner = require('../scanner')
const logger = require('mc-logger')
const assert = require('assert')
const sinon = require('sinon')
const opcodes = require('../lib/opcodes')

const noop = function () {
}

describe('scanner', function () {

  describe('_onData', function () {

    /*it('should error if packet length wrong', function (done) {

      const scanner = new Scanner({ port: '/foo', logger: logger })
      scanner.device = { write: noop }
      scanner.on('error', function (err) {
        assert.equal(err.message, 'Invalid packet length 9 expected 10')
        done()
      })
      scanner._onData(new Buffer([ 0x08, 0xf3, 0x00, 0x00, 0x01, 0x4e, 0x52, 0xfe, 0x65 ]))
    })*/

    it('should emit send with opcode cmdAck', function (done) {
      const spy = sinon.spy()
        , scanner = new Scanner({ port: '/foo', logger: logger })
      scanner.device = { write: noop }
      scanner.isReady = true
      scanner.on('send', spy)
      scanner._onData(Buffer.from([ 0x08, 0xf3, 0x00, 0x00, 0x01, 0x4e, 0x52, 0xfe, 0x65, 0x65 ]))
      const spyData = [ ...spy.firstCall.args[0] ]
      assert.equal(spyData[1], opcodes.cmdAck)
      done()
    })
  })

  describe('_handleTransmission', function () {

    it('should return data for single packet data', function (done) {

      const scanner = new Scanner({ port: '/foo', logger: logger })
      scanner.device = { write: noop }
      scanner._handleTransmission(4, function (packet, data) {
          assert.equal(data.toString('ascii'), 'http')
          done()
        })(Buffer.from([ 0xf3, 0x00, 0x00, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))

    })

    it('should return data when it is the final packet', function (done) {

      const scanner = new Scanner({ port: '/foo', logger: logger })
        , fn = scanner._handleTransmission(4, function (packet, data) {
          assert.equal(data.toString('ascii'), 'httphttp')
          done()
        })
      scanner.device = { write: noop }
      fn(Buffer.from([ 0xf3, 0x00, 0x02, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))
      fn(Buffer.from([ 0xf3, 0x00, 0x00, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))
    })

  })

  describe('send', function () {
    it('should emit a send event with opcode and payload', function (done) {

      //  [Length, OpCode, Source, reserved, [payload], checksum High, Checksum Low]

      const opcode = 0xe9
      const payload = [ 1, 2, 3 ]

      const scanner = new Scanner({ port: '/foo', logger: logger })
      scanner.device = { write: noop }
      scanner.isReady = true
      scanner.on('send', function (data) {
        const dataSent = [ ...data ]
        assert.equal(opcode, dataSent[1])
        assert.deepEqual(payload, dataSent.slice(4, dataSent.length - 2))
        done()
      })
      scanner.send(opcode, payload)
    })
  })
})

