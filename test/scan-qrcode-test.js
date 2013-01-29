var MotorolaSSI = require('../')
  , scanner = new MotorolaSSI()
setInterval(function() {
  scanner.sendCommand(0xe4, null)
}, 10000)

scanner.on('data', function () {
  console.log(arguments)
})