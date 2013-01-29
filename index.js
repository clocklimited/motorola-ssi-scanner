var serialport = require('serialport')
  , SerialPort = serialport.SerialPort
  , device = new SerialPort('/dev/ttyACM0', {
    baudrate: 9600
  })
  , commands = require('./lib/commands')
  , EventEmitter = require('events').EventEmitter

serialport.list(function (err, ports) {
  console.log('Available Ports: ')
  ports.forEach(function(port) {
    console.log(port.comName, port.pnpId, port.manufacturer)
  })
})

module.exports = function() {
  var scanner = device
    , self = new EventEmitter()

  scanner.on('open', function () {
    scanner.on('data', function (data) {
      self.emit('recieved',
        { raw: data
        , ascii: data.toString()
        }
      )
    })
  })

  self.sendCommand = function (opCode, payload) {
    commands.getCommand(opCode, payload, function(packet) {
      scanner.write(packet)
      self.emit('sent', opCode, payload)
    })
  }

  self.serialport = scanner
  self.isLocked = false

  return self
}