var Scanner = require('../scanner')
	, scanner = new Scanner()
	, opcodes = require('../lib/opcodes')

scanner.start()

scanner.on('ready', function() {

	scanner._send(opcodes.ssiMgmtCommand, [ 0x00, 0x06, 0x20, 0x00, 0xff, 0xff ], function(err, data) {
	})

	setTimeout(function() {
		scanner._send(opcodes.ssiMgmtCommand, [ 0x00, 0x08, 0x02, 0x00, 0x27, 0x4d, 0x42, 0x00 ], function(err, data) {
			console.log(data)
		})
	}, 1000)

})