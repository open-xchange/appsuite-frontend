---
title: Address book
---

```
namespace:  io.ox/contacts
settings:   io.ox/contacts
capability: contacts
```

# Extension points

> Please note that only some special ones of the available extensions points are listed here.

**io.ox/contacts/api/search**

An opportunity to extend search requests.
Extensions are called as methods on the search request object and can modify it before it is sent to the server.
The search request as described in the HTTP API.

- this - take a look at the linked HTTP API documentation.
- query ''string'' - The search query as entered by the user.
- options ''Object'' - The options object passed to the contacts search API.
