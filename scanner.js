module.exports = Scanner

var EventEmitter = require('events').EventEmitter
	, opcodes = require('./lib/opcodes')
	, serialport = require('serialport')
	, SerialPort = serialport.SerialPort
	, getCommand = require('./lib/command')
	, extend = require('lodash.assign')
	, async = require('async')
	, check = require('./lib/checksum').check
	, fs = require('fs')
	, DecodeDataAdaptor = require('./lib/response-adaptor/decode-data')

console.debug = console.info

function noop() {
}

function Scanner(options) {
	EventEmitter.call(this)
	this.options = extend(
		{ rescanTimeout: 2000
		, sendInterval: 250
		, rescanWarningTreshold: 10
		, logger: console }, options)

	this.logger = this.options.logger
	this.isReady = false
	this.isWaiting = false
	this.responseHandlers = {}
	this.cache = {}
	this.lastScanTime = 0
	this.lastScan = ''
	this.sendInterval = this.options.sendInterval
	this.rescanTimeout = this.options.rescanTimeout
	this.rescanCount = 0
	this.scanDelay = 0
	this._registerResponseHandlers()
}

Scanner.prototype = Object.create(EventEmitter.prototype)

Scanner.prototype.start = function() {

  this.logger.debug('Starting')
	if (this.options.port) {
		return this._setupDevice(this.options.port)
	}

	this._findPort((function(err, port) {
		if (err) return this.emit('error', err)
		this._setupDevice(port)
	}).bind(this))

}

Scanner.prototype._setupDevice = function(port) {
	this.device = new SerialPort(port, {
	  baudrate: 9600
	})
	this.device.on('error', this.emit.bind(this, 'error'))
	this.device.on('open', this._ready.bind(this))
}

Scanner.prototype._handleTransmission = function(dataByte, cb) {
	return (function(packet) {
		var opcode = packet[0]

		if (this.cache[opcode] === undefined) {
			this.cache[opcode] = new Buffer(packet.slice(dataByte))
		} else {
			this.cache[opcode] = Buffer.concat([ this.cache[opcode], packet.slice(dataByte) ])
		}

		if ((packet[2] & 2) === 0) {
			var returnData = this.cache[opcode]
			this.cache[opcode] = undefined
			this._send(opcodes.cmdAck)
			return cb(packet, returnData)
		}
	}).bind(this)
}

Scanner.prototype._registerResponseHandlers = function() {
	var decodeDataAdaptor = new DecodeDataAdaptor(this, this.options)
	this.responseHandlers[opcodes.cmdAck] = this.emit.bind(this, 'ack')
	this.responseHandlers[opcodes.cmdNak] = this.emit.bind(this, 'nak')

	this.responseHandlers[opcodes.decodeData] = this._handleTransmission(3, function(packet, data) {
		var filename = __dirname + '/image-' + Date.now() + '.jpg'
		fs.writeFile(filename, data.slice(10), (function(err) {
			if (err) return this.emit('error', err)
			this.emit('image', filename)
		}).bind(this))
	}).bind(this)

	this.responseHandlers[opcodes.decodeData] = this._handleTransmission(4, (function(packet, data) {
		decodeDataAdaptor.process(packet, data.toString('ascii'), (function() {
      process.nextTick(function () {
        this.send(opcodes.startScanSession)
      }.bind(this))
		}).bind(this))
	}).bind(this))

  this.responseHandlers[opcodes.replyRevision] = this._handleTransmission(4, (function(packet, data) {
    this.logger.info('Scanner Version', data.toString('ascii'))
    this.emit('ack')
  }).bind(this))
}

Scanner.prototype._findPort = function(cb) {
	serialport.list((function(err, ports) {
		var port
		if (err) return cb(err)
	  port = ports.filter(function(port) {
	  	return port.vendorId === '0x05e0'
	  })
		if (port.length > 0) {
			this.emit('deviceFound', port[0])
			cb(null, port[0].comName)
		} else {
			cb(new Error('No compatible device found'))
		}
	}).bind(this))
}

Scanner.prototype._onData = function(packet) {

		var error
		this.emit('received', packet, this.getOpcodeDescription(packet))
		this.logger.debug('received', packet)

		// Ensure valid packets are coming in
		if (!check(packet)) {
			error = new Error('Invalid checksum')
			error.packet = packet
			return this.emit('error', error)
		}

		// Remove length and the checksum
		packet = packet.slice(1, -2)

		if (this.responseHandlers[packet[0]]) {
			this.responseHandlers[packet[0]](packet)
			return true
		} else {
			this.emit('unknownOpcode', packet)
		}
}

Scanner.prototype._ready = function() {
	this.isReady = true
	this.device.flush()
	this.device.on('data', this._onData.bind(this))

	async.series(
		[ this.send.bind(this, opcodes.scanDisable)
		, this.send.bind(this, opcodes.flushQueue)
		, this.send.bind(this, opcodes.imagerMode, 0x00)
    , this.send.bind(this, opcodes.paramSend, [ 0xff, 0x9f, 0x01 ]) // Enable software handshaking ACK/NK
		, this.send.bind(this, opcodes.paramSend, [ 0xff, 0x5e, 0x01 ]) // Send NR message at end of scan session
    , this.send.bind(this, opcodes.paramSend, [ 0xff, 0xee, 0x01 ]) // Send packeted decode data
    , this.send.bind(this, opcodes.requestRevision) // Get the scanner firmware version
		, this.send.bind(this, opcodes.scanEnable)
		, this.send.bind(this, opcodes.startScanSession)

		], (function(err) {
			if (err) this.emit('error', err)
			this.emit('ready')
		}).bind(this))
}

Scanner.prototype.getOpcodeDescription = function(packet) {
	var opcode = Object.keys(opcodes).filter(function(name) {
		return packet[1] === opcodes[name] ? name : ''
	})
	return opcode[0]
}

Scanner.prototype._send = function(opcode, payload) {
	var command = new Buffer(getCommand(opcode, payload))
	this.logger.debug('send', command, this.getOpcodeDescription(command))
	this.emit('send', command)
	this.device.write(command)
}

Scanner.prototype.send = function(opcode, payload, cb) {
	if (typeof payload === 'function') {
		cb = payload
		payload = undefined
	}

	if (cb === undefined) cb = noop

	if (!this.isReady) return cb(new Error('Scanner not ready'))
	if (this.isWaiting) return cb(new Error('Scanner not waiting for a response'))

	this.isWaiting = true

	function nak() {
		this.isWaiting = false
		this.removeListener('ack', ack)
		setTimeout(cb.bind(null, new Error('nak')), this.sendInterval)
	}

	function ack() {
		this.isWaiting = false
		this.removeListener('nak', nak)
		setTimeout(cb, this.sendInterval)
	}

	this.once('ack', ack)
	this.once('nak', nak)

	this._send(opcode, payload)

}
