---
title: APIs
description:  
source: http://oxpedia.org/wiki/index.php?title=AppSuite:APIs
---

This article lists our APIs that are intended to provide a easy-to-use abstraction layer handling most of the usually required server communication and caching for you. 
Described APIs can be distinguished in special application APIs and general APIs. Both types are usually inherited via API Factory to inherent basic caching mechanisms and common functions. Please take a look at factories wiki page  for further details cause these functions are not listed here again.

# Calendar

- located: `io.ox/calendar/api.js`
- instantiated via api factory

**constants**

DAY: 86400000
HOUR: 3600000
MINUTE: 60000
WEEK: 604800000

**addToUploadList(key)**

```javascript
/**
 * add appointment to the list
 * @param {string} key (task id)
 * @return {undefined}
 */
```

**attachmentCallback(obj)**

```javascript
/**
 * used to cleanup Cache and trigger refresh after attachmentHandling
 * @param  {object} obj (appointment object)
 * @fires  api#update (data)
 * @return {deferred}
 */
```

**confirm(o)**

```javascript
/**
 * change confirmation status
 * @param  {object} o (properties: id, folder, data)
 * @return {deferred}
 */
```

**copy(list, targetFolderId)**

```javascript
/**
 * copy appointment to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

**create(o)**

```javascript
/**
 * create appointment
 * @param  {object} o
 * @fires  api#create (data)
 * @fires  api#update: + cid
 * @return {deferred} returns appointment
 */
```

**freebusy(list, options, useCache)**

```javascript
/**
 * get participants appointments
 * @param  {array} list  (participants)
 * @param  {object} options
 * @param  {boolean} useCache [optional]
 * @return {deferred} returns a nested array with participants and their appointments
 */
```

**getInvites()**

```javascript
/**
 * get invites
 * @fires  api#new-invites (invites)
 * @return {deferred} returns sorted array of appointments
 */
```

**move(list, targetFolderId)**

```javascript
/**
 * move appointments to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

**removeFromUploadList(key)**

```javascript
/** 
 * remove appointment from the list 
 * @param {string} key (task id) 
 * @fires api#update: + key 
 * @return {undefined} 
 */
```

**removeRecurrenceInformation(obj)**

```javascript
/**
 * removes recurrence information
 * @param  {object} obj (appointment object)
 * @return {object} appointment object
 */
```

**update(o)**

```javascript
/**
 * update appointment
 * @param  {object} o (id, folder and changed attributes/values)
 * @fires  api#update (data)
 * @fires  api#update: + cid
 * @return {deferred} returns current appointment object
 */
```

**uploadInProgress(key)**

```javascript
/**
 * ask if this appointment has attachments uploading at the moment (busy animation in detail View)
 * @param  {string} key (task id)
 * @return {boolean}
 */
```

# Contacts

- located: io.ox/contacts/api.js
- instantiated via api factory

**addToUploadList(key)**

```javascript
/**
 * add contact to the list
 * @param {string} key (task id)
 * @return {undefined}
 */
```

**birthdays(options)**

```javascript
/**
 * get birthday ordered list of contacts
 * @param  {object} options
 * @return {deferred}
 */
```

**clearFetchCache()**

```javascript
/**
 * clear fetching cache
 * @return {deferred}
 */
```

**copy(list, targetFolderId)**

```javascript
/**
 * copy contact to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

**create(data, file)**

```javascript
/**
 * create contact
 * @param  {object} data (contact object)
 * @param  {object} file (image) [optional]
 * @fires  api#create (object)
 * @fires  api#refresh.all
 * @return {deferred} returns contact object
 */
```

**editNewImage(o, changes, file)**

```javascript
/**
 * update contact image (and properties)
 * @param  {object} o (id and folder_id)
 * @param  {object} changes (target values)
 * @param  {object} file
 * @fires  api#refresh.list
 * @fires  api#update:image ({id,folder})
 * @return {deferred} object with timestamp
 */
