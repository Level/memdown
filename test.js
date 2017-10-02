var test = require('tape')
var testCommon = require('abstract-leveldown/testCommon')
var MemDOWN = require('./')
// var AbstractIterator = require('./').AbstractIterator
var testBuffer = require('./testdata_b64')
var ltgt = require('ltgt')
var Buffer = require('safe-buffer').Buffer
var noop = function () {}

/** compatibility with basic LevelDOWN API **/

// meh require('abstract-leveldown/abstract/leveldown-test').args(MemDOWN, test, testCommon)

require('abstract-leveldown/abstract/open-test').args(MemDOWN, test, testCommon)
require('abstract-leveldown/abstract/open-test').open(MemDOWN, test, testCommon)

require('abstract-leveldown/abstract/del-test').all(MemDOWN, test, testCommon)

require('abstract-leveldown/abstract/get-test').all(MemDOWN, test, testCommon)

require('abstract-leveldown/abstract/put-test').all(MemDOWN, test, testCommon)

require('abstract-leveldown/abstract/put-get-del-test').all(MemDOWN, test, testCommon, testBuffer)

require('abstract-leveldown/abstract/batch-test').all(MemDOWN, test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').all(MemDOWN, test, testCommon)

require('abstract-leveldown/abstract/close-test').close(MemDOWN, test, testCommon)

require('abstract-leveldown/abstract/iterator-test').all(MemDOWN, test, testCommon)

require('abstract-leveldown/abstract/ranges-test').all(MemDOWN, test, testCommon)

//
// TODO: destroy() test copied from localstorage-down
// https://github.com/pouchdb/pouchdb/blob/master/lib/adapters/leveldb.js#L1019
// move this test to abstract-leveldown
//

test('test .destroy', function (t) {
  var db = new MemDOWN('destroy-test')
  var db2 = new MemDOWN('other-db')

  db2.put('key2', 'value2', function (err) {
    t.notOk(err, 'no error')

    db.put('key', 'value', function (err) {
      t.notOk(err, 'no error')

      db.get('key', { asBuffer: false }, function (err, value) {
        t.notOk(err, 'no error')
        t.equal(value, 'value', 'should have value')

        db.close(function (err) {
          t.notOk(err, 'no error')

          db2.close(function (err) {
            t.notOk(err, 'no error')

            MemDOWN.destroy('destroy-test', function (err) {
              t.notOk(err, 'no error')

              var db3 = new MemDOWN('destroy-test')
              var db4 = new MemDOWN('other-db')

              db3.get('key', function (err, value) {
                t.ok(err, 'key is not there')

                db4.get('key2', { asBuffer: false }, function (err, value) {
                  t.notOk(err, 'no error')
                  t.equal(value, 'value2', 'should have value2')
                  t.end()
                })
              })
            })
          })
        })
      })
    })
  })
})

test('unsorted entry, sorted iterator', function (t) {
  var db = new MemDOWN('foo')

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

  testCommon.collectEntries(
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
  var db = new MemDOWN('foo2')
  var iterator

  db.open(noop)

  db.put('f', 'F', noop)
  db.put('c', 'C', noop)
  db.put('e', 'E', noop)

  iterator = db.iterator({ keyAsBuffer: false, valueAsBuffer: false })
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
  var db = new MemDOWN('foo3')
  var iterator

  db.open(noop)

  db.put('f', 'F', noop)
  db.put('a', 'A', noop)
  db.put('c', 'C', noop)
  db.put('e', 'E', noop)

  iterator = db.iterator({ keyAsBuffer: false, valueAsBuffer: false })
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
  var db = new MemDOWN('foo4')
  var iterator

  db.open(noop)

  db.put('a', 'A', noop)
  db.put('c', 'C', noop)

  iterator = db.iterator({
    keyAsBuffer: false,
    valueAsBuffer: false,
    start: 'b',
    reverse: true
  })

  iterator.next(function (err, key, value) {
    t.ifError(err, 'no next error')
    t.equal(key, 'a')
    t.equal(value, 'A')
    t.end()
  })
})

test('no location', function (t) {
  var db = new MemDOWN()
  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }
  var iterator

  db.open(noerr)

  db.put('a', 'A', noop)
  db.put('c', 'C', noop)

  iterator = db.iterator({
    keyAsBuffer: false,
    valueAsBuffer: false,
    start: 'b',
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
  var db = new MemDOWN()
  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }
  var iterator

  db.open(noerr)
  db.put('a', 'A', noop)
  db.put('b', 'B', noop)
  db.put('c', 'C', noop)

  iterator = db.iterator({
    keyAsBuffer: false,
    valueAsBuffer: false,
    start: 'a'
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
  var db = new MemDOWN()
  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }
  var iterator

  db.open(noerr)
  db.put(Buffer.from('a0', 'hex'), 'A', noop)

  iterator = db.iterator({ valueAsBuffer: false, lt: Buffer.from('ff', 'hex') })

  iterator.next(function (err, key, value) {
    t.notOk(err, 'no error')
    t.equal(key.toString('hex'), 'a0')
    t.equal(value, 'A')
    t.end()
  })
})

test('backing rbtree is buffer-aware', function (t) {
  var db = new MemDOWN()
  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }

  db.open(noerr)

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

  var db = new MemDOWN()
  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }

  db.open(noerr)

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
  var db = new MemDOWN('empty-buffer')
  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }

  db.open(noerr)

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
  var db = new MemDOWN('buffer-key')
  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }

  db.open(noerr)

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

test('array with holes in batch()', function (t) {
  var db = new MemDOWN('holey')
  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }

  db.open(noerr)

  db.batch([
    {
      type: 'put',
      key: 'key1',
      value: 'val1'
    },
    undefined,
    {
      type: 'put',
      key: 'key2',
      value: 'val2'
    }
  ], function (err) {
    t.error(err, 'no error')

    db.get('key1', { asBuffer: false }, function (err, val) {
      t.error(err, 'no error')
      t.same(val, 'val1')

      db.get('key2', { asBuffer: false }, function (err, val) {
        t.error(err, 'no error')
        t.same(val, 'val2')
        t.end()
      })
    })
  })
})

