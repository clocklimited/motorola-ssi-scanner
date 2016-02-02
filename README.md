# motorola-ssi-scanner

Communicate with a Motorola SE3307 IG scanner using SSI over USB in node.js

## Scanner Version

The firmware should be at least `AABLS00-004-R00` for this driver to function correctly.

## Usage
```
var Scanner = require('../scanner')
  , scanner = new Scanner()

scanner.on('scan', function(scannedCode, type) {
  log('Scanned', scannedCode, type)
})

scanner.start()

```