```

**getByEmailadress(address)**

```javascript
/**
* get contact redced/filtered contact data; manages caching
* @param {string} address (emailaddress)
* @return {deferred} returns exactyl one contact object
*/
```

**getDisplayName(data)**

```javascript
/**
* get div node with callbacks managing fetching/updating
* @param {object} obj ('display_name' and 'email')
* @return {object} div node with callbacks
*/
```

**getPicture(obj, options)**

```javascript
/**
* get div node with callbacks managing fetching/updating
* @param {string|object} obj (emailaddress)
* @param {object} options (height, with, scaleType)
* @return {object} div node with callbacks
*/
```

**getPictureURL(obj, options)**

```javascript
/**
* gets deferred for fetching picture url
* @param {string|object} obj (emailaddress or data object)
* @param {object} options (height, width, scaleType)
* @fires  api#fail
* @return {deferred}
*/
```

**getPictureURLSync(obj, options)**

```javascript
/**
 * get picture url
 * @param  {object} obj
 * @param  {object} options
 * @return {string} url
 */
```

**looksLikeDistributionList(obj)**

```javascript
/**
 * is distribution list
 * @param  {object} obj (contact)
 * @return {boolean}
 */
```

**looksLikeResource(obj)**

```javascript
/**
 * is ressource (duck check)
 * @param  {object} obj (contact)
 * @return {boolean}
 */
```

**move(list, targetFolderId)**

```javascript
/**
 * move contact to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

**remove(list)**

```javascript
/**
 * delete contacts
 * @param  {array} list (object)
 * @return {promise}
 */
```

**removeFromUploadList(key)**

```javascript
/**
 * remove contact from the list
 * @param {string} key (task id)
 * @fires api#update: + key
 * @return {undefined}
 */
```

**update(o)**

```javascript
/**
 * updates contact
 * @param  {object} o (contact object)
 * @fires  api#update: + folder + id
 * @fires  api#update: + cid
 * @fires  api#update (data)
 * @fires  api#refresh.all
 * @return {deferred} returns
 */
```

**uploadInProgress(key)**

```javascript
/**
 * ask if this contact has attachments uploading at the moment (busy animation in detail View)
 * @param  {string} key (task id)
 * @return {boolean}
 */
```

# Files

- located: `io.ox/files/api.js`
- instantiated via api factory

**checkMediaFile(type, filename)**

```javascript
/**
 * file playable in current browser 
 * @param {string} type ('audio', 'video') 
 * @param {string} filename 
 * @return {boolean} 
 */
```

**copy(list, targetFolderId)**

```javascript
/**
 * copy files to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

**detach(version)**

```javascript
/**
 * removes version
 * @param  {object} version (file version object)
 * @fires  api#delete.version (version)
 * @return {deferred}
 */
```

**getUrl(file, mode)**

```javascript
/**
 * returns url
 * @param  {object} file
 * @param  {sting}  mode
 * @return {string} url
 */
```

**move(list, targetFolderId)**

```javascript
/**
 * move files to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

**propagate(type, obj, silent)**

```javascript
/**
 * update caches and fire events (if not suppressed)
 * @param  {string} type ('change', 'new', 'delete')
 * @param  {file} obj
 * @param  {boolean} silent (no events will be fired) [optional]
 * @fires  api#update
 * @fires  api#update: + cid
 * @fires  api#refresh.all
 * @return {promise}
 */
```

**update(file, makeCurrent)**

```javascript
/**
 * updates file
 * @param  {object} file
 * @param  {boolean} makeCurrent (special handling for mark as current version) [optional]
 * @fires  api#create.file (object)
 * @return {deferred}
 */
```

**uploadFile(options)**

```javascript
/**
 * upload a new file and store it
 * @param  {object} options
 *         'folder' - The folder ID to upload the file to. 
 *          This is optional and defaults to the standard files folder
 *         'json' - The complete file object. This is optional and defaults
 *          to an empty object with just the folder_id set.
 *         'file' - the file object to upload
 * @fires  api#create.file
 * @return {deferred}
 */
```

**uploadNewVersion(options)**

```javascript
/**
 * upload a new version of a file
 * @param  {object} options
 *         'folder' - The folder ID to upload the file to. 
 *          This is optional and defaults to the standard files folder
 *         'json' - The complete file object. This is optional and defaults
 *          to an empty object with just the folder_id set.
 *         'file' - the file object to upload
 * @fires  api#create.version
 * @return {deferred}
 */
