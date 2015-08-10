module.exports = DecodeData

var opcodes = require('../../lib/opcodes')
	, extend = require('lodash.assign')

function DecodeData(scanner, options) {
	this.options = extend(
		{ rescanCodeDelay: 5000
		, rescanWarningTreshold: 10 }, options)
	this.scanner = scanner
	this.lastScan = { time: 0, value: 0 }
	this.rescanCount = 0
}

DecodeData.prototype.process = function(packet, scanData) {

	var type = packet[3]

	if ((this.lastScan.value === scanData) && (this.lastScan.time + this.options.rescanCodeDelay > Date.now())) {
		this.rescanCount += 1
		this.scanner.logger.debug('Rescan detected', scanData)

		if (this.rescanCount >= this.options.rescanWarningTreshold) {
			this.scanner.emit('recanWarning', scanData, type)
			this.rescanCount = 0
		}

		return
	}

	if ((type !== 1) && (scanData !== 'NR')) {
		this.lastScan.value = scanData
		this.lastScan.time = Date.now()
		this.scanner.emit('scan', scanData, type)
	}
}
