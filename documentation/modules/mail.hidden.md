---
title: Mail
---

```
namespace:  io.ox/mail
settings:   io.ox/mail
capability: webmail
```

# Configuration settings

> Please note that only some special ones of the available settings are listed here.

| Path | Values | Description |
|----------------------------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **io.ox/mail//features/alwaysDeleteDraft** | true, false | Should drafts always be deleted when sending them. Please note that this will affect every draft - also drafts may used as templates. |

# Extension points

> Please note that only some special ones of the available extensions points are listed here.

**io.ox/mail/all/actions**

The point for the "all" actions dropdown in the detail view of a selected mail.
This place should be used for actions in context with all involved contacts.
The baton is forwarded to the the single action functions.

baton contains: data - holds the mail object of the current selected contact

- data.threadKey
- data.threadPosition
- data.threadSize
- tracker
