var tap   = require('tap')
  , testCommon = require('leveldown/test/common')
  , MemDOWN = require('./')
  //, AbstractIterator = require('./').AbstractIterator

  , factory = function (location) {
      return new MemDOWN(location)
    }

/*** compatibility with basic LevelDOWN API ***/

require('leveldown/test/leveldown-test').args(factory)

require('leveldown/test/open-test').args(factory)

require('leveldown/test/del-test').all(factory)

require('leveldown/test/get-test').all(factory)

require('leveldown/test/put-test').all(factory)

require('leveldown/test/put-get-del-test').all(factory)

require('leveldown/test/approximate-size-test').setUp(factory)
require('leveldown/test/approximate-size-test').args(factory)

require('leveldown/test/close-test').close(factory)

require('leveldown/test/iterator-test').all(factory)

tap.test('unsorted entry, sorted iterator', function (t) {
  var db = new MemDOWN('foo')
    , noop = function () {}
  db.open(noop)
  db.put('f', 'F', noop)
  db.put('a', 'A', noop)
  db.put('c', 'C', noop)
  db.put('e', 'E', noop)
  db.batch([
      { type: 'put', key: 'd', value: 'D' }
    , { type: 'put', key: 'b', value: 'B' }
    , { type: 'put', key: 'g', value: 'G' }
  ], noop)
  testCommon.collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false }), function (err, data) {
    t.notOk(err, 'no error')
    t.equal(data.length, 7, 'correct number of entries')
    var expected = [
        { key: 'a', value: 'A' }
      , { key: 'b', value: 'B' }
      , { key: 'c', value: 'C' }
      , { key: 'd', value: 'D' }
      , { key: 'e', value: 'E' }
      , { key: 'f', value: 'F' }
      , { key: 'g', value: 'G' }
    ]
    t.deepEqual(data, expected)
    t.end()
  })
})