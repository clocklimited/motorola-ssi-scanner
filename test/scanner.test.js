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

})
