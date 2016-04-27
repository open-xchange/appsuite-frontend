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

# Event Hub

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

# Events

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
