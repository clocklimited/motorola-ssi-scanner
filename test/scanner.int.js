var Scanner = require('../scanner')
	, assert = require('assert')
	, opcodes = require('../lib/opcodes')

function findCode(data) {
	var value = ''
	Object.keys(opcodes).some(function(key) {
		if (opcodes[key] === data[1]) value = key
	})
	return value
}


function debug(scanner) {
	scanner.on('sent', function(data) {
		console.log('sent', data, findCode(data))
	})
	scanner.on('response', function(data) {
		console.log('response', data, findCode(data))
	})
}

describe('scanner', function() {
	it('should find device and emit ready', function(done) {

		var scanner = new Scanner()

		scanner.on('ready', function() {
			scanner.send(opcodes.stopScanSession, null, done)
		})

		scanner.start()

	})

	it('should error on bad port', function(done) {
		var scanner = new Scanner({ port: '/jim' })

		scanner.on('ready', function() {
			assert.fail('This should not run')
		})

		scanner.on('error', function() {
			done()
		})

		scanner.start()

	})

	it.only('should send command', function(done) {
		var scanner = new Scanner()
		this.timeout(100000)
		debug(scanner)

		scanner.on('scan', function(data) {
			console.log('scan', data)
		})

		scanner.start()

	})

})