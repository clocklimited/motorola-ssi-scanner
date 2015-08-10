# motorola-ssi-scanner

Communicate with a Motorola SE3307 IG scanner using SSI over USB in node.js

## Usage

```
var Scanner = require('../scanner')
  , scanner = new Scanner()

scanner.on('scan', function(scannedCode, type) {
  log('Scanned', scannedCode, type)
})

scanner.start()

```