```

**uploadNewVersionOldSchool(options)**

```javascript
/**
 * upload a new version of a file (IE Version)
 * @param  {object} options
 *         'folder' - The folder ID to upload the file to. 
 *          This is optional and defaults to the standard files folder
 *         'json' - The complete file object. This is optional and defaults
 *          to an empty object with just the folder_id set.
 *         'file' - the file object to upload
 * @fires  api#create.file
 * @return {deferred}
 */
```

# Mail

- located: `io.ox/mail/api.js`
- instantiated via api factory

**constants**

```javascript
//type mappings
SENDTYPE = {
    NORMAL:  '0',
    REPLY:   '1',
    FORWARD: '2',
    DRAFT:   '3'
};

//flag mappings
FLAGS = {
    ANSWERD:     1,
    DELETED:     2,
    DRAFT:       4,
    FLAGGED:     8,
    RECENT:     16,
    SEEN:       32,
    USER:       64,
    SPAM:      128,
    FORWARDED: 256
};

//color mappings
COLORS = {
    NONE:        0,
    RED:         1,
    ORANGE:      7,
    YELLOW:     10,
    LIGHTGREEN:  6,
    GREEN:       3,
    LIGHTBLUE:   9,
    BLUE:        2,
    PURPLE:      5,
    PINK:        8,
    GRAY:        4
};
```

**beautifyMailText (str, lengthLimit)**

```javascript
/**
 * beautifies mail text
 * @param  {string} str
 * @param  {integer} lengthLimit
 * @return {string}
 */
```

**changeColor(list, label, local)**

```javascript
/**
 * sets color
 * @param  {array|object} list of mail objects
 * @param  {string} label (numeric color id mapped in api.COLORS)
 * @param  {boolean} local
 * @fires  api#refresh.list
 * @return {promise} done returns list of mails in current folder
 */
```

**checkInbox()**

```javascript
/**
 * checks inbox for new mails
 * @fires api#new-mail (recent, unseen)
 * @return {deferred} done returns { unseen: [], recent: [] }
 */
```

**clear(folder_id)**

```javascript
/**
 * deletes all mails from a specific folder
 * @param  {string} folder_id
 * @fires  api#refresh.all
 * @return {deferred}
 */
```

**copy (list, targetFolderId)**

```javascript
/** 
 * copies a number of mails to another folder 
 * @param {array} list 
 * @param {string} targetFolderId
 * @return {deferred} 
 */
```

**expunge (folder_id)**

```javascript
/**
 * cleaning up
 * @param  {string]} folder_id
 * @fires  api#refresh.all
 * @return {deferred}
 */
```

**forward(obj, view)**

```javascript
/**
 * prepares object content for 'forward' action
 * @param  {object} obj (mail object)
 * @param  {string} view (html or text)
 * @return {deferred} done returnes prepared object
 */
```

**getAccountIDFromFolder(initialFolder)**

```javascript
/**
 * get account id
 * @param  {[type]} initialFolder (folder id)
 * @return {string} account id
 */
```

**getAllThreads(options, useCache)**

```javascript
/**
 * requests data for all ids
 * @param {object} options
 * @param {boolean} useCache (default is true)
 * @return {deferred} returns array of threads
 */
```

**getDefaultFolder()**

```javascript
/**
 * @return {string} default folder for mail
 */
```

**getSource(obj)**

```javascript
/**
 * get source code of specified mail
 * @param {object} obj (mail)
 * @return {deferred} returns source string
 */
```

**getThread(obj)**

```javascript
/**
 * get mails in thread
 * @param  {object} obj (mail object)
 * @return {array} of mail objects
 */
```

**getThreads(ids)**

```javascript
/**
 * get threads
 * @param  {array} ids (mail objects)
 * @return {deferred} returns array of thread objects
 */
```

**getUnmodified(obj)**

```javascript
/**
 * get mail object with unmodified content(in case externalresources warning message was ignored)
 * @param  {object]} obj (mail object)
 * @return {deferred} obj (mail object)
 */
