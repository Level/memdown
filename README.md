# MemDOWN [![Build Status](https://secure.travis-ci.org/rvagg/node-memdown.png)](http://travis-ci.org/rvagg/node-memdown)

An drop-in replacement for [LevelUP](https://github.com/rvagg/node-levelup) that works in memory only. Can be used as a back-end for [LevelUP](https://github.com/rvagg/node-levelup) rather than an actual LevelDB store.

As of version 0.7, LevelUP allows you to pass a `'db'` option when you create a new instance. This will override the default LevelDOWN store with a LevelDOWN API compatible object. MemDOWN conforms exactly to the LevelDOWN API but only performs operations in memory, so your data is discarded when the process ends or you release a reference to the database.

## Example

```js
var MemDOWN = require('memdown')
  , levelup = require('levelup')
  , factory = function (location) { return new MemDOWN(location) }
  , db = levelup('/does/not/matter', { db: factory })

db.put('name', 'Yuri Irsenovich Kim')
db.put('dob', '16 February 1941')
db.put('spouse', 'Kim Young-sook')
db.put('occupation', 'Clown')

db.readStream()
  .on('data', console.log)
  .on('close', function () { console.log('Show\'s over folks!') })
```

Note in this example we're not even bothering to use callbacks on our `.put()` methods even though they are async. We know that MemDOWN operates immediately so the data will go straight into the store.

Running our example gives:

```
{ key: 'dob', value: '16 February 1941' }
{ key: 'name', value: 'Yuri Irsenovich Kim' }
{ key: 'occupation', value: 'Clown' }
{ key: 'spouse', value: 'Kim Young-sook' }
Show's over folks!
```

## Licence

MemDOWN is Copyright (c) 2013 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licensed under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.