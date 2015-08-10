var Scanner = require('../scanner')
	, assert = require('assert')
	, logger = require('mc-logger')
function noop() {

}

describe('scanner', function() {

	describe('_handleTransmission', function() {

		it('should return data for single packet data', function(done) {

			var scanner = new Scanner({ port: '/foo', logger: logger })
			scanner.device = { write: noop }
			scanner._handleTransmission(4, function(data) {
					assert.equal(data.toString('ascii'), 'http')
					done()
				})(new Buffer([ 0xf3, 0x00, 0x00, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))

		})

		it('should return data when it is the final packet', function(done) {

			var scanner = new Scanner({ port: '/foo', logger: logger })
				, fn = scanner._handleTransmission(4, function(data) {
					assert.equal(data.toString('ascii'), 'httphttp')
					done()
				})
			scanner.device = { write: noop }
			fn(new Buffer([ 0xf3, 0x00, 0x02, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))
			fn(new Buffer([ 0xf3, 0x00, 0x00, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))
		})

	})

})