```

**getUrl(data, mode)**

```javascript
/**
 * get url for attachment in requested mode
 * @param  {object} data (attachment)
 * @param  {string} mode ('download', 'zip', 'email, 'view', 'open')
 * @return {string} url
 */
```

**importEML(options)**

```javascript
/**
 * imports mail as EML
 * @param  {object} options (file: {}, folder: string )
 * @fires  api#refresh.all
 * @return {deferred} returns array with objects (id, folder_id)
 */
```

**markRead(list)**

```javascript
/**
 * marks list of mails read
 * @param {array} list
 * @fires api#refresh.list
 * @fires api#update:set-seen (list)
 * @return {deferred}
 */
```

**markSpam(list)**

```javascript
/**
 * marks list of mails as spam
 * @param {array} list
 * @return {deferred}
 */
```

**markUnread(list)**

```javascript
/**
 * marks list of mails unread
 * @param {array} list
 * @fires api#refresh.list
 * @return {deferred}
 */
```

**move(list, targetFolderId)**

```javascript
/**
 * move mails to another folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @fires  api#refresh.all
 * @fires  api#move (list, targetFolderId)
 * @return {deferred}
 */
```

**newMailTitle(state)**

```javascript
/**
 * sets title to 'New Mail' or default
 * @param  {boolean} state
 * @return {undefined}
 *
 */
```

**reply(obj, view)**

```javascript
/**
 * prepares object content for 'reply' action
 * @param  {object} obj (mail object)
 * @param  {string} view (html or text)
 * @return {deferred} done returns prepared object
 */
```

**replyall(obj, view)**

```javascript
/**
 * prepares object content for 'reply' action
 * @param  {object} obj (mail object)
 * @param  {string} view (html or text)
 * @return {deferred} done returns prepared object
 */
```

**saveAttachments(list, target)**

```javascript
/**
 * save mail attachments in files app
 * @param  {array} list
 * @param  {string} target (folder id) [optional]
 * @fires  api#refresh.all
 * @return {deferred}
 */
```

**send(data, files, form)**

```javascript
/**
 * sends a mail
 * @param  {object} data (mail object)
 * @param  {array} files
 * @param  {jquery} form (for 'oldschool')
 * @fires  api#refresh.all
 * @fires  api#refresh.list
 * @return {deferred}
 */
```

**updateAllCache(list, callback)**

```javascript
/**
 * update item in all caches via callback in element
 * @param {array} list
 * @param {function} callback
 * @return {deferred}
 */
```

# Tasks

- located: `io.ox/tasks/api.js`
- instantiated via api factory

**create**

```javascript
/**
 * create a task
 * @param  {object} task
 * @return {deferred} done returns object with id property
 */
```

**update**

```javascript
/**
 * update single task
 * @param  {object} task (id, folder_id, 'changed attributes')
 * @param  {string} newFolder (optional; target folder id)
 * @fires  api#refresh.all
 * @return {[type]}
 */
```

**removeFromCache**

```javascript
/**
 * remove from get/list cache
 * @param  {string|array} key
 * @fires  api#create (task)
 * @return {promise}
 */
```

**updateMultiple**

```javascript
/**
 * update list of taks used by done/undone actions when used with multiple selection
 * @param  {array}    list of task objects (id, folder_id)
 * @param  {object}   modifications
 * @fires  api#refresh.all
 * @return {deferred}
 */
```

**move**

```javascript
/**
 * move task to folder
 * @param  {object|array} task (or array of tasks)
 * @param  {string} newFolder (target folder id)
 * @fires  api#refresh.all
 * @return {deferred} done returns object with properties folder_id and task id
 */
```

**confirm**

```javascript
/**
 * change confirmation status
 * @param  {object} options (properties: data, folder_id, id)
 * @fires  api#mark:invite:confirmed (o)
 * @fires  api#update (data)
 * @fires  api#update: + cid
 * @return {promise}
 */
```

**getDefaultFolder**

```javascript
/**
 * @return {string} default folder for tasks
 */
