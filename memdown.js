var inherits          = require('inherits')
  , AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
  , AbstractIterator  = require('abstract-leveldown').AbstractIterator
  , noop              = function () {}
  , setImmediate      = global.setImmediate || process.nextTick

function toKey (key) {
  return typeof key == 'string' ? '$' + key : JSON.stringify(key)
}

function sortedIndexOf (arr, item) {
  var low = 0, high = arr.length, mid
  while (low < high) {
    mid = (low + high) >>> 1
    arr[mid] < item ? low = mid + 1 : high = mid
  }
  return low
}

function MemIterator (db, options) {
  AbstractIterator.call(this, db)
  this._reverse = options.reverse
  this._limit   = options.limit
  this._count   = 0
  this._end     = options.end
  this._start   = options.start
  this._gt      = options.gt
  this._gte     = options.gte
  this._lt      = options.lt
  this._lte     = options.lte
  this._keys    = []

  var i

  if (this._start) {
    this._pos = sortedIndexOf(this.db._keys, this._start)
    if (this._reverse) {
      if (options.exclusiveStart || this._pos >= this.db._len || this.db._keys[this._pos] !== this._start) {
        this._pos--
      }
    } else if (  options.exclusiveStart
              && this._pos < this.db._len
              && this.db._keys[this._pos] === this._start) {
      this._pos++
    }
  } else {
    this._pos = this._reverse ? this.db._len - 1 : 0
  }

  // copy the keys that we need so that they're not affected by puts/deletes
  if (this._pos >= 0) {
    this._keys = this._reverse ? this.db._keys.slice(0, this._pos + 1) : this.db._keys.slice(this._pos)
    this._len = this._keys.length;
    this._pos = this._reverse ? this._len - 1 : 0
  }
}

inherits(MemIterator, AbstractIterator)

MemIterator.prototype._next = function (callback) {
  var self  = this
    , key
    , value

  if (self._pos >= self._len || self._pos < 0)
    return setImmediate(callback)

  key = self._keys[self._pos]

  if (!!self._end && (self._reverse ? key < self._end : key > self._end))
    return setImmediate(callback)


  if (!!self._limit && self._limit > 0 && self._count++ >= self._limit)
    return setImmediate(callback)

  if (  (this._lt  && key >= this._lt)
     || (this._lte && key > this._lte)
     || (this._gt  && key <= this._gt)
     || (this._gte && key < this._gte))
    return setImmediate(callback)

  value = self.db._store[toKey(key)]
  self._pos += self._reverse ? -1 : 1

  setImmediate(function () { callback(null, key, value) })
}

function MemDOWN (location) {
  if (!(this instanceof MemDOWN))
    return new MemDOWN(location)

  AbstractLevelDOWN.call(this, typeof location == 'string' ? location : '')
  this._store = {}
  this._keys  = []
  this._len = 0;
}

inherits(MemDOWN, AbstractLevelDOWN)

MemDOWN.prototype._open = function (options, callback) {
  var self = this
  setImmediate(function () { callback(null, self) })
}

MemDOWN.prototype._put = function (key, value, options, callback) {
  var ix = sortedIndexOf(this._keys, key)
  if (ix >= this._len || this._keys[ix] != key) {
    this._keys.splice(ix, 0, key)
    this._len++;
  }
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
  var ix = sortedIndexOf(this._keys, key)
  if (this._keys[ix] == key) {
    this._keys.splice(ix, 1)
    this._len--;
  }
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
