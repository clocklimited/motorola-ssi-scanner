exports.diagnostics = new Buffer([0x0a,0x80,0x04,0x00,0x00,0x06,0x20,0x00,0xff,0xff,0xfd,0x4e])

exports.getCommand = function (opCode, payload, cb) {
  // Byte Sequence
  // [Length, OpCode, Source, reserved, [payload], checksum High, Checksum Low]
  var length = 0x00
    , source = 0x04 // coming from application.
    , reserved = 0x00

  payload = payload || 0x00

  var message =
    [ length
    , opCode
    , source
    , reserved
    , payload
    ]

  getLengthAsHex(message, function(error, data) {
    if (!error) {
      generateChecksum(data, function(data) {
        cb(new Buffer(data))
      })
    }
  })
}

var getLengthAsHex = function(data, cb) {
  var error = null
  // Get the length of the message in hex
  if (data.length > 0xff) {
    error = new Error('Length is greater than 255 (0xff) and is not supported')
  } else {
    data[0] = data.length.toString(16)
  }
  cb(error, data)
}

var generateChecksum = function(data, cb) {
  var sum = data.reduce(function (a, b) {
    return a + b
  })
  // get the 2's complement of the sum of the message
  var checksum = (~sum + 1 >>> 0).toString(16)
  data.push(checksum.substring(4,6))
  data.push(checksum.substring(6))
  cb(data)
}