```

**getAllMyTasks**

```javascript
/**
 * used for portal plugin
 * @return {deferred} done returns list of tasks
 */
```

**getTasks**

```javascript
/**
 * get tasks for notification view
 * @fires api#new-tasks (dueTasks)
 * @fires api#set:tasks:to-be-confirmed (confirmTasks)
 * @return {deferred} done returns list of tasks
 */
```

**uploadInProgress**

- used to determine if busy animation should be shown

```javascript
/**
 * ask if this task has attachments uploading at the moment (busy animation in detail View)
 * @param  {string} key (task id)
 * @return {boolean}
 */
```

**addToUploadList(key)**

- used if task edit/create changes list of attached files

```javascript
/**
 * add task to the list
 * @param {string} key (task id)
 * @return {undefined}
 */
```

**removeFromUploadList(key)**

- used if add/delete finished

```javascript
/**
 * remove task from the list
 * @param  {string} key (task id)
 * @fires  api#update: + key
 * @return {undefined}
 */
```

**refresh()**

```javascript
/**
 * bind to global refresh; clears caches and trigger refresh.all
 * @fires  api#refresh.all
 * @return {promise}
 */
```

# APIs: General

## Account

- located: `io.ox/core/api/account.js`
- not' instantiated via api factory

**all()**

```javascript
/**
 * get all accounts
 * @return {deferred} returns array of account object
 */
```

**autoconfig(data)**

```javascript
/**
 * get autoconfig for given emailadress
 * @param  {object} data (email, password)
 * @return {deferred} returns best available mail server settings (may be incomplete or empty)
 */
```

**create(data)**

```javascript
/**
 * create mail account
 * @param  {object} data (attributes)
 * @fires  api#create:account (data)
 * @return {deferred}
 */
```

**get(id)**

```javascript
/**
 * get mail account
 * @param  {string} id
 * @return {deferred} returns account object
 */
```

**getAllSenderAddresses()**

```javascript
/**
 * get all sender addresses
 * @return {promise} returns array of arrays
 */
```

**getFoldersByType(type)**

```javascript
/**
 * return folders for accounts
 * @param  {string} type ('inbox', 'send', 'drafts')
 * @return {array} folders
 */
```

**getPrimaryAddress(accountId)**

```javascript
/**
 * Get the primary address for a given account
 * @param  {string} accountId [optional: default account will be used instead]
 * @return {deferred} returns array (name, primary adress)
 */
```

**getPrimaryAddressFromFolder(folder_id)**

```javascript
/**
 * get primary address from folder
 * @param  {string} folder_id
 * @return {deferred} object with properties 'displayname' and 'primaryaddress'
 */
```

**getSenderAddresses(accountId)**

```javascript
/**
 * get a list of addresses that can be used when sending mails
 * @param  {string} accountId [optional: default account will be used instead]
 * @return {deferred} returns array the personal name and a list of (alias) addresses
 */
```

**getUnifiedMailboxName**

```javascript
/**
 * get unified mailbox name
 * @return {deferred} returns array or null
 */
```

**is(type, id)**

```javascript
/**
 * check folder type
 * @param  {string} type (foldertype, example is 'drafts')
 * @param  {type} id [optional]
 * @return {boolean}
 */
```

**isAccount(id)**

```javascript
/**
 * is account folder
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

**isExternal(id)**

```javascript
/**
 * is external folder
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

**isPrimary(id)**

```javascript
/**
 * is primary folder
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

**isUnified(id)**

```javascript
/**
 * is unified
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

**isUnifiedFolder(id)**

```javascript
/**
 * is unified folder
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

**parseAccountId(str, strict)**

```javascript
/**
 * get account id
 * @param  {string|number} str (folder_id|account_id)
 * @param  {boolean} strict
 * @return {integer} account id
 */
```

**refresh()**

```javascript
/**
 * bind to global refresh; clears caches and trigger refresh.all
 * @fires  api#refresh.all
 * @return {promise}
 */
```

**remove(data)**

```javascript
/**
 * delete mail account
 * @param  {object} data (attributes)
 * @fires  api#refresh.all
 * @fires  api#delete
 * @return {deferred}
 */
