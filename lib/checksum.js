var isEqual = require('lodash.isequal')

module.exports =
	{ create: create
	, check: check
	}

function check(data) {
	var arrayData = Array.prototype.slice.call(data)
	return isEqual(create(arrayData.slice(0, -2)), arrayData.slice(-2))
}

function create(data) {
  var sum = Array.prototype.slice.call(data).reduce(function (a, b) {
    return Number(a) + Number(b)
  })

  // get the 2's complement of the sum of the message
  var checksum = ~sum + 1 >>> 0
  return [ checksum >>> 8 & 255, checksum & 255 ]
}
