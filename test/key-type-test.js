'use strict'

var concat = require('level-concat-iterator')
var bytes = [0, 127]

// Test all supported key types by asserting that output is the same as input.
// Same as IndexedDB Second Edition, except that memdown returns views as-is,
// while IDB returns ArrayBuffers. This is a smoke test because memdown does not
// convert inputs in any way, so the assertions are not far from key === key.
var types = [
  { type: 'number', key: -20 },
  { type: '+Infinity', key: Infinity },
  { type: '-Infinity', key: -Infinity },
  { type: 'string', key: 'test' },
  { type: 'Date', ctor: true, key: new Date() },
  { type: 'Array', ctor: true, key: [0, '1'] },
  { type: 'ArrayBuffer', ctor: true, key: ta(Buffer).buffer },
  { type: 'Uint8Array', ctor: true, createKey: ta },
  { name: 'Buffer', type: 'Uint8Array', ctor: true, key: ta(Buffer) },
  { type: 'Int8Array', ctor: true, allowFailure: true, createKey: ta },
  { type: 'Uint8ClampedArray', ctor: true, allowFailure: true, createKey: ta },
  { type: 'Int16Array', ctor: true, allowFailure: true, createKey: ta },
  { type: 'Uint16Array', ctor: true, allowFailure: true, createKey: ta },
  { type: 'Int32Array', ctor: true, allowFailure: true, createKey: ta },
  { type: 'Uint32Array', ctor: true, allowFailure: true, createKey: ta },
  { type: 'Float32Array', ctor: true, allowFailure: true, createKey: ta },
  { type: 'Float64Array', ctor: true, allowFailure: true, createKey: ta }
]

module.exports = function (testCommon) {
  var db
  var test = testCommon.test

  test('setUp', testCommon.setUp)
  test('open', function (t) {
    db = testCommon.factory()
    db.open(t.end.bind(t))
  })

  types.forEach(function (item) {
    var testName = item.name || item.type

    test('key type: ' + testName, function (t) {
      var Constructor = item.ctor ? global[item.type] : null
      var skip = item.allowFailure ? 'pass' : 'fail'
      var input = item.key

      if (item.ctor && !Constructor) {
        t[skip]('constructor is undefined in this environment')
        return t.end()
      }

      if (item.createKey) {
        try {
          input = item.createKey(Constructor)
        } catch (err) {
          t[skip]('constructor is not spec-compliant in this environment')
          return t.end()
        }
      }

      db.put(input, testName, function (err) {
        t.ifError(err, 'no put error')

        db.get(input, { asBuffer: false }, function (err, value) {
          t.ifError(err, 'no get error')
          t.same(value, testName, 'correct value')

          var it = db.iterator({ keyAsBuffer: false, valueAsBuffer: false })

          concat(it, function (err, entries) {
            t.ifError(err, 'no iterator error')
            t.is(entries.length, 1, '1 entry')

            var key = entries[0].key
            var value = entries[0].value

            if (Constructor) {
              var expected = '[object ' + item.type + ']'
              var actual = Object.prototype.toString.call(key)

              t.is(actual, expected, 'prototype')
              t.ok(key instanceof Constructor, 'key is instanceof ' + item.type)
              t.same(key, input, 'correct key')
            } else {
              t.is(key, input, 'correct key')
            }

            t.same(value, testName, 'correct value')

            db.del(input, function (err) {
              t.ifError(err, 'no del error')
              t.end()
            })
          })
        })
      })
    })
  })

  test('close', function (t) { db.close(t.end.bind(t)) })
  test('tearDown', testCommon.tearDown)
}

// Replacement for TypedArray.from(bytes)
function ta (TypedArray) {
  var arr = new TypedArray(bytes.length)
  for (var i = 0; i < bytes.length; i++) arr[i] = bytes[i]
  return arr
}
