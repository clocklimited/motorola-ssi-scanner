var serialport = require('serialport')
  , SerialPort = serialport.SerialPort
  , device = new SerialPort('/dev/ttyACM0', {
    baudrate: 9600
  })
  , commands = require('./lib/commands')
  , EventEmitter = require('events').EventEmitter

serialport.list(function(err, ports) {
  console.log('Available devices: ')
  ports.forEach(function(port) {
    console.log(port.comName, port.pnpId, port.manufacturer)
  })
})

module.exports = function() {
  var scanner = device
    , self = new EventEmitter()

  function isAck(packet) {
    var ack = [0x04, 0xd0, 0x00, 0x00, 0xff, 0x2c]
    return packet.every(function (element, index) {
      return element === ack[index]
    })
  }

  scanner.on('open', function() {
    scanner.on('data', function(data) {
      if (!isAck(data)) {
        self.emit('data',
          { raw: data
          , ascii: data.toString()
          }
        )
      }
    })
  })

  self.sendCommand = function(opCode, payload) {
    commands.getCommand(opCode, payload, function(packet) {
      scanner.write(packet)
      self.emit('sent', opCode, payload, packet)
    })
  }

  self.serialport = scanner
  self.isLocked = false

  return self
}