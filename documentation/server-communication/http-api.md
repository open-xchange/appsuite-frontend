---
title: Requesting server API
description: http class is intended as centralized server communication layer currently heavily used in our front end APIs
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Http.js
---

- located at `io.ox/core/http.js`

# HTTP facades

_general example_

```javascript
http.GET({ 
        module: 'mail',
        params: { 
            action: 'all', 
            folder: 'default0/INBOX' 
        }
    });
```

# Column Mappings

**server requests**

- still require use of columns ids

**server response**

- column_id keys will be replaced with column names to ease handling

# Request Stacking

- stack ability for calls to minimize overhead of server communication
  pause() and resume()

_example_

```javascript
// pause http layer
http.pause();

// process all updates
_(list).map(function (item) {
    return http.PUT({
        module: 'calendar',
        params: {
            action: 'update',
            id: item.id,
            folder: item.folder_id,
            timestamp: item.timestamp
        },
        data: {  ...  },
    });
});

// resume & trigger refresh
http.resume()
```