```

**update(data)**

```javascript
/**
 * update account
 * @param  {object} data (account)
 * @return {deferred} returns new account object
 */
```

**validate(data)**

```javascript
/**
 * validate account data
 * @param  {object} data (accont object)
 * @return {deferred} returns boolean
 */
```

## Apps

- located: `io.ox/core/api/apps.js`
- not instantiated via api factory

**get(id)**

```javascript
/**
 * get app (creates empty one if doesn't exists yet)
 * @param  {string} id
 * @return {object} app
 */
```

**getByCategory(id)**

```javascript
/**
 * get by category ('productivity', 'basic', 'dev')
 * @param  {string} category
 * @return {array} object for each category
 */
```

**getCategories()**

```javascript
/**
 * get number of apps per category/special category
 * @return {array} object for each category
 */
```

**getFavorites()**

```javascript
/**
 * get favorite apps (special category)
 * @param  {string} [optional]
 * @return {array} app objects
 */
```

**getInstalled(mode)**

```javascript
/**
 * get installed apps
 * @param  {string} [optional]
 * @return {array} app objects
 */
```

**isFavorite(data)**

```javascript
/**
 * checks if app is marked as favorite (special category)
 * @param  {object}  data (app object)
 * @return {boolean}
 */
```

**markAsFavorite(id)**

```javascript
/**
 * mark as favorites (special category)
 * @param  {string} id
 * @return {undefined}
 */
```

**unmarkAsFavorite(id)**

```javascript
/**
 * unmark as favorites (special category)
 * @param  {string} id
 * @return {undefined}
 */
```

## Attachment

- located: `io.ox/core/api/attachment.js`
- not instantiated via api factory

**getAll()**

```javascript
/**
 * gets all attachments for a specific object, for exsample a task
 * @param  {object} options
 * @return {deferred}
 */
```

**remove(options, data)**

```javascript
/**
 * removes attachments
 * @param  {object} options
 * @param  {object} data (id properties)
 * @return {deferred}
 */
```

**create(options, data)**

```javascript
/**
 * create attachment
 * @param  {object} options
 * @param  {object} data (attachment)
 * @return {deferred}
 */
```

**createOldWay(options, form)**

```javascript
/**
 * create attachment
 * @param  {object} options
 * @param  {object} form
 * @return {deferred}
 */
```

**getUrl(data, mode)**

```javascript
/**
 * builds URL to download/preview File
 * @param  {object} data
 * @param  {string} mode
 * @return {string} url
 */
```

**save(data, target)**

```javascript
/**
 * save attachment
 * @param  {object} data
 * @param  {string} target (folder_id)
 * @return {deferred}
 */
```

## Autocomplete

- located: `io.ox/core/api/autocomplete.js`
- not instantiated via api factory

**search(query)**

```javascript
/**
 * search
 * @param  {string} query
 * @return {deferred} returns results
 */
```

**processItem(type, data)**

```javascript
/**
 * process results
 * @param  {string} type
 * @param  {array} data (contains results array)
 * @return {array}
 */
```

**processContactResults(type, data, query)**

```javascript
/**
 * process contact results
 * @param  {string} type
 * @param  {array}  data (contains results array)
 * @param  {string} query
 * @return {array}
 */
```

**processContactItem(type, list, obj, field)**

```javascript
/**
 * process contact items
 * @param  {string} type
 * @param  {array} list
 * @param  {object} obj
 * @param  {string} field
 * @return {undefined}
 */
```

## Conversion

A generic module to request data from a data source and to process obtained/submitted data with a data handler. Thus data is converted from a data source by a data handler.

- located: `io.ox/core/api/conversion.js`
- instantiated via api factory
- no events triggered
- no caching

**convert()**

```javascript
/**
 * @param  {object} dataSource
 * @param  {object} dataHandler
 * @return {deferred} done returns data object
 */
