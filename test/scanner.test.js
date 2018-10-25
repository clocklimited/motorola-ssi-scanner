var Scanner = require('../scanner')
	, logger = require('mc-logger')
	, assert = require('assert')

const noop = () => {
}

describe('scanner', () => {

  describe('_onData', () => {

    it('should error if packet length wrong', (done) => {

      var scanner = new Scanner({ port: '/foo', logger: logger })
      scanner.device = { write: noop }
      scanner.on('error', (err) => {
        assert.equal(err.message, 'Invalid packet length 9 expected 10')
        done()
      })
      scanner._onData(new Buffer([ 0x08, 0xf3, 0x00, 0x00, 0x01, 0x4e, 0x52, 0xfe, 0x65 ]))
    })
  })

	describe('_handleTransmission', () => {

		it('should return data for single packet data', (done) => {

			const scanner = new Scanner({ port: '/foo', logger: logger })
			scanner.device = { write: noop }
			scanner._handleTransmission(4, (packet, data) => {
					assert.equal(data.toString('ascii'), 'http')
					done()
				})(new Buffer([ 0xf3, 0x00, 0x00, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))

		})

		it('should return data when it is the final packet', (done) => {

			const scanner = new Scanner({ port: '/foo', logger: logger })
				, fn = scanner._handleTransmission(4, (packet, data) => {
					assert.equal(data.toString('ascii'), 'httphttp')
					done()
				})
			scanner.device = { write: noop }
			fn(new Buffer([ 0xf3, 0x00, 0x02, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))
			fn(new Buffer([ 0xf3, 0x00, 0x00, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))
		})

	})

  describe('send', () => {
    it('should emit a send event with opcode and payload', (done) => {

      //  [Length, OpCode, Source, reserved, [payload], checksum High, Checksum Low]

      const opcode = 0xe9
      const payload = [ 1, 1, 1 ]

      const scanner = new Scanner({ port: '/foo', logger: logger })
      scanner.device = { write: noop }
      scanner.isReady = true
      scanner.on('send', (data) => {
        const dataSent = [ ...data ]
        assert.equal(opcode, dataSent[1])
        assert.deepEqual(payload, dataSent.slice(4, dataSent.length - 2))
        done()
      })
      scanner.send(opcode, payload)
    })
  })
})
