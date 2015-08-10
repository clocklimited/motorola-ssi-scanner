var DecodeDataAdaptor = require('../lib/response-adaptor/decode-data')
	, assert = require('assert')
	, EventEmitter = require('events').EventEmitter
	, mockDate = require('mockdate')
	, logger = require('mc-logger')

function SpyScanner() {
	EventEmitter.call(this)
	this.sendInterval = 1000
	this.logger = logger
}

SpyScanner.prototype = Object.create(EventEmitter.prototype)

SpyScanner.prototype.send = function () {
}

describe('decode-data-adaptor', function() {

	it('should cause an scan to be emitted and return code and data', function(done) {
		var spyScanner = new SpyScanner()
			, decodeDataAdaptor = new DecodeDataAdaptor(spyScanner)

		spyScanner.on('scan', function(code, type) {
			assert.equal(code, '855941004002')
			assert.equal(type, 8)
			done()
		})

		decodeDataAdaptor.process([ 0, 0, 0, 8 ], '855941004002')

	})

	it('should not emit scan on NR', function(done) {
		var spyScanner = new SpyScanner()
			, decodeDataAdaptor = new DecodeDataAdaptor(spyScanner)

		spyScanner.on('scan', function() {
			assert.fail(null, 'This should not run')
		})

		decodeDataAdaptor.process([ 0, 0, 0, 1 ], 'NR')
		process.nextTick(done)
	})

	it('should not rescan same code for 5 seconds', function(done) {
		var spyScanner = new SpyScanner()
			, decodeDataAdaptor = new DecodeDataAdaptor(spyScanner)
			, now = Date.now()
			, count = 0
			, expected = [ 'foo', 'foo', 'foo' ]

		spyScanner.on('scan', function(code) {
			assert.equal(expected[count], code)
			count += 1
			if (count === expected.length) done()
		})

		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'foo')
		mockDate.set(now + 2000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'foo')
		mockDate.set(now + 4000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'foo')
		mockDate.set(now + 6000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'foo')
		mockDate.set(now + 8000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'foo')
		mockDate.set(now + 11000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'foo')
		mockDate.reset()
	})

	it('should allow scanning of different codes every 5 seconds', function(done) {
		var spyScanner = new SpyScanner()
			, decodeDataAdaptor = new DecodeDataAdaptor(spyScanner)
			, now = Date.now()
			, count = 0
			, expected = [ 'one', 'two', 'three' ]

		spyScanner.on('scan', function(code) {
			assert.equal(expected[count], code)
			count += 1
			if (count === expected.length) done()
		})

		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'one')
		mockDate.set(now + 2000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'two')
		mockDate.set(now + 4000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'three')
		mockDate.set(now + 6000)
		mockDate.reset()
	})

	it('should scanning a different code resets rescan limit', function(done) {
		var spyScanner = new SpyScanner()
			, decodeDataAdaptor = new DecodeDataAdaptor(spyScanner)
			, now = Date.now()
			, count = 0
			, expected = [ 'one', 'two', 'one', 'three' ]

		spyScanner.on('scan', function(code) {
			assert.equal(expected[count], code)
			count += 1
			if (count === expected.length) done()
		})

		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'one')
		mockDate.set(now + 2000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'one')
		mockDate.set(now + 4000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'two')
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'one')
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'three')
		mockDate.reset()
	})

	it('should not reset rescan delay after a failed scan', function(done) {
		var spyScanner = new SpyScanner()
			, decodeDataAdaptor = new DecodeDataAdaptor(spyScanner)
			, now = Date.now()
			, count = 0
			, expected = [ 'one', 'one' ]

		spyScanner.on('scan', function(code) {
			assert.equal(expected[count], code)
			count += 1
			if (count === expected.length) done()
		})

		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'one')
		mockDate.set(now + 2000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'one')
		mockDate.set(now + 4000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'one')
		mockDate.set(now + 6000)
		decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'one')
		mockDate.reset()
	})

	it('should emit rescanWarning', function(done) {
		var spyScanner = new SpyScanner()
			, decodeDataAdaptor = new DecodeDataAdaptor(spyScanner, { rescanWarning: 5 })
			, count = 0

		spyScanner.on('recanWarning', function() {
			count += 1
			if (count === 10) done()
		})

		for (var i = 0; i < 51; i++) decodeDataAdaptor.process([ 0, 0, 0, 8 ], 'one')

	})

})
