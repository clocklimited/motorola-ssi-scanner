const isEqual = require('lodash.isequal')

const check = (data) => {
  const arrayData = Array.prototype.slice.call(data)
  return isEqual(create(arrayData.slice(0, -2)), arrayData.slice(-2))
}

const create = (data) => {
  const sum = Array.prototype.slice.call(data).reduce((a, b) => Number(a) + Number(b))

  // get the 2's complement of the sum of the message
  const checksum = ~sum + 1 >>> 0
  return [ checksum >>> 8 & 255, checksum & 255 ]
}

module.exports =
  { create: create
    , check: check
  }
