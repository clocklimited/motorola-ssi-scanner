var motorolaSSI = require('../')

setInterval(motorolaSSI.sendCommand(0xe4, null), 10000)

motorolaSSI.on('data', function () {
  console.log(arguments)
})