test('put multiple times', function (t) {
  t.plan(5)

  var db = new MemDOWN()

  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }

  db.open(noerr)

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

test('global store', function (t) {
  var db = new MemDOWN('foobar')

  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }

  db.open(noerr)

  db.put('key', 'val', function (err) {
    t.error(err, 'no error')
    db.get('key', { asBuffer: false }, function (err, val) {
      t.error(err, 'no error')
      t.same(val, 'val')

      var db2 = new MemDOWN('foobar')
      db2.open(noerr)

      db2.get('key', { asBuffer: false }, function (err, val) {
        t.error(err, 'no error')
        t.same(val, 'val')

        MemDOWN.clearGlobalStore()

        var db3 = new MemDOWN('foobar')
        db3.open(noerr)

        db3.get('key', { asBuffer: false }, function (err) {
          t.ok(err, 'should be an error')
          t.end()
        })
      })
    })
  })
})

test('global store, strict', function (t) {
  var db = new MemDOWN('foobar')

  var noerr = function (err) {
    t.error(err, 'opens correctly')
  }

  db.open(noerr)

  db.put('key', 'val', function (err) {
    t.error(err, 'no error')

    db.get('key', { asBuffer: false }, function (err, val) {
      t.error(err, 'no error')
      t.same(val, 'val')

      var db2 = new MemDOWN('foobar')
      db2.open(noerr)

      db2.get('key', { asBuffer: false }, function (err, val) {
        t.error(err, 'no error')
        t.same(val, 'val')

        MemDOWN.clearGlobalStore(true)

        var db3 = new MemDOWN('foobar')
        db3.open(noerr)

        db3.get('key', { asBuffer: false }, function (err) {
          t.ok(err, 'should be an error')
          t.end()
        })
      })
    })
  })
})

test('call .destroy twice', function (t) {
  var db = new MemDOWN('destroy-test')
  var db2 = new MemDOWN('other-db')

  db2.put('key2', 'value2', function (err) {
    t.notOk(err, 'no error')

    db.put('key', 'value', function (err) {
      t.notOk(err, 'no error')

      db.get('key', { asBuffer: false }, function (err, value) {
        t.notOk(err, 'no error')
        t.equal(value, 'value', 'should have value')

        db.close(function (err) {
          t.notOk(err, 'no error')

          db2.close(function (err) {
            t.notOk(err, 'no error')

            MemDOWN.destroy('destroy-test', function (err) {
              t.notOk(err, 'no error')

              MemDOWN.destroy('destroy-test', function (err) {
                t.ifError(err, 'no destroy error')

                var db3 = new MemDOWN('destroy-test')
                var db4 = new MemDOWN('other-db')

                db3.get('key', function (err, value) {
                  t.ok(err, 'key is not there')

                  db4.get('key2', { asBuffer: false }, function (err, value) {
                    t.notOk(err, 'no error')
                    t.equal(value, 'value2', 'should have value2')
                    t.end()
                  })
                })
              })
            })
          })
        })
      })
    })
  })
})
