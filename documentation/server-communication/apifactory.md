---
title: API Factory
description: Superclass which provides basic caching mechanisms and common functions
source: http://oxpedia.org/wiki/index.php?title=AppSuite:API_Factory
---

It's used as superclass for most of our module and common APIs.

- located: `io.ox/core/io.ox/core/api/factory`

- uses: `io.ox/core/io.ox/core/http.js`

- purposes

  - factory for creating api instance
  - instance can be customized via submitted options request
  - provided functions for requesting server handles caching/event triggering

# example usage

- use factory to get customized api instance
- customizable via options object to extend or overwrite

```javascript
//get factory reference
require(['io.ox/core/api/factory'], function (factory) {
    //get customized api instance
    var myapi = factory({
        //defines path/api for request
        module: 'contacts',
        //defining default parameters for requests using 
        //apis get, getAll and getList functions
        requests: {
            all: {
                action: 'all',
                folder: '6',
                order: 'asc'
            },
            list: {
                action: 'list',
                columns: '20,1,101,500,501,502,505,520'
            },
            get: {
                action: 'get'
            }
        },
        params: {
            all: function (options) {
                 //fix column
                if (options.sort === 'thread') {
                    options.sort = 610;
                }
                return options;
            }
        }           
    });
});
```

# default options

```javascript
// globally unique id for caches
id: null

// for caches (if null use cache default generator)
keyGenerator: null

// modulename defines requested path
module: ""

// default params for all, list and get requests
requests: {
    all: { action: "all", timezone: 'utc' },
    list: { action: "list", timezone: 'utc' },
    get: { action: "get", timezone: 'utc' },
    search: { action: "search", timezone: 'utc' },
    remove: { action: "delete" }
}

//generate key used to identify distinguish requests
cid: function (o) {
    return o.folder + DELIM + (o.sortKey || o.sort) + '.' + o.order + '.' + (o.max || o.limit || 0);
}

//custom done callbacks
//supported keys: all, list, get
done: {}

//custom done callbacks
//supported keys: get
fail: {}

//custom pipe callbacks
//supported keys: all, list, get, allPost, listPost, getCache
pipe: {}

//custom function to fix params
//supported keys: all
params: {}

//custom filter
//currently used only in list request
filter: null
```

# API Instance

- described are accessible default properties/functions only

## Properties

**DELIM**

- constant
- default value '//'
- uses as separator in cid function

**caches**

- cache object
- references subcaches
- all
- list
- get

**options**

- options object used to extend this instance

# Caching

**cid(options)**

```javascript
/**
 * generate key to identify all request 
 * cached response are referenced by that key
 * @param  {object} options (for request)
 * @return {string} key
 */
```

**needsRefresh(folder, sort, desc)**

```javascript
/**
 * has entries in 'all' cache for specific folder
 * @param  {string} folder (id)
 * @param  {string} sort   (column)
 * @param  {string} order
 * @return {deferred}      (resolves returns boolean)
 */
```

**refresh()**

```javascript
/**
 * bind to global refresh; clears caches and trigger refresh.all
 * @fires api#refresh.all
 * @return {promise}
 */
```

**updateCaches(ids, silent)**

```javascript
/** 
* update or invalidates all, list and get cache 
* @param {array|object} ids 
* @param {boolean} silent (do not fire events) 
* @fires api#delete (ids) 
* @return {promise} jQueries deferred promise 
*/
```

## Requests

- functions use central comunication layer (http.js)
  get(options, useCache)

```javascript
/**
 * requests (and caches) data for a single id
 * @param  {object} options
 * @param  {boolan} useCache (default is true)
 * @fires api#refresh.list
 * @return {deferred} (resolve returns response)
 */
```

**getAll(options, useCache, cache, processResponse)**

```javascript
/**
 * requests data for all ids
 * @param  {object} options
 * @param  {boolean} useCache (default is true)
 * @param  {object} cache (default is cache.all)
 * @param  {boolean} processResponse (default is true)
 * @return {deferred}
 */
```

**getList(ids, useCache, options)**

```javascript
/**
 * requests (and caches) data for multiple ids
 * @param  {array} ids
 * @param  {boolean} useCache (default is true)
 * @param  {object} options
 * @return {deferred}
 */
```

**remove(ids, local)**

```javascript
/**
 * remove ids from
 * @param  {array|object} ids
 * @param  {boolean} local (only locally)
 * @fires  api#refresh.all
 * @fires  api#delete (ids)
 * @fires  api#beforedelete (ids)
 * @fires  api#refresh:all:local
 * @return {deferred}
 */
```

**search(query, options)**

- only available if defaults for search requests are defined

```javascript
/**
 * search
 * @param  {string} query   [description]
 * @param  {object} options
 * @return {deferred}
 */
```

## Utils

**localRemove(list, hash, getKey)**

```javascript
/**
 * remove elements from list
 * @param  {array} list (list)
 * @param  {object} hash (ids of items to be removed)
 * @param  {function} getKey
 * @return {array} (cleaned list)
 */
```

**reduce(obj)**

```javascript
/**
 * reduce object to id, folder, recurrence_position
 * @param  {object|string} obj
 * @return {object}
 */
```

## Event Hub

- Event Hub based on jQuery's on, off, one and trigger
- differences documentated for each function

```javascript
// attach listener
api.on(type, data, function);
```

```javascript
// detach listener
api.off(type, function);
```

```javascript
// attach listener for a single execution
api.one(type, data, function);
```

```javascript
// trigger event
// difference: allows multiple types separated by spaces.
// difference: actually calls triggerHandler since we are not in the DOM.
api.trigger(types);
```

```javascript
// explicit destroy to clean up.
api.destroy();
```

## Events

**delete**

- 'delete:' + id
- 'delete', ids
- 'beforedelete', ids

**refresh**

- 'refresh.all'
- 'refresh:all:local'
- 'refresh.list'

**update**

- 'update:' + id
