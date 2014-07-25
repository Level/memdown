var inherits          = require('inherits')
  , AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
  , AbstractIterator  = require('abstract-leveldown').AbstractIterator
  , keydir            = require('keydir')
  , noop              = function () {}
  , setImmediate      = global.setImmediate || process.nextTick

function toKey (key) {
  return typeof key == 'string' ? '$' + key : JSON.stringify(key)
}


function MemIterator (db, options) {
  AbstractIterator.call(this, db)
  this._limit   = options.limit
  this._reverse   = options.reverse
  this._keys    = db._keys.range(options)
  this._options = options

  this._pos = 0
}

inherits(MemIterator, AbstractIterator)

MemIterator.prototype._next = function (callback) {
  var self  = this
    , key
    , value

  if (self._pos >= self._keys.length)
    return setImmediate(callback)

  key = self._keys[self._pos]

  value = self.db._store[toKey(key)]

  this._pos++

  setImmediate(function () { callback(null, key, value) })
}

function MemDOWN (location) {
  if (!(this instanceof MemDOWN))
    return new MemDOWN(location)

  AbstractLevelDOWN.call(this, typeof location == 'string' ? location : '')
  this._store = {}
  this._keys  = keydir()
}

inherits(MemDOWN, AbstractLevelDOWN)

MemDOWN.prototype._open = function (options, callback) {
  var self = this
  setImmediate(function () { callback(null, self) })
}

MemDOWN.prototype._put = function (key, value, options, callback) {
  this._keys.put(key)
  key = toKey(key) // safety, to avoid key='__proto__'-type skullduggery 
  this._store[key] = value
  setImmediate(callback)
}

MemDOWN.prototype._get = function (key, options, callback) {
  var value = this._store[toKey(key)]
  if (value === undefined) {
    // 'NotFound' error, consistent with LevelDOWN API
    return setImmediate(function () { callback(new Error('NotFound')) })
  }
  if (options.asBuffer !== false && !Buffer.isBuffer(value))
    value = new Buffer(String(value))
  setImmediate(function () {
    callback(null, value)
  })
}

MemDOWN.prototype._del = function (key, options, callback) {
  this._keys.del(key)
  delete this._store[toKey(key)]
  setImmediate(callback)
}

MemDOWN.prototype._batch = function (array, options, callback) {
  var err
    , i = -1
    , key
    , value
    , len = array.length

  while (++i < len) {
    if (array[i]) {
      key = Buffer.isBuffer(array[i].key) ? array[i].key : String(array[i].key)
      err = this._checkKeyValue(key, 'key')
      if (err) return setImmediate(function () { callback(err) })
      if (array[i].type === 'del') {
        this._del(array[i].key, options, noop)
      } else if (array[i].type === 'put') {
        value = Buffer.isBuffer(array[i].value) ? array[i].value : String(array[i].value)
        err = this._checkKeyValue(value, 'value')
        if (err) return setImmediate(function () { callback(err) })
        this._put(key, value, options, noop)
      }
    }
  }
  
  setImmediate(callback)
}

MemDOWN.prototype._iterator = function (options) {
  return new MemIterator(this, options)
}

MemDOWN.prototype._isBuffer = function (obj) {
  return Buffer.isBuffer(obj)
}

module.exports = MemDOWN
