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
    if (ack.length !== packet.length) {
      return false
    }
    for (var i = ack.length - 1; i >= 0; i--) {
      if (ack[i] !== packet[i]) {
        return false
      }
    }
    return true
  }

  scanner.on('open', function() {
    console.log('device opened')
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

  self.pseudoContinuousScan = function() {
    return setInterval(function() {
      self.sendCommand(0xe4, null)
    }, 10000)
  }

  self.serialport = scanner
  self.isLocked = false

  return self
}