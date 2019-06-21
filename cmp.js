'use strict'

var Buffer = require('safe-buffer').Buffer
var toString = Object.prototype.toString

function cmp (a, b) {
  // Same logic as https://www.w3.org/TR/IndexedDB-2/#key-construct
  var ta = type(a)
  var tb = type(b)

  if (ta !== tb) {
    // Sort order: number, date, string (lexicographic), binary (bitwise), array (componentwise).
    if (ta === 'array' && (tb === 'binary' || tb === 'string' || tb === 'date' || tb === 'number')) return 1
    if (tb === 'array' && (ta === 'binary' || ta === 'string' || ta === 'date' || ta === 'number')) return -1
    if (ta === 'binary' && (tb === 'string' || tb === 'date' || tb === 'number')) return 1
    if (tb === 'binary' && (ta === 'string' || ta === 'date' || ta === 'number')) return -1
    if (ta === 'string' && (tb === 'date' || tb === 'number')) return 1
    if (tb === 'string' && (ta === 'date' || ta === 'number')) return -1
    if (ta === 'date' && (tb === 'number')) return 1

    /* istanbul ignore else (because behavior of unsupported types is undefined atm) */
    if (tb === 'date' && (ta === 'number')) return -1
  } else {
    if (ta === 'binary') return bitwise(a, b)
    if (ta === 'array') return componentwise(a, b)
  }

  return a < b ? -1 : a > b ? 1 : 0
}

module.exports = cmp

function bitwise (a, b) {
  for (var i = 0, l = Math.min(a.length, b.length); i < l; i++) {
    var c = a[i] - b[i]
    if (c) return c
  }

  return a.length - b.length
}

function componentwise (a, b) {
  for (var i = 0, l = Math.min(a.length, b.length); i < l; i++) {
    var c = cmp(a[i], b[i])
    if (c) return c
  }

  return a.length - b.length
}

function type (key) {
  if (typeof key === 'string') return 'string'
  if (typeof key === 'number') return 'number'
  if (Buffer.isBuffer(key)) return 'binary'
  if (Array.isArray(key)) return 'array'

  var o = toString.call(key)

  if (o === '[object Date]') return 'date'
  if (o === '[object Int8Array]') return 'binary'
  if (o === '[object Int16Array]') return 'binary'
  if (o === '[object Int32Array]') return 'binary'
  if (o === '[object Uint8Array]') return 'binary'
  if (o === '[object Uint8ClampedArray]') return 'binary'
  if (o === '[object Uint16Array]') return 'binary'
  if (o === '[object Uint32Array]') return 'binary'
  if (o === '[object Float32Array]') return 'binary'
  if (o === '[object Float64Array]') return 'binary'

  return o
}
