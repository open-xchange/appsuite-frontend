---
title: Extension points
description:  
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Extension_points_for_email
---

# io.ox/mail/all/actions

The point for the "all" actions dropdown in the detail view of a selected mail. 
This place should be used for actions in context with all involved contacts.
The baton is forwarded to the the single action functions.

baton contains: data - holds the mail object of the current selected contact
- data.threadKey 
- data.threadPosition 
- data.threadSize 
- tracker

# io.ox/mail/attachment/links

The point for actions related to the attachments of a mail.

# io.ox/mail/detail

The point for the detail view of a selected mail. 
The baton is forwarded. 
It is followed by points for each mail detail:

- io.ox/mail/detail/contact-picture
- io.ox/mail/detail/receiveddate
- io.ox/mail/detail/fromlist
- io.ox/mail/detail/thread-position
- io.ox/mail/detail/flag
- io.ox/mail/detail/subject
- io.ox/mail/detail/tocopy
- io.ox/mail/detail/attachments
- io.ox/mail/detail/inline-links
- io.ox/mail/detail/phishing-warning
- io.ox/mail/detail/externalresources-warning
- io.ox/mail/detail/content

# io.ox/mail/detail/notification

The point for the notification handling. 
A extended mail object is forwarded.

# io.ox/mail/detail/notification/update-notification

The point to remove read mails in notification area.

# io.ox/mail/dnd/actions

The point for mail import via drag & drop.

# io.ox/mail/links/inline

The Point for inserting actions like reply & delete.

# io.ox/mail/settings/detail

The point for the mail settings detailpage.

# io.ox/mail/settings/detail/section

This point is not longer supported.

# io.ox/mail/thread

The Point for inserting actions related to the whole thread like move & delete. 
The baton is forwarded.

# io.ox/mail/vgrid/options

The point for applying options to the vgrid related to the mail app.

_sort_

- specifies default sort field
- in case threadview is enabled/used and default sort field is not set to - 'thread' user has to select 'sort by -> chat' manually after each login/- page refresh
- alternatively you can use sever setting 'io.ox/mail//vgrid/sort='

_option: by date_

sort: 610

_option: by from_

sort: 603

_option: by subject_

sort: 607

_option: by label_

sort: 102

_option: show threads (if threadview is enabled), sort by date (if threadview are disabled)__

sort: 'thread'

# io.ox/mail/vgrid/toolbar

The point for extending the vgrid toolbar in the mail app.

# io.ox/mail/write/toolbar

The point for inserting inline buttons on top of the mail write view.

# io.ox/mail/write/actions/send

The point for the action related to the send button. The baton is available.

# io.ox/mail/write/autoCompleteItem

The point for extending the autocomplete items in the mail app.

# io.ox/mail/write/contactItem

The point for extending the contact list items in the mail app.

# io.ox/mail/write/contactPicture

The point for extending contact picture in autocomplete and contact list.

# io.ox/mail/write/displayName

The point for extending display name in autocomplete and contact list.

# io.ox/mail/write/emailAddress

The point for extending email address in autocomplete and contact list.

# io.ox/mail/write/actions/draft

The point for the action related to the save button. The baton is available.

# io.ox/mail/write/actions/discard

The point for the action related to the discard button. The baton is available.
