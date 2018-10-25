const Scanner = require('../scanner')
const assert = require('assert')
const opcodes = require('../lib/opcodes')

describe('scanner', () => {
	it('should find device and emit ready', (done) => {

		const scanner = new Scanner()

		scanner.on('ready', () => {
			scanner.send(opcodes.stopScanSession, null, done)
		})

		scanner.start()

	})

	it('should error on bad port', (done) => {
		const scanner = new Scanner({ port: '/jim' })

		scanner.on('ready', () => {
			assert.fail('This should not run')
		})

		scanner.on('error', () => {
			done()
		})

		scanner.start()

	})

})
