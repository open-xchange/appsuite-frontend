---
title: Special Extension Points
description:
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Extension_points_for_contact
---

*Please note only a small subset of the available extensions points are listed here (only some special ones).*

# io.ox/contacts/api/search

An opportunity to extend search requests.
Extensions are called as methods on the search request object and can modify it before it is sent to the server.
The search request as described in the HTTP API.

- this - take a look at the linked HTTP API documentation.
- query ''string'' - The search query as entered by the user.
- options ''Object'' - The options object passed to the contacts search API.
