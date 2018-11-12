const Scanner = require('../scanner')
const logger = { info: log.bind(null, 'info')
    , debug: log.bind(null, 'debug')
    , warn: log.bind(null, 'warn') }
const scanner = new Scanner({ logger: logger })
const chalk = require('chalk');

function log(level) {
  const args = Array.prototype.slice.call(arguments, 1)
    , formattedArgs = []
  args.forEach((arg) => {
    if (Buffer.isBuffer(arg)) {
      const argData = Array.prototype.slice.call(arg)
      formattedArgs.push(argData.map(function(byte) {
        return '0x' + byte.toString('16')
      }))
    } else {
      formattedArgs.push(arg)
    }
  })
  console.log(level, chalk.grey(formattedArgs))
}

scanner.on('ready', () => {
  console.log('Scanner Ready')
})

scanner.on('scan', (code, type) => {
  console.log(chalk.red('scan\t\t'), code, type)
})

scanner.on('rescanWarning', (code, type) => {
  console.log('Rescan Detected', code, type)
})

scanner.start()
