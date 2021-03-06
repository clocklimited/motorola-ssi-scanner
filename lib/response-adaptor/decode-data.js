const DecodeData = function (scanner, options) {
  this.options = Object.assign({
    rescanCodeDelay: 5000
    , rescanWarningTreshold: 10 }
    , options)
  this.scanner = scanner
  this.lastScan = { time: 0, value: 0 }
  this.rescanCount = 0
}

DecodeData.prototype.process = function(packet, scanData, cb) {

  var type = packet[3]
    , cb = cb || function () {}

  if ((this.lastScan.value === scanData) && (this.lastScan.time + this.options.rescanCodeDelay > Date.now())) {
    this.rescanCount += 1
    this.scanner.logger.debug('Rescan detected', scanData)

    if (this.rescanCount >= this.options.rescanWarningTreshold) {
      this.scanner.emit('recanWarning', scanData, type)
      this.rescanCount = 0
      return setTimeout(cb, 5000)
    }

    return setTimeout(cb, 2000)
  }

  if (scanData !== 'NR') {
    this.lastScan.value = scanData
    this.lastScan.time = Date.now()
    this.scanner.emit('scan', scanData, type)
    return setTimeout(cb, 1000)
  }
  cb()
}

module.exports = DecodeData