```

## Export

The module export allows to export specific module data (like Contacts, Tasks or Appointments) from a folder in several formats (iCal, vCard, CSV).

- located: `io.ox/core/api/export.js`
- instantiated via api factory
- directly wired to http.js
- no events triggered
- no caching

**getCSV(folder, simulate)**

```javascript
/**
 * done: returns csv string; fail: returns error object
 * @param  {string} id of folder (contacts) whose contents should be exported
 * @param  {boolean} simulate return only request url (optional)
 * @param  {string} columns as comma separated list (optional) 
 * @return {deferred}
 */
```

_example_

```javascript
//get api reference
require(['io.ox/core/api/export.js'], function (exportAPI) {
    exportAPI
    //export first_name/last_name from contacts in folder 14046
    .getCSV(
        '14046',  //folder_id
        true,     //simulate
        '501,502' //columns
    )
    //with enabled simulate flag done returns a link
    .done(function (link) {
        //setting window.location.href to download file
        window.location.href = link;
    });
})
```

**getICAL(folder, simulate)**

```javascript
/**
 * done: returns ical string; fail: returns error object
 * @param  {string} id of folder (calendar or tasks) whose contents should be exported
 * @param  {boolean} simulate return only request url (optional)
 * @return {deferred}
 */
```

**getVCARD(folder, simulate)**

```javascript
/**
 * done: returns vcard string; fail: returns error object
 * @param  {string} id of folder (contacts) whose contents should be exported
 * @param  {boolean} simulate return only request url (optional)
 * @return {deferred}
 */
```

## Group

The group module allows to query available groups. It is mainly used by the dialog for the selection of participants.

- located: `io.ox/core/api/group.js`
- instantiated via api factory
- no events triggered

**getName(id)**

```javascript
/**
 * @param  {string} id
 * @return {deferred} done handler returns name (string)
 */
```

## Import

The module import allows to import specific module data (like Contacts, Tasks or Appointments) in several formats (iCal, vCard, CSV) into a folder.

- located: `io.ox/core/api/import.js`
- not instantiated via api factory
- custom connection to http.js
- no events triggered
- no caching

**importFile(data)**

```javascript
/**
 * import data from file
 *
 * @param data {Object} -
 * {type: "ICAL",
 *  folder: "32",
 *  file: [file object],
 *  form: jQuery object containing the form
 * }
 *
 * @return - a deferred object, containing the response of the import call
 */
```

## Mailfilter

- located: `io.ox/core/api/mailfilter.js`
- not instantiated via api factory

**delete(ruleId)**

```javascript
/**
 * delete rule
 * @param  {string} ruleId
 * @return {deferred}
 */
```

**create(data)**

```javascript
/**
 * create rule
 * @param  {object} data
 * @return {deferred}
 */
```

**getRules(flag)**

```javascript
/**
 * get rules
 * @param  {string} flag (filters list)
 * @return {deferred}
 */
```

**update(data)**

```javascript
/**
 * update rule
 * @param  {object} data
 * @return {deferred}
 */
```

## Publications / Subscriptions

- located: `io.ox/core/api/pubsub.js`
- referenced as publications respectively subscriptions
- instantiated via api factory
- add/edit/remove own publications/subscriptions

**update(data)**

```javascript
/**
 * update publication/subscription
 * @param  {object} data
 * @return {deferred}
 */
```

**destroy(id)**

```javascript
/**
 * removes publication/subscription
 * @param  {string} id
 * @return {deferred}
 */
```

**create(data)**

```javascript
/**
 * create publication/subscription
 * @param  {object} data (pubsub model attributes)
 * @return {deferred} subscription id
 */
```

**refresh(data)**

- subscription only

```javascript
/**
 * refresh subscription
 * @param  {object} data (id,folder)
 * @return {deferred} item count
 */
```

## Publication Targets / Subscription Sources

- located: `io.ox/core/api/pubsub.js`
- referenced as publicationTargets respectively sources
- instantiated via api factory

**getAll()**

- returns possible publication targets respectively subscription sources
- default api factory method
- please take a look at API Factory 

## Quota

- located: `io.ox/core/api/quota.js`
- not instantiated via api factory

**get**

```javascript
/**
 * get mail and file quota
 * @return {deferred} returns quota object
 */
