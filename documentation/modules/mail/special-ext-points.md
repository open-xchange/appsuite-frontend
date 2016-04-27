---
title: Extension points
description:
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Extension_points_for_email
---

*Please note only a small subset of the available extensions points are listed here (only some special ones).*

# io.ox/mail/all/actions

The point for the "all" actions dropdown in the detail view of a selected mail.
This place should be used for actions in context with all involved contacts.
The baton is forwarded to the the single action functions.

baton contains: data - holds the mail object of the current selected contact

- data.threadKey
- data.threadPosition
- data.threadSize
- tracker
