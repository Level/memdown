var test = require('tape')
var suite = require('abstract-leveldown/test')
var concat = require('level-concat-iterator')
var memdown = require('.').default
var ltgt = require('ltgt')
var Buffer = require('safe-buffer').Buffer
var noop = function () { }

var testCommon = suite.common({
  test: test,
  factory: function () {
    return memdown()
  },

  // Opt-in to new clear() tests
  clear: true,

  // Opt-out of unsupported features
  createIfMissing: false,
  errorIfExists: false
})

// Test abstract-leveldown compliance
suite(testCommon)

// Additional tests for this implementation
test('unsorted entry, sorted iterator', function (t) {
  var db = testCommon.factory()

  db.open(noop)

  db.put('f', 'F', noop)
  db.put('a', 'A', noop)
  db.put('c', 'C', noop)
  db.put('e', 'E', noop)

  db.batch(
    [
      { type: 'put', key: 'd', value: 'D' },
      { type: 'put', key: 'b', value: 'B' },
      { type: 'put', key: 'g', value: 'G' }
    ],
    noop
  )

  concat(
    db.iterator({ keyAsBuffer: false, valueAsBuffer: false }),
    function (err, data) {
      t.notOk(err, 'no error')
      t.equal(data.length, 7, 'correct number of entries')

      var expected = [
        { key: 'a', value: 'A' },
        { key: 'b', value: 'B' },
        { key: 'c', value: 'C' },
        { key: 'd', value: 'D' },
        { key: 'e', value: 'E' },
        { key: 'f', value: 'F' },
        { key: 'g', value: 'G' }
      ]

      t.deepEqual(data, expected)
      t.end()
    }
  )
})

test('reading while putting', function (t) {
  var db = testCommon.factory()

  db.open(noop)

  db.put('f', 'F', noop)
  db.put('c', 'C', noop)
  db.put('e', 'E', noop)

  var iterator = db.iterator({ keyAsBuffer: false, valueAsBuffer: false })

  iterator.next(function (err, key, value) {
    t.ifError(err, 'no next error')
    t.equal(key, 'c')
    t.equal(value, 'C')

    db.put('a', 'A', noop)

    iterator.next(function (err, key, value) {
      t.ifError(err, 'no next error')
      t.equal(key, 'e')
      t.equal(value, 'E')
      t.end()
    })
  })
})

test('reading while deleting', function (t) {
  var db = testCommon.factory()

  db.open(noop)

  db.put('f', 'F', noop)
  db.put('a', 'A', noop)
  db.put('c', 'C', noop)
  db.put('e', 'E', noop)

  var iterator = db.iterator({ keyAsBuffer: false, valueAsBuffer: false })

  iterator.next(function (err, key, value) {
    t.ifError(err, 'no next error')
    t.equal(key, 'a')
    t.equal(value, 'A')

    db.del('a', noop)

    iterator.next(function (err, key, value) {
      t.ifError(err, 'no next error')
      t.equal(key, 'c')
      t.equal(value, 'C')
      t.end()
    })
  })
})

test('reverse ranges', function (t) {
  var db = testCommon.factory()

  db.open(noop)

  db.put('a', 'A', noop)
  db.put('c', 'C', noop)

  var iterator = db.iterator({
    keyAsBuffer: false,
    valueAsBuffer: false,
    lte: 'b',
    reverse: true
  })

  iterator.next(function (err, key, value) {
    t.ifError(err, 'no next error')
    t.equal(key, 'a')
    t.equal(value, 'A')
    t.end()
  })
})

test('delete while iterating', function (t) {
  var db = testCommon.factory()

  db.open(function (err) {
    t.error(err, 'opens correctly')
  })

  db.put('a', 'A', noop)
  db.put('b', 'B', noop)
  db.put('c', 'C', noop)

  var iterator = db.iterator({
    keyAsBuffer: false,
    valueAsBuffer: false,
    gte: 'a'
  })

  iterator.next(function (err, key, value) {
    t.ifError(err, 'no next error')
    t.equal(key, 'a')
    t.equal(value, 'A')

    db.del('b', function (err) {
      t.notOk(err, 'no error')

      iterator.next(function (err, key, value) {
        t.notOk(err, 'no error')
        t.equals(key, 'b')
        t.equal(value, 'B')
        t.end()
      })
    })
  })
})

test('iterator with byte range', function (t) {
  var db = testCommon.factory()

  db.open(function (err) {
    t.error(err, 'opens correctly')
  })

  db.put(Buffer.from('a0', 'hex'), 'A', noop)

  var iterator = db.iterator({ valueAsBuffer: false, lt: Buffer.from('ff', 'hex') })

  iterator.next(function (err, key, value) {
    t.notOk(err, 'no error')
    t.equal(key.toString('hex'), 'a0')
    t.equal(value, 'A')
    t.end()
  })
})

test('iterator does not clone buffers', function (t) {
  t.plan(3)

  var db = testCommon.factory()
  var buf = Buffer.from('a')

  db.open(noop)
  db.put(buf, buf, noop)

  concat(db.iterator(), function (err, entries) {
    t.ifError(err, 'no iterator error')
    t.ok(entries[0].key === buf, 'key is same buffer')
    t.ok(entries[0].value === buf, 'value is same buffer')
  })
})

test('iterator stringifies buffer input', function (t) {
  t.plan(3)

  var db = testCommon.factory()

  db.open(noop)
  db.put(1, 2, noop)

  concat(db.iterator(), function (err, entries) {
    t.ifError(err, 'no iterator error')
    t.same(entries[0].key, Buffer.from('1'), 'key is stringified')
    t.same(entries[0].value, Buffer.from('2'), 'value is stringified')
  })
})