```

**getFile**

```javascript
/**
 * get File quota and current use
 * @return {deferred} returns object with quota and use properties)
 */
```

**getMail**

```javascript
/**
 * get mail quota and current use
 * @return {deferred} returns object with quota and use properties)
 */
```

## Reminder

- located: `io.ox/core/api/reminder.js`
- not instantiated via api factory

**deleteReminder(reminderId)**

```javascript
/**
 * delete reminde
 * @param  {string} reminderId
 * @return {deferred}
 */
```

**remindMeAgain(remindDate, reminderId)**

```javascript
/**
 * remind again
 * @param  {number} remindDate (unix datetime)
 * @param  {string} reminderId
 * @return {deferred}
 */
```

**getReminders(range, module)**

```javascript
/**
 * get reminders
 * @param  {number} range (end of scope)
 * @param  {number} module
 * @fires  api#set:tasks:reminder (reminderTaskId, reminderId)
 * @fires  api#set:calendar:reminder (reminderCalId)
 * @return {deferred}
 */
```

## Ressource

- located: `io.ox/core/api/resource.js`
- instantiated via api factory

**search(pattern)**

- default api factory method
- used to search for one ore more ressources

```javascript
/**
 * @param  {string} query  
 * @param  {object} options
 * @return {deferred}
 */
```

## Snippets

- located: `io.ox/core/api/snippets.js`
- not instantiated via api factory

**getAll()**

```javascript
/**
 * get all snippets
 * @return {deferred}
 */
```

**create(snippet)**

```javascript
/**
 * create snippet
 * @param  {object} snippet
 * @return {deferred}
 */
```

**get(id)**

```javascript
/**
 * get snippet
 * @param  {string} id
 * @return {deferred}
 */
```

**list(ids)**

```javascript
/**
 * get snippets
 * @param  {array} ids
 * @return {deferred}
 */
```

**destroy(id)**

```javascript
/**
 * remove snippets
 * @param  {string} id
 * @fires  api#refresh.all
 * @return {deferred}
 */
```

## Templating

- located: `io.ox/core/api/templating.js`
- not instantiated via api factory

**getNames()**

```javascript
/**
 * get names
 * @return {deferred} returns array of template names
 */
```

## User

- located: `io.ox/core/api/user.js`
- instantiated via api factory

**editNewImage(o, changes, file)**

```javascript
/**
 * update user image (and properties)
 * @param  {object} o (id and folder_id)
 * @param  {object} changes (target values)
 * @param  {object} file
 * @fires  api#refresh.list
 * @fires  api#update ({id})
 * @return {deferred} object with timestamp
 */
```

**getName(id)**

```javascript
/**
 * get user display name (or email if display name undefined)
 * @param {string} id of a user
 * @return {deferred} returns name string
 */
```

**getGreeting(id)**

```javascript
/**
 * get greeting ('Hello ...')
 * @param {string} id of a user
 * @return {deferred} returns greeting string
 */
```

**getTextNode(id)**

```javascript
/**
 * get text node which fetches user name asynchronously
 * @param {string} id of a user
 * @return {object} text node
 */
```

**getLink(id, text)**

```javascript
/**
 * get halo text link
 * @param {string} id of a user
 * @param  {string} text
 * @return {jquery} text link node
 */
```

**getPictureURL(id, options)**

```javascript
/**
* gets deferred.promise for fetching picture url
* @param {string} id of a user
* @param {object} options height, width, scaleType
* @return {promise}
*/
```

**getPicture(id, options)**

```javascript
/**
* get div node with callbacks managing fetching/updating
* @param {string} id of a user
* @param {object} options height, with, scaleType
* @return {object} div node with callbacks
*/
```

**getCurrentUser()**

```javascript
/**
 * get a contact model of the currently logged in user
 * @return {object} a contact model of the current user
 */
```

**update(o)**

```javascript
/**
 * update user attributes
 * @param  {object} o (o.data contains key/values of changed attributes)
 * @fires  api#update: + id
 * @fires  api#update, (id)
 * @fires  api#urefresh.list
 * @return {deferred} done returns object with timestamp, data
 */
```
