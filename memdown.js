var inherits          = require('inherits')
  , AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
  , AbstractIterator  = require('abstract-leveldown').AbstractIterator
  , ltgt              = require('ltgt')
  , noop              = function () {}
  , setImmediate      = global.setImmediate || process.nextTick
  , createRBT = require('functional-red-black-tree')

function gt(value) {
  return value > this._end
}
function gte(value) {
  return value >= this._end;
}
function lt(value) {
  return value < this._end;
}
function lte(value) {
  return value <= this._end;
}

function MemIterator (db, options) {
  AbstractIterator.call(this, db);
  this._limit   = options.limit;
  if (this._limit === -1) {
    this._limit = Infinity;
  }
  this.keyAsBuffer = options.keyAsBuffer !== false;
  this.valueAsBuffer = options.valueAsBuffer !== false;
  this._reverse   = options.reverse;
  this._options = options;
  this._done = 0;
  if (!this._reverse) {
    this._incr = 'next';
    this._start = ltgt.lowerBound(options);
    this._end = ltgt.upperBound(options);
    if (typeof this._start === 'undefined') {
      this._tree = db.tree.begin;
    } if (ltgt.lowerBoundInclusive(options)) {
      this._tree = db.tree.ge(this._start);
    } else {
      this._tree = db.tree.gt(this._start);
    }
    if (this._end) {
      if (ltgt.upperBoundInclusive(options)) {
        this._test = lte;
      } else {
        this._test = lt;
      }
    }
  } else {
    this._incr = 'prev';
    this._start = ltgt.upperBound(options);
    this._end = ltgt.lowerBound(options);
    if (typeof this._start === 'undefined') {
      this._tree = db.tree.end;
    } if (ltgt.upperBoundInclusive(options)) {
      this._tree = db.tree.le(this._start);
    } else {
      this._tree = db.tree.lt(this._start);
    }
    if (this._end) {
      if (ltgt.lowerBoundInclusive(options)) {
        this._test = gte;
      } else {
        this._test = gt;
      }
    }
  }
}

inherits(MemIterator, AbstractIterator)

MemIterator.prototype._next = function (callback) {

  if (this._done++ >= this._limit) {
    return setImmediate(callback);
  }
  if (!this._tree.valid) {
    return setImmediate(callback);
  }

  var key = this._tree.key;
  var value = this._tree.value;
  if (!this._test(key)) {
    return setImmediate(callback);
  }
  if (this.keyAsBuffer) {
    key = new Buffer(key);
  }

  if (this.valueAsBuffer){
    value = new Buffer(value);
  }
  this._tree[this._incr]();
  setImmediate(function () {
    callback(null, key, value);
  });
};

MemIterator.prototype._test = function () {
  return true;
};

function MemDOWN (location) {
  if (!(this instanceof MemDOWN))
    return new MemDOWN(location)

  AbstractLevelDOWN.call(this, typeof location == 'string' ? location : '')
  this.tree = createRBT();
}

inherits(MemDOWN, AbstractLevelDOWN)

MemDOWN.prototype._open = function (options, callback) {
  var self = this
  setImmediate(function () { callback(null, self) })
}

MemDOWN.prototype._put = function (key, value, options, callback) {
  this.tree = this.tree.remove(key).insert(key, value)
  setImmediate(callback)
}

MemDOWN.prototype._get = function (key, options, callback) {
  var value = this.tree.get(key)
  if (value === undefined) {
    // 'NotFound' error, consistent with LevelDOWN API
    var err = new Error('NotFound')
    return setImmediate(function () { callback(err) })
  }
  if (options.asBuffer !== false && !Buffer.isBuffer(value))
    value = new Buffer(String(value))
  setImmediate(function () {
    callback(null, value)
  })
}

MemDOWN.prototype._del = function (key, options, callback) {
  this.tree = this.tree.remove(key)
  setImmediate(callback)
}

MemDOWN.prototype._batch = function (array, options, callback) {
  var err
    , i = -1
    , key
    , value
    , len = array.length
  function errorCall() {
    callback(err);
  }
  while (++i < len) {
    if (array[i]) {
      key = Buffer.isBuffer(array[i].key) ? array[i].key : String(array[i].key)
      err = this._checkKey(key, 'key')
      if (err) return setImmediate(errorCall)
      if (array[i].type === 'del') {
        this._del(array[i].key, options, noop)
      } else if (array[i].type === 'put') {
        value = Buffer.isBuffer(array[i].value) ? array[i].value : String(array[i].value)
        err = this._checkKey(value, 'value')
        if (err) return setImmediate(errorCall)
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
