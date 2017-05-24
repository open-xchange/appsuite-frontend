---
title: Unseen messages folder
---

The UI can provide a unread messages folder, if the imap server has a folder which contains all messages. The UI will then request 250 messages sort by unseen and remove all seen messages as well as all messages inside the spam or trash folder. This folder will never remove any seen message. Deleted messages will be removed and new messages will be added. If the user wants to remove all seen messages from that folder, the user needs to select another folder and the select the unseen messages folder again.

# Configuration

This feature is configured via JSLobs. The admin must set

```
io.ox/mail//features/unseenFolder=true
```

to enable that feature. By default, this will request the folder "default0/virtual/all". If another folder should be used, the field

```
io.ox/mail//allMessagesFolder="path/to/all/messages/folder"
```

must be configured.

If the feature is enabled, this folder will be shown to every user. If a user does not want to see the unseen messages folder, the user can change the setting in the mail settings view. The admin can set the default visibility to false by setting

```
io.ox/mail//unseenMessagesFolder=false
```

Make sure, that that field is not protected such that the user is able to change that setting. Otherwise, if the admin wants that the folder is always shown, set the above setting to true and leave it protected.