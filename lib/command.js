const createGenerateChecksum = require('./checksum').create

const getCommand = (opCode, payload) => {
  // Byte Sequence
  // [Length, OpCode, Source, reserved, [payload], checksum High, Checksum Low]
  const length = 0x00
    , source = 0x04 // coming from application.
    , reserved = 0x00

  let message =
    [ length
    , opCode
    , source
    , reserved
    ]

  if (payload !== undefined && payload !== null) {
    if (!Array.isArray(payload)) payload = [ payload ]
    message = message.concat(payload)
  }

  message[0] = getLengthAsHex(message)
  return message.concat(createGenerateChecksum(message))
}

const getLengthAsHex = (data) => {
  // Get the length of the message in hex
  if (data.length > 0xff) {
    throw new Error('Length is greater than 255 (0xff) and is not supported')
  }
  return data.length
}

module.exports = getCommand
