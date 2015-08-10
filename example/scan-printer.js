var Scanner = require('../scanner')
	, scanner = new Scanner()
	, opcodes = require('../lib/opcodes')

function log() {
	var args = Array.prototype.slice.apply(arguments)

	args.forEach(function(arg) {
		var opcode = ''
		if (Buffer.isBuffer(arg)) {
			opcode = Object.keys(opcodes).filter(function(name) {
				return arg[1] === opcodes[name] ? name : ''
			})
			if (opcode.length > 0)
			args.push(opcode[0])
		}
	})

	console.log.apply(console, args)
}

scanner.on('send', function(data) {
	log('send\t\t', data)
})

scanner.on('scan', function(code, type) {
	log('scan\t\t', code, type)
})

scanner.on('received', function(data) {
	log('received\t', data)
})

scanner.on('unknownOpcode', function(data) {
	log('unknownOpcode\t', data)
})

scanner.on('error', function(error) {
	log(error.message, error.packet)
})

scanner.on('rescanWarning', function(code, type) {
	log('Rescan Detected', code, type)
})

scanner.on('ready', function() {
	log('Scanner Ready')
})

scanner.start()
