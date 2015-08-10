var Scanner = require('../scanner')
	, assert = require('assert')

describe('scanner', function() {

	describe('_getTransmission', function() {

		it('should return data when it is the final packet', function() {

			var scanner = new Scanner({ port: '/foo' })
			, value = scanner._getTransmission(new Buffer([ 0xf3, 0x00, 0x00, 0x1c, 0x68, 0x74, 0x74, 0x70 ]))
			assert.equal(value.toString('ascii'), 'http')
		})

	})

})
