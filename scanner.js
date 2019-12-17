const EventEmitter = require('events').EventEmitter
const opcodes = require('./lib/opcodes')
const SerialPort = require('serialport')
const getCommand = require('./lib/command')
const async = require('async')
const fs = require('fs')
const DecodeDataAdaptor = require('./lib/response-adaptor/decode-data')

console.debug = console.info

const noop = () => {
}

const Scanner = function(options) {
  EventEmitter.call(this)
  this.options = Object.assign(
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
  this.resetIntervalObj
  this.nakTimeoutObj
}

Scanner.prototype = Object.create(EventEmitter.prototype)

Scanner.prototype._error = function(err) {
  this.logger.error('Error: ', err.message)
}

Scanner.prototype.start = function() {

  this.logger.debug('Starting')

  this.on('error', this._error.bind(this))

  if (this.options.port) {
    return this._setupDevice(this.options.port)
  }

  this._findPort(((err, port) => {
    if (err) return this.emit('error', err)
    this._setupDevice(port)
  }))

}

Scanner.prototype._setupDevice = function(port) {
  this.device = new SerialPort(port, {
    baudRate: 9600
  })
  this.device.on('error', this.emit.bind(this, 'error'))
  this.device.on('open', this._ready.bind(this))

  // Reset every 2 mins to keep things healthly
  this.resetIntervalObj = setInterval(this._ready.bind(this), 60000 * 2)
}

Scanner.prototype._handleTransmission = function(dataByte, cb) {
  return (packet => {
    const opcode = packet[0]

    if (this.cache[opcode] === undefined) {
      this.cache[opcode] = Buffer.from(packet.slice(dataByte))
    } else {
      this.cache[opcode] = Buffer.concat([ this.cache[opcode], packet.slice(dataByte) ])
    }

    if ((packet[2] & 2) === 0) {
      const returnData = this.cache[opcode]
      this.cache[opcode] = undefined
      this._send(opcodes.cmdAck)
      return cb(packet, returnData)
    }
  })
}

Scanner.prototype._registerResponseHandlers = function() {
  const decodeDataAdaptor = new DecodeDataAdaptor(this, this.options)
  this.responseHandlers[opcodes.cmdAck] = this.emit.bind(this, 'ack')
  this.responseHandlers[opcodes.cmdNak] = this.emit.bind(this, 'nak')

  this.responseHandlers[opcodes.decodeData] = this._handleTransmission(3, (packet, data) => {
    const filename = __dirname + '/image-' + Date.now() + '.jpg'
    fs.writeFile(filename, data.slice(10), (err => {
      if (err) return this.emit('error', err)
      this.emit('image', filename)
    }))
  })

  this.responseHandlers[opcodes.decodeData] = this._handleTransmission(4, ((packet, data)  => {
    decodeDataAdaptor.process(packet, data.toString('ascii'), (() => {
      process.nextTick(() => {
        this.send(opcodes.startScanSession)
      })
    }))
  }))

  this.responseHandlers[opcodes.replyRevision] = this._handleTransmission(4, ((packet, data) => {
    this.logger.debug('Scanner Version', data.toString('ascii'))
    this.emit('ack')
  }))
}

Scanner.prototype._findPort = function(cb) {
  SerialPort.list().then(
    ports => {
      const port = ports.filter((port) => port.vendorId === '05e0')
      if (port.length > 0) {
        this.emit('deviceFound', port[0])
        cb(null, port[0].comName)
      } else {
        cb(new Error('No compatible device found'))
      }
    },
    err => cb(new Error(err))
  )
}

// Packet Format
// Byte 0 - Packet Length: Length of message not including the check sum bytes. Maximum value is 0xFF.
// Byte 1 - OpCode - Identifies the type of packet data sent.
// Byte 2 - Message Source - Identifies where the message is coming from.
// Byte 3 - Status - Bit 0: 0 = First Time Packet Sent, 1 = Retransmission, Bit 1: 0 - Last Frame, 1 - Int. Frame
// Byte 4 - Data
// Byte Length -2 - Checksum
Scanner.prototype._onData = function(packet) {

  this.emit('received', packet, this.getOpcodeDescription(packet))
  this.logger.debug('received', packet)
  this._send(opcodes.cmdAck)

  // Remove length and the checksum
  packet = packet.slice(1, -2)

  if (this.responseHandlers[packet[0]]) {
    this.responseHandlers[packet[0]](packet)
    return true
  } else {
    this.emit('unknownOpcode', packet)
  }
}

Scanner.prototype.disable = function() {
  clearInterval(this.resetIntervalObj)
  clearInterval(this.nakTimeoutObj)
  this.isReady = false
  async.series(
    [ this.send.bind(this, opcodes.scanDisable)
    ], (err => {
      if (err) this.emit('error', err)
    }))
  this.logger.warn('Disabling scanner')
}

Scanner.prototype.reenable = function() {
  this._ready()
  this.resetIntervalObj = setInterval(this._ready.bind(this), 60000 * 2)
  this.logger.warn('Re-enabling scanner')
}

Scanner.prototype._ready = function() {
  this.isReady = true
  this.isWaiting = false
  this.device.flush()
  this.device.removeAllListeners()
  this.device.on('data', this._onData.bind(this))

  async.series(
    [ this.send.bind(this, opcodes.scanDisable)
      , this.send.bind(this, opcodes.flushQueue)
      , this.send.bind(this, opcodes.imagerMode, 0x00)
      , this.send.bind(this, opcodes.paramSend, [ 0xff, 0x9f, 0x01 ]) // Enable software handshaking ACK/NK
      , this.send.bind(this, opcodes.paramSend, [ 0xff, 0x5e, 0x01 ]) // Send NR message at end of scan session
      , this.send.bind(this, opcodes.paramSend, [ 0xff, 0xee, 0x01 ]) // Send packeted decode data
      , this.send.bind(this, opcodes.paramSend, [ 0xff, 0xec, 0x00 ]) // Disable parameter scanning
      , this.send.bind(this, opcodes.requestRevision) // Get the scanner firmware version
      , this.send.bind(this, opcodes.scanEnable)
      , this.send.bind(this, opcodes.startScanSession)

    ], (err => {
      if (err) this.emit('error', err)
      this.emit('ready')
    }))
}

Scanner.prototype.getOpcodeDescription = (packet) => {
  const opcode = Object.keys(opcodes).filter(name => packet[1] === opcodes[name] ? name : '')
  return opcode[0]
}

Scanner.prototype._send = function(opcode, payload) {
  if(this.device.isOpen) {
    const command = Buffer.from(getCommand(opcode, payload))
    this.logger.debug('send', command, this.getOpcodeDescription(command))
    this.emit('send', command)
    this.device.write(command)
  }
  else {
    this.logger.error('Port is not open - rechecking')
    setTimeout(this._send, 10, opcode, payload)
  }
}

Scanner.prototype.send = function(opcode, payload, cb) {
  if (typeof payload === 'function') {
    cb = payload
    payload = undefined
  }

  if (cb === undefined) cb = noop

  if (!this.isReady) return cb(new Error('Scanner not ready'))
  if (this.isWaiting) {
    if (this.resetIntervalObj === undefined) {
      return cb(new Error('Scanner not waiting for a response'))
    }
    else {
      // Reset the scanner when a recoverable error is seen
      clearInterval(this.resetIntervalObj)
      clearInterval(this.nakTimeoutObj)
      this.resetIntervalObj = setInterval(this._ready.bind(this), 60000 * 2)
      return
    }
  }

  this.isWaiting = true

  const nak = () => {
    this.isWaiting = false
    this.removeListener('ack', ack)
    this.nakTimeoutObj = setTimeout(cb.bind(null, new Error('nak')), this.sendInterval)
  }

  const ack = () => {
    this.isWaiting = false
    this.removeListener('nak', nak)
    setTimeout(cb, this.sendInterval)
  }

  this.once('ack', ack)
  this.once('nak', nak)

  this._send(opcode, payload)

}

module.exports = Scanner
