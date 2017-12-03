# memdown <img alt="LevelDB Logo" height="20" src="http://leveldb.org/img/logo.svg" />

> In-memory [`abstract-leveldown`] store for Node.js and browsers.

[![Travis](https://secure.travis-ci.org/Level/memdown.png)](http://travis-ci.org/Level/memdown) [![Coverage Status](https://coveralls.io/repos/Level/memdown/badge.svg?branch=master&service=github)](https://coveralls.io/github/Level/memdown?branch=master) [![npm](https://img.shields.io/npm/v/memdown.svg)](https://www.npmjs.com/package/memdown) [![npm](https://img.shields.io/npm/dm/memdown.svg)](https://www.npmjs.com/package/memdown) [![Greenkeeper badge](https://badges.greenkeeper.io/Level/memdown.svg)](https://greenkeeper.io/)

## Example

**If you are upgrading:** please see [the changelog](./CHANGELOG.md).

```js
const levelup = require('levelup')
const memdown = require('memdown')

const db = levelup(memdown())

db.put('hey', 'you', (err) => {
  if (err) throw err

  db.get('hey', { asBuffer: false }, (err, value) => {
    if (err) throw err
    console.log(value) // 'you'
  })
})
```

Your data is discarded when the process ends or you release a reference to the database. Note as well, though the internals of `memdown` operate synchronously - [`levelup`] does not.

Browser support
----

[![Sauce Test Status](https://saucelabs.com/browser-matrix/level-ci.svg)](https://saucelabs.com/u/level-ci)

`memdown` requires a ES5-capable browser. If you're using one that's isn't (e.g. PhantomJS, Android < 4.4, IE < 10) then you will need [es5-shim](https://github.com/es-shims/es5-shim).

## Data types

Unlike [`leveldown`], `memdown` does not stringify keys or values. This means that in addition to Buffers, you can store any JS type without the need for [`encoding-down`]. For keys for example, you could use Buffers or strings, which sort lexicographically, or numbers, even Dates, which sort naturally. The only exceptions are `null` and `undefined`. Keys of that type are rejected; values of that type are converted to empty strings.

```js
const db = levelup(memdown())

db.put(12, true, (err) => {
  if (err) throw err

  db.createReadStream({
    keyAsBuffer: false,
    valueAsBuffer: false
  }).on('data', (entry) => {
    console.log(typeof entry.key) // 'number'
    console.log(typeof entry.value) // 'boolean'
  })
})
```

If you desire normalization for keys and values (e.g. to stringify numbers), wrap `memdown` with [`encoding-down`]. Alternatively install [`level-mem`] which conveniently bundles [`levelup`], `memdown` and [`encoding-down`]. Such an approach is also recommended if you want to achieve universal (isomorphic) behavior. For example, you could have [`leveldown`] in a backend and `memdown` in the frontend.

```js
const encode = require('encoding-down')
const db = levelup(encode(memdown()))

db.put(12, true, (err) => {
  if (err) throw err

  db.createReadStream({
    keyAsBuffer: false,
    valueAsBuffer: false
  }).on('data', (entry) => {
    console.log(typeof entry.key) // 'string'
    console.log(typeof entry.value) // 'string'
  })
})
```

## Snapshot guarantees

A `memdown` store is backed by [a fully persistent data structure](https://www.npmjs.com/package/functional-red-black-tree) and thus has snapshot guarantees. Meaning that reads operate on a snapshot in time, unaffected by simultaneous writes. Do note `memdown` cannot uphold this guarantee for (copies of) object references. If you store object values, be mindful of mutating referenced objects:

```js
const db = levelup(memdown())
const obj = { thing: 'original' }

db.put('key', obj, (err) => {
  obj.thing = 'modified'

  db.get('key', { asBuffer: false }, (err, value) => {
    console.log(value === obj) // true
    console.log(obj.thing) // 'modified'
  })
})
```

Conversely, when `memdown` is wrapped with [`encoding-down`] it stores representations rather than references.

```js
const encode = require('encoding-down')

const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
const obj = { thing: 'original' }

db.put('key', obj, (err) => {
  obj.thing = 'modified'

  db.get('key', { asBuffer: false }, (err, value) => {
    console.log(value === obj) // false
    console.log(obj.thing) // 'original'
  })
})
```

Test
----

In addition to the regular `npm test`, you can test `memdown` in a browser of choice with:

    npm run test-browser-local

To check code coverage:

    npm run coverage

Licence
---

`memdown` is Copyright (c) 2013-2017 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licensed under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.

[`abstract-leveldown`]: https://github.com/Level/abstract-leveldown
[`levelup`]: https://github.com/Level/levelup
[`encoding-down`]: https://github.com/Level/encoding-down
[`leveldown`]: https://github.com/Level/leveldown
[`level-mem`]: https://github.com/Level/mem
