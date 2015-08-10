var Scanner = require('../scanner')
	, logger = { info: log.bind(null, 'info')
		, debug: log.bind(null, 'debug')
		, warn: log.bind(null, 'warn') }
	, scanner = new Scanner({ logger: logger })
	, chalk = require('chalk');

function log(level) {
	var args = Array.prototype.slice.call(arguments, 1)
		, formattedArgs = []
	args.forEach(function(arg) {
		if (Buffer.isBuffer(arg)) {
			var argData = Array.prototype.slice.call(arg)
			formattedArgs.push(argData.map(function(byte) {
				return '0x' + byte.toString('16')
			}))
		} else {
			formattedArgs.push(arg)
		}
	})
	console.log(level, chalk.grey(formattedArgs))
}

scanner.on('ready', function() {
	console.log('Scanner Ready')
})

scanner.on('scan', function(code, type) {
	console.log(chalk.red('scan\t\t'), code, type)
})

scanner.on('rescanWarning', function(code, type) {
	console.log('Rescan Detected', code, type)
})

scanner.start()
