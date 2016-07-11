var Scanner = require('../scanner')
	, assert = require('assert')
	, logger = require('mc-logger')
function noop() {

}

describe('scanner', function() {

  describe('_onData', function() {

    it('should error if packet length wrong', function(done) {

      var scanner = new Scanner({ port: '/foo', logger: logger })
      scanner.device = { write: noop }
      scanner.on('error', function (err) {
        assert.equal(err.message, 'Invalid packet length 9 expected 10')
        done()
      })
      scanner._onData(new Buffer([ 0x08, 0xf3, 0x00, 0x00, 0x01, 0x4e, 0x52, 0xfe, 0x65 ]))
    })
  })

	describe('_handleTransmission', function() {

		it('should return data for single packet data', function(done) {

			var scanner = new Scanner({ port: '/foo', logger: logger })
			scanner.device = { write: noop }
			scanner._handleTransmission(4, function(packet, data) {
					assert.equal(data.toString('ascii'), 'http')
					done()
				})(new Buffer([ 0xf3, 0x00, 0x00, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))

		})

		it('should return data when it is the final packet', function(done) {

			var scanner = new Scanner({ port: '/foo', logger: logger })
				, fn = scanner._handleTransmission(4, function(packet, data) {
					assert.equal(data.toString('ascii'), 'httphttp')
					done()
				})
			scanner.device = { write: noop }
			fn(new Buffer([ 0xf3, 0x00, 0x02, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))
			fn(new Buffer([ 0xf3, 0x00, 0x00, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))
		})

	})

})
