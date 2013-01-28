var serialport = require('serialport')
  , SerialPort = serialport.SerialPort
  , scanner = new SerialPort('/dev/ttyACM0', {
    baudrate: 9600
  })
  , commands = require('./commands')

serialport.list(function (err, ports) {
  console.log('Available Ports: ')
  ports.forEach(function(port) {
    console.log(port.comName, port.pnpId, port.manufacturer)
  })
})

scanner.on('open', function () {
  scanner.on('data', function (data) {
    console.log('recieved data: ' + data)
  })
  scanner.write(new Buffer(commands.diagnostics))
})