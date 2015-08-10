var checksum = require('../lib/checksum')
	, assert = require('assert')

describe('checksum', function() {
	describe('check', function() {

		it('should return true for valid checksum', function() {
			assert(checksum.check([ 0x05, 0x00, 0x04, 0x00, 0x00, 0xff, 0xf7 ]))
			assert(checksum.check([ 0x07, 0xf3, 0x00, 0x00, 0x01, 0x4e, 0x52, 0xfe, 0x65 ]))
		})

		it('should return false for invalid checksum', function() {
			assert(checksum.check([ 0x05, 0x00, 0x04, 0x00, 0x00, 0xff, 0xe7 ]) === false)

		})

		it('should work with buffers', function() {
			assert(checksum.check(new Buffer([ 0x05, 0x00, 0x04, 0x00, 0x00, 0xff, 0xf7 ])))
		})
	})

	describe('create', function() {
		it('should create expected checksum', function() {
			assert.deepEqual(checksum.create([ 0x07, 0xf3, 0x00, 0x00, 0x01, 0x4e, 0x52 ]), [ 0xfe, 0x65 ])
			assert.deepEqual(checksum.create([ 0x00 ]), [ 0x0, 0x0 ])
			assert.deepEqual(checksum.create([ 0xff, 0xff, 0xff, 0xff, 0xff ]), [ 0xfb, 0x05 ])
		})
	})

})