const checksum = require('../lib/checksum')
const assert = require('assert')
const longPacket = [ 255, 243, 0, 3, 28, 123, 34, 99, 105, 100, 34, 58, 32, 34, 53, 55, 55, 98, 99, 56, 51, 53, 51, 49, 100, 55
    , 98, 56, 53, 101, 54, 56, 53, 97, 49, 52, 50, 54, 34, 44, 34, 97, 117, 116, 104, 34, 58, 34, 101, 121, 74, 48
    , 101, 88, 65, 105, 79, 105, 74, 75, 86, 49, 81, 105, 76, 67, 74, 104, 98, 71, 99, 105, 79, 105, 74, 73, 85, 122
    , 73, 49, 78, 105, 74, 57, 46, 101, 121, 74, 113, 100, 71, 107, 105, 79, 105, 73, 49, 78, 122, 82, 107, 89, 87, 69
    , 51, 77, 122, 69, 50, 77, 50, 77, 50, 79, 68, 66, 109, 77, 68, 65, 122, 90, 71, 90, 107, 77, 50, 81, 105, 76, 67
    , 74, 112, 89, 88, 81, 105, 79, 106, 69, 48, 78, 106, 81, 51, 77, 68, 99, 50, 79, 84, 107, 53, 78, 122, 81, 115, 73
    , 109, 86, 52, 99, 67, 73, 54, 77, 84, 81, 53, 78, 106, 73, 48, 77, 122, 89, 53, 79, 88, 48, 46, 121, 69, 81, 57, 72
    , 112, 82, 88, 65, 113, 107, 70, 73, 107, 102, 81, 119, 120, 88, 113, 71, 48, 90, 121, 56, 79, 79, 74, 53, 81, 51
    , 114, 99, 70, 56, 119, 67, 114, 100, 110, 114, 114, 111, 34, 44, 34, 100, 97, 116, 97, 34, 58, 123, 34, 112, 114
    , 111, 100, 117, 99, 116, 115, 34, 58, 91, 123, 34, 111, 112, 116, 105, 111, 110, 34, 174, 210 ]

describe('checksum', function () {

	describe('check', function () {

		it('should return true for valid checksum', function () {
			assert(checksum.check([ 0x05, 0x00, 0x04, 0x00, 0x00, 0xff, 0xf7 ]))
			assert(checksum.check([ 0x07, 0xf3, 0x00, 0x00, 0x01, 0x4e, 0x52, 0xfe, 0x65 ]))
		})

		it('should return false for invalid checksum', function () {
			assert(checksum.check([ 0x05, 0x00, 0x04, 0x00, 0x00, 0xff, 0xe7 ]) === false)
		})

		it('should work with buffers', function () {
			assert(checksum.check(new Buffer([ 0x05, 0x00, 0x04, 0x00, 0x00, 0xff, 0xf7 ])))
		})

    it('should return true for long valid', function () {
      assert(checksum.check(longPacket))
    })
	})

	describe('create', function () {
		it('should create expected checksum', function () {
			assert.deepEqual(checksum.create([ 0x07, 0xf3, 0x00, 0x00, 0x01, 0x4e, 0x52 ]), [ 0xfe, 0x65 ])
			assert.deepEqual(checksum.create([ 0x00 ]), [ 0x0, 0x0 ])
			assert.deepEqual(checksum.create([ 0xff, 0xff, 0xff, 0xff, 0xff ]), [ 0xfb, 0x05 ])
		})
	})
})
