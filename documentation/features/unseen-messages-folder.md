---
title: Unseen messages folder 
---

The UI can provide a unread messages folder, if the imap server has a folder which contains all messages. The UI will then request 250 messages sort by unseen and remove all seen messages as well as all messages inside the spam or trash folder. This folder will never remove any seen message. Deleted messages will be removed and new messages will be added. If the user wants to remove all seen messages from that folder, the user needs to select another folder and the select the unseen messages folder again.

#Configuration

First of all, the admin has to configure the all-messages folder, which is required for the unseen messages folder feature as already mentioned above. Finally he has to configure the Unseen messages folder feature to enable it. 

##Configuring the all-messages folder

Therefore, both the configuration of Dovecot and OX App Suite must be adjusted, so the following steps are necessary: 

###Dovecot

First we configure Dovecot to add a special folder to every mailbox. From the outside the folder looks like it contains all mails from all other folders. Some more information can be found [here](http://wiki2.dovecot.org/Plugins/Virtual "wikilink"). Open the file `/etc/dovecot/dovecot.conf` and add the following to your Dovecot configuration under `# mail`:

```
mail_plugins = $mail_plugins virtual
namespace Virtual {
  prefix = Virtual/
  separator = /
  hidden = yes
  list = no
  subscriptions = no
  location = virtual:/etc/dovecot/virtual:INDEX=/var/vmail/%u/virtual
}
```
so that for example your dovecot config looks like this:

```
# general

protocols = imap lmtp
ssl = no

# auth

disable_plaintext_auth = no
auth_mechanisms = plain
passdb {
  driver = passwd-file
  args = scheme=PLAIN /etc/dovecot/passwd
}

userdb {
  driver = static
  args = uid=vmail gid=vmail home=/var/vmail/%u
}

# logging

log_path = /var/log/dovecot.log

# mail

mail_location = maildir:/var/vmail/%u
mail_plugins = $mail_plugins quota
mail_plugins = $mail_plugins virtual
namespace Virtual {
  prefix = virtual/
  separator = /
  hidden = yes
  list = no
  subscriptions = no
  location = virtual:/etc/dovecot/virtual:INDEX=/var/vmail/%u/virtual
}
protocol imap {
  mail_plugins = $mail_plugins imap_quota
  imap_capability = +XDOVECOT
}

plugin quota {
  quota = maildir
  quota_rule = *:storage=1G
}

namespace inbox {
  separator = /
  prefix =
  inbox = yes
  #subscriptions = yes

  mailbox Drafts {
    special_use = \Drafts
    auto = subscribe
                                                                                                                                                                 
```


This makes use of the dovecot virtual folders plugin. A new hidden namespace `Virtual` is created, which will not be contained in IMAP `LIST` responses and not accept subscriptions. However, folders below that namespace can be selected and examined. In our case we define a global configuration for virtual folders below `/etc/dovecot/virtual`, which makes configured folders appear in every users account. However, indexes for such folders need to be created per-mailbox of course, which we expect to be located under `/var/vmail/`.

To create a virtual folder, a file system folder carrying the target name needs to be created below the denoted path. In our case we create a directory `/etc/dovecot/virtual/All`. Folder owner of the `virtual`and `virtual/All` folders needs to be the system user running the `dovecot` process. In our case it's `vmail`:

```
mkdir -p /etc/dovecot/virtual/All
chown -R vmail:vmail /etc/dovecot/virtual
```

Now we need to create the virtual folders configuration. Create a new file `/etc/dovecot/virtual/All/dovecot-virtual` and open it in your favorite editor. E.g. you might decide to include all mails from all folders, but Trash and Spam:

```
*
-INBOX/Trash
-INBOX/Trash/*
-INBOX/Spam
-INBOX/Spam/*
  all
```

The file can be owned by `root` but must be readable by the user running the `dovecot` process.

As a result every mail account will contain a selectable mailbox `Virtual/All` which pretends to contain all messages from all other mailboxes but Trash and Spam (given that these are named like this and located below the `INBOX` anmespace with `/` as separator).

For App Suite to be able to display the original folders within the search results Dovecot needs to announce an additional capability which needs to be added via

`imap_capability = +XDOVECOT`


###OX App Suite


After this we configure OX App Suite to make the feature visible. Open the file `/opt/open-xchange/etc/findbasic.properties` and configure [com.openexchange.find.basic.mail.allMessagesFolder](https://documentation.open-xchange.com/components/middleware/config/7.8.4/index.html#mode=search&term=com.openexchange.find.basic.mail.allMessagesFolder) to `Virtual/All`:

```
# Set the value to the name of the virtual mail folder containing all messages.
# Leave blank if no such folder exists.
com.openexchange.find.basic.mail.allMessagesFolder = Virtual/All
```
Additionally configure [com.openexchange.find.basic.mail.searchmailbody](https://documentation.open-xchange.com/components/middleware/config/7.8.4/index.html#mode=search&term=com.openexchange.find.basic.mail.searchmailbody) to `true`:

```
# Change the value to 'true', if fast full text search is supported. 
# Default is 'false'.
com.openexchange.find.basic.mail.searchmailbody = true

```

Finally restart the server with the following command:

```
systemctl restart open-xchange
```
<br />
##Configuring the Unseen messages folder feature

After the all-messages folder has been configured, the admin has to configure the Unseen messages folder feature. This feature is configured via JSLobs. First open the file `/opt/open-xchange/etc/settings/appsuite.properties`. There the admin has to add `io.ox/mail//features/unseenFolder`and set it to `true`: 

```
io.ox/mail//features/unseenFolder=true
```

to enable that feature. 

After this, the mail configuration file must be reloaded so that the changes made take effect:

```
/opt/open-xchange/sbin/reloadconfiguration
```

If the feature is enabled, this folder will be shown to every user. If a user does not want to see the unseen messages folder, the user can change the setting in the mail settings view:


![Settings](unseen-messages-folder/settings-button .png "Settings")
![mailsettings](unseen-messages-folder/mail-common.png "mailsettings")
<br />

Also the admin can set the default visibility of the feature to false. Therefore first open the file `/opt/open-xchange/etc/settings/appsuite.properties`. There the admin has to add `io.ox/mail/unseenMessagesFolder`and set it to `false`:

```
io.ox/mail//unseenMessagesFolder=false
```
Make sure, that that field is not protected such that the user is able to change that setting. Otherwise, if the admin wants that the folder is always shown, set the above setting to true and leave it protected.

After this, the mail configuration file must be reloaded so that the changes made take effect:

```
/opt/open-xchange/sbin/reloadconfiguration
```
So for example the "Show folder with all unseen messages" select field is not displayed in the settings under Common despite the fact that the feature is enabled:

![defaultvisibility](unseen-messages-folder/defaultvisibility.png "defaultvisibilitydefaultvisibility")