test('backing rbtree is buffer-aware', function (t) {
  var db = testCommon.factory()

  db.open(function (err) {
    t.error(err, 'opens correctly')
  })

  var one = Buffer.from('80', 'hex')
  var two = Buffer.from('c0', 'hex')

  t.ok(two.toString() === one.toString(), 'would be equal when not buffer-aware')
  t.ok(ltgt.compare(two, one) > 0, 'but greater when buffer-aware')

  db.put(one, 'one', function (err) {
    t.notOk(err, 'no error')

    db.get(one, { asBuffer: false }, function (err, value) {
      t.notOk(err, 'no error')
      t.equal(value, 'one', 'value one ok')

      db.put(two, 'two', function (err) {
        t.notOk(err, 'no error')

        db.get(one, { asBuffer: false }, function (err, value) {
          t.notOk(err, 'no error')
          t.equal(value, 'one', 'value one is the same')
          t.end()
        })
      })
    })
  })
})

test('empty value in batch', function (t) {
  t.plan(6)

  var db = testCommon.factory()

  db.open(function (err) {
    t.error(err, 'opens correctly')
  })

  db.batch([
    {
      type: 'put',
      key: 'empty-string',
      value: ''
    },
    {
      type: 'put',
      key: 'empty-buffer',
      value: Buffer.alloc(0)
    }
  ], function (err) {
    t.error(err, 'no error')

    db.get('empty-string', function (err, val) {
      t.error(err, 'no error')
      t.same(val, Buffer.alloc(0), 'empty string')
    })

    db.get('empty-buffer', function (err, val) {
      t.error(err, 'no error')
      t.same(val, Buffer.alloc(0), 'empty buffer')
    })
  })
})

test('empty buffer key in batch', function (t) {
  var db = testCommon.factory()

  db.open(function (err) {
    t.error(err, 'opens correctly')
  })

  db.batch([{
    type: 'put',
    key: Buffer.alloc(0),
    value: ''
  }], function (err) {
    t.ok(err, 'got an error')
    t.end()
  })
})

test('buffer key in batch', function (t) {
  var db = testCommon.factory()

  db.open(function (err) {
    t.error(err, 'opens correctly')
  })

  db.batch([{
    type: 'put',
    key: Buffer.from('foo', 'utf8'),
    value: 'val1'
  }], function (err) {
    t.error(err, 'no error')

    db.get(Buffer.from('foo', 'utf8'), { asBuffer: false }, function (err, val) {
      t.error(err, 'no error')
      t.same(val, 'val1')
      t.end()
    })
  })
})

test('put multiple times', function (t) {
  t.plan(5)

  var db = testCommon.factory()

  db.open(function (err) {
    t.error(err, 'opens correctly')
  })

  db.put('key', 'val', function (err) {
    t.error(err, 'no error')

    db.put('key', 'val2', function (err) {
      t.error(err, 'no error')

      db.get('key', { asBuffer: false }, function (err, val) {
        t.error(err, 'no error')
        t.same(val, 'val2')
      })
    })
  })
})

test('put as string, get as buffer and vice versa', function (t) {
  t.plan(7)

  var db = testCommon.factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open')

    db.put('a', 'a', function (err) {
      t.ifError(err, 'no put error')

      db.get(Buffer.from('a'), { asBuffer: true }, function (err, value) {
        t.ifError(err, 'no get error')
        t.same(value, Buffer.from('a'), 'got value')
      })
    })

    db.put(Buffer.from('b'), Buffer.from('b'), function (err) {
      t.ifError(err, 'no put error')

      db.get('b', { asBuffer: false }, function (err, value) {
        t.ifError(err, 'no get error')
        t.is(value, 'b', 'got value')
      })
    })
  })
})

test('put as string, iterate as buffer', function (t) {
  t.plan(4)

  var db = testCommon.factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open')

    db.put('a', 'a', function (err) {
      t.ifError(err, 'no put error')

      concat(db.iterator({ keyAsBuffer: true, valueAsBuffer: true }), function (err, entries) {
        t.ifError(err, 'no concat error')
        t.same(entries, [{ key: Buffer.from('a'), value: Buffer.from('a') }])
      })
    })
  })
})

test('put as buffer, iterate as string', function (t) {
  t.plan(4)

  var db = testCommon.factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open')

    db.put(Buffer.from('a'), Buffer.from('a'), function (err) {
      t.ifError(err, 'no put error')

      concat(db.iterator({ keyAsBuffer: false, valueAsBuffer: false }), function (err, entries) {
        t.ifError(err, 'no concat error')
        t.same(entries, [{ key: 'a', value: 'a' }])
      })
    })
  })
})

test('number keys', function (t) {
  t.plan(4)

  var db = testCommon.factory()
  var numbers = [-Infinity, 0, 12, 2, +Infinity]
  var strings = numbers.map(String)
  var buffers = numbers.map(stringBuffer)

  db.open(noop)
  db.batch(numbers.map(putKey), noop)

  var iterator1 = db.iterator({ keyAsBuffer: false })
  var iterator2 = db.iterator({ keyAsBuffer: true })

  concat(iterator1, function (err, entries) {
    t.ifError(err, 'no iterator error')
    t.same(entries.map(getKey), strings, 'sorts lexicographically')
  })

  concat(iterator2, function (err, entries) {
    t.ifError(err, 'no iterator error')
    t.same(entries.map(getKey), buffers, 'buffer input is stringified')
  })
})

function stringBuffer (value) {
  return Buffer.from(String(value))
}

function putKey (key) {
  return { type: 'put', key: key, value: 'value' }
}

function getKey (entry) {
  return entry.key
}
