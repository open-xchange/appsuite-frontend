---
title: APIs
description:  
source: http://oxpedia.org/wiki/index.php?title=AppSuite:APIs
---

This article lists our APIs that are intended to provide a easy-to-use abstraction layer handling most of the usually required server communication and caching for you. 
Described APIs can be distinguished in special application APIs and general APIs. Both types are usually inherited via API Factory to inherent basic caching mechanisms and common functions. Please take a look at factories wiki page  for further details cause these functions are not listed here again.

# Calendar

- located: ``io.ox/calendar/api.js``
- instantiated via api factory

__constants__

DAY: 86400000
HOUR: 3600000
MINUTE: 60000
WEEK: 604800000

__addToUploadList(key)__

```javascript
/**
 * add appointment to the list
 * @param {string} key (task id)
 * @return {undefined}
 */
```

__attachmentCallback(obj)__

```javascript
/**
 * used to cleanup Cache and trigger refresh after attachmentHandling
 * @param  {object} obj (appointment object)
 * @fires  api#update (data)
 * @return {deferred}
 */
```

__confirm(o)__

```javascript
/**
 * change confirmation status
 * @param  {object} o (properties: id, folder, data)
 * @return {deferred}
 */
```

__copy(list, targetFolderId)__

```javascript
/**
 * copy appointment to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

__create(o)__


```javascript
/**
 * create appointment
 * @param  {object} o
 * @fires  api#create (data)
 * @fires  api#update: + cid
 * @return {deferred} returns appointment
 */
```

__freebusy(list, options, useCache)__

```javascript
/**
 * get participants appointments
 * @param  {array} list  (participants)
 * @param  {object} options
 * @param  {boolean} useCache [optional]
 * @return {deferred} returns a nested array with participants and their appointments
 */
```

__getInvites()__

```javascript
/**
 * get invites
 * @fires  api#new-invites (invites)
 * @return {deferred} returns sorted array of appointments
 */
```

__move(list, targetFolderId)__

```javascript
/**
 * move appointments to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

__removeFromUploadList(key)__

```javascript
/** 
 * remove appointment from the list 
 * @param {string} key (task id) 
 * @fires api#update: + key 
 * @return {undefined} 
 */
```

__removeRecurrenceInformation(obj)__

```javascript
/**
 * removes recurrence information
 * @param  {object} obj (appointment object)
 * @return {object} appointment object
 */
```

__update(o)__

```javascript
/**
 * update appointment
 * @param  {object} o (id, folder and changed attributes/values)
 * @fires  api#update (data)
 * @fires  api#update: + cid
 * @return {deferred} returns current appointment object
 */
```

__uploadInProgress(key)__

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

__addToUploadList(key)__

```javascript
/**
 * add contact to the list
 * @param {string} key (task id)
 * @return {undefined}
 */
```

__birthdays(options)__

```javascript
/**
 * get birthday ordered list of contacts
 * @param  {object} options
 * @return {deferred}
 */
```

__clearFetchCache()__

```javascript
/**
 * clear fetching cache
 * @return {deferred}
 */
```

__copy(list, targetFolderId)__

```javascript
/**
 * copy contact to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

__create(data, file)__

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

__editNewImage(o, changes, file)__

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

__getByEmailadress(address)__

```javascript
/**
* get contact redced/filtered contact data; manages caching
* @param {string} address (emailaddress)
* @return {deferred} returns exactyl one contact object
*/
```

__getDisplayName(data)__

```javascript
/**
* get div node with callbacks managing fetching/updating
* @param {object} obj ('display_name' and 'email')
* @return {object} div node with callbacks
*/
```

__getPicture(obj, options)__

```javascript
/**
* get div node with callbacks managing fetching/updating
* @param {string|object} obj (emailaddress)
* @param {object} options (height, with, scaleType)
* @return {object} div node with callbacks
*/
```

__getPictureURL(obj, options)__

```javascript
/**
* gets deferred for fetching picture url
* @param {string|object} obj (emailaddress or data object)
* @param {object} options (height, width, scaleType)
* @fires  api#fail
* @return {deferred}
*/
```

__getPictureURLSync(obj, options)__

```javascript
/**
 * get picture url
 * @param  {object} obj
 * @param  {object} options
 * @return {string} url
 */
```

__looksLikeDistributionList(obj)__

```javascript
/**
 * is distribution list
 * @param  {object} obj (contact)
 * @return {boolean}
 */
```

__looksLikeResource(obj)__

```javascript
/**
 * is ressource (duck check)
 * @param  {object} obj (contact)
 * @return {boolean}
 */
```

__move(list, targetFolderId)__

```javascript
/**
 * move contact to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

__remove(list)__

```javascript
/**
 * delete contacts
 * @param  {array} list (object)
 * @return {promise}
 */
```

__removeFromUploadList(key)__

```javascript
/**
 * remove contact from the list
 * @param {string} key (task id)
 * @fires api#update: + key
 * @return {undefined}
 */
```

__update(o)__

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

__uploadInProgress(key)__

```javascript
/**
 * ask if this contact has attachments uploading at the moment (busy animation in detail View)
 * @param  {string} key (task id)
 * @return {boolean}
 */
```

# Files

- located: ``io.ox/files/api.js``
- instantiated via api factory

__checkMediaFile(type, filename)__

```javascript
/**
 * file playable in current browser 
 * @param {string} type ('audio', 'video') 
 * @param {string} filename 
 * @return {boolean} 
 */
```

__copy(list, targetFolderId)__

```javascript
/**
 * copy files to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

__detach(version)__

```javascript
/**
 * removes version
 * @param  {object} version (file version object)
 * @fires  api#delete.version (version)
 * @return {deferred}
 */
```

__getUrl(file, mode)__

```javascript
/**
 * returns url
 * @param  {object} file
 * @param  {sting}  mode
 * @return {string} url
 */
```

__move(list, targetFolderId)__

```javascript
/**
 * move files to a folder
 * @param  {array} list
 * @param  {string} targetFolderId
 * @return {deferred}
 */
```

__propagate(type, obj, silent)__

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

__update(file, makeCurrent)__

```javascript
/**
 * updates file
 * @param  {object} file
 * @param  {boolean} makeCurrent (special handling for mark as current version) [optional]
 * @fires  api#create.file (object)
 * @return {deferred}
 */
```

__uploadFile(options)__

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

__uploadNewVersion(options)__

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

__uploadNewVersionOldSchool(options)__

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

- located: ``io.ox/mail/api.js``
- instantiated via api factory

__constants__

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

__beautifyMailText (str, lengthLimit)__

```javascript
/**
 * beautifies mail text
 * @param  {string} str
 * @param  {integer} lengthLimit
 * @return {string}
 */
```

__changeColor(list, label, local)__

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

__checkInbox()__

```javascript
/**
 * checks inbox for new mails
 * @fires api#new-mail (recent, unseen)
 * @return {deferred} done returns { unseen: [], recent: [] }
 */
```

__clear(folder_id)__

```javascript
/**
 * deletes all mails from a specific folder
 * @param  {string} folder_id
 * @fires  api#refresh.all
 * @return {deferred}
 */
```

__copy (list, targetFolderId)__

```javascript
/** 
 * copies a number of mails to another folder 
 * @param {array} list 
 * @param {string} targetFolderId
 * @return {deferred} 
 */
```

__expunge (folder_id)__

```javascript
/**
 * cleaning up
 * @param  {string]} folder_id
 * @fires  api#refresh.all
 * @return {deferred}
 */
```

__forward(obj, view)__

```javascript
/**
 * prepares object content for 'forward' action
 * @param  {object} obj (mail object)
 * @param  {string} view (html or text)
 * @return {deferred} done returnes prepared object
 */
```

__getAccountIDFromFolder(initialFolder)__

```javascript
/**
 * get account id
 * @param  {[type]} initialFolder (folder id)
 * @return {string} account id
 */
```

__getAllThreads(options, useCache)__

```javascript
/**
 * requests data for all ids
 * @param {object} options
 * @param {boolean} useCache (default is true)
 * @return {deferred} returns array of threads
 */
```

__getDefaultFolder()__

```javascript
/**
 * @return {string} default folder for mail
 */
```

__getSource(obj)__

```javascript
/**
 * get source code of specified mail
 * @param {object} obj (mail)
 * @return {deferred} returns source string
 */
```

__getThread(obj)__

```javascript
/**
 * get mails in thread
 * @param  {object} obj (mail object)
 * @return {array} of mail objects
 */
```

__getThreads(ids)__

```javascript
/**
 * get threads
 * @param  {array} ids (mail objects)
 * @return {deferred} returns array of thread objects
 */
```

__getUnmodified(obj)__

```javascript
/**
 * get mail object with unmodified content(in case externalresources warning message was ignored)
 * @param  {object]} obj (mail object)
 * @return {deferred} obj (mail object)
 */
```

__getUrl(data, mode)__

```javascript
/**
 * get url for attachment in requested mode
 * @param  {object} data (attachment)
 * @param  {string} mode ('download', 'zip', 'email, 'view', 'open')
 * @return {string} url
 */
```

__importEML(options)__

```javascript
/**
 * imports mail as EML
 * @param  {object} options (file: {}, folder: string )
 * @fires  api#refresh.all
 * @return {deferred} returns array with objects (id, folder_id)
 */
```

__markRead(list)__

```javascript
/**
 * marks list of mails read
 * @param {array} list
 * @fires api#refresh.list
 * @fires api#update:set-seen (list)
 * @return {deferred}
 */
```

__markSpam(list)__

```javascript
/**
 * marks list of mails as spam
 * @param {array} list
 * @return {deferred}
 */
```

__markUnread(list)__

```javascript
/**
 * marks list of mails unread
 * @param {array} list
 * @fires api#refresh.list
 * @return {deferred}
 */
```

__move(list, targetFolderId)__

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

__newMailTitle(state)__

```javascript
/**
 * sets title to 'New Mail' or default
 * @param  {boolean} state
 * @return {undefined}
 *
 */
```

__reply(obj, view)__

```javascript
/**
 * prepares object content for 'reply' action
 * @param  {object} obj (mail object)
 * @param  {string} view (html or text)
 * @return {deferred} done returns prepared object
 */
```

__replyall(obj, view)__

```javascript
/**
 * prepares object content for 'reply' action
 * @param  {object} obj (mail object)
 * @param  {string} view (html or text)
 * @return {deferred} done returns prepared object
 */
```

__saveAttachments(list, target)__

```javascript
/**
 * save mail attachments in files app
 * @param  {array} list
 * @param  {string} target (folder id) [optional]
 * @fires  api#refresh.all
 * @return {deferred}
 */
```

__send(data, files, form)__

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

__updateAllCache(list, callback)__

```javascript
/**
 * update item in all caches via callback in element
 * @param {array} list
 * @param {function} callback
 * @return {deferred}
 */
```

# Tasks

- located: ``io.ox/tasks/api.js``
- instantiated via api factory

__create__

```javascript
/**
 * create a task
 * @param  {object} task
 * @return {deferred} done returns object with id property
 */
```

__update__

```javascript
/**
 * update single task
 * @param  {object} task (id, folder_id, 'changed attributes')
 * @param  {string} newFolder (optional; target folder id)
 * @fires  api#refresh.all
 * @return {[type]}
 */
```

__removeFromCache__

```javascript
/**
 * remove from get/list cache
 * @param  {string|array} key
 * @fires  api#create (task)
 * @return {promise}
 */
```

__updateMultiple__

```javascript
/**
 * update list of taks used by done/undone actions when used with multiple selection
 * @param  {array}    list of task objects (id, folder_id)
 * @param  {object}   modifications
 * @fires  api#refresh.all
 * @return {deferred}
 */
```

__move__

```javascript
/**
 * move task to folder
 * @param  {object|array} task (or array of tasks)
 * @param  {string} newFolder (target folder id)
 * @fires  api#refresh.all
 * @return {deferred} done returns object with properties folder_id and task id
 */
```

__confirm__

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

__getDefaultFolder__

```javascript
/**
 * @return {string} default folder for tasks
 */
```

__getAllMyTasks__

```javascript
/**
 * used for portal plugin
 * @return {deferred} done returns list of tasks
 */
```

__getTasks__

```javascript
/**
 * get tasks for notification view
 * @fires api#new-tasks (dueTasks)
 * @fires api#set:tasks:to-be-confirmed (confirmTasks)
 * @return {deferred} done returns list of tasks
 */
```

__uploadInProgress__

- used to determine if busy animation should be shown

```javascript
/**
 * ask if this task has attachments uploading at the moment (busy animation in detail View)
 * @param  {string} key (task id)
 * @return {boolean}
 */
```

__addToUploadList(key)__

- used if task edit/create changes list of attached files

```javascript
/**
 * add task to the list
 * @param {string} key (task id)
 * @return {undefined}
 */
```

__removeFromUploadList(key)__

- used if add/delete finished

```javascript
/**
 * remove task from the list
 * @param  {string} key (task id)
 * @fires  api#update: + key
 * @return {undefined}
 */
```

__refresh()__

```javascript
/**
 * bind to global refresh; clears caches and trigger refresh.all
 * @fires  api#refresh.all
 * @return {promise}
 */
```

# APIs: General

## Account

- located: ``io.ox/core/api/account.js``
- not' instantiated via api factory

__all()__

```javascript
/**
 * get all accounts
 * @return {deferred} returns array of account object
 */
```

__autoconfig(data)__

```javascript
/**
 * get autoconfig for given emailadress
 * @param  {object} data (email, password)
 * @return {deferred} returns best available mail server settings (may be incomplete or empty)
 */
```

__create(data)__

```javascript
/**
 * create mail account
 * @param  {object} data (attributes)
 * @fires  api#create:account (data)
 * @return {deferred}
 */
```

__get(id)__

```javascript
/**
 * get mail account
 * @param  {string} id
 * @return {deferred} returns account object
 */
```

__getAllSenderAddresses()__

```javascript
/**
 * get all sender addresses
 * @return {promise} returns array of arrays
 */
```

__getFoldersByType(type)__

```javascript
/**
 * return folders for accounts
 * @param  {string} type ('inbox', 'send', 'drafts')
 * @return {array} folders
 */
```

__getPrimaryAddress(accountId)__

```javascript
/**
 * Get the primary address for a given account
 * @param  {string} accountId [optional: default account will be used instead]
 * @return {deferred} returns array (name, primary adress)
 */
```

__getPrimaryAddressFromFolder(folder_id)__

```javascript
/**
 * get primary address from folder
 * @param  {string} folder_id
 * @return {deferred} object with properties 'displayname' and 'primaryaddress'
 */
```

__getSenderAddresses(accountId)__

```javascript
/**
 * get a list of addresses that can be used when sending mails
 * @param  {string} accountId [optional: default account will be used instead]
 * @return {deferred} returns array the personal name and a list of (alias) addresses
 */
```

__getUnifiedMailboxName__

```javascript
/**
 * get unified mailbox name
 * @return {deferred} returns array or null
 */
```

__is(type, id)__

```javascript
/**
 * check folder type
 * @param  {string} type (foldertype, example is 'drafts')
 * @param  {type} id [optional]
 * @return {boolean}
 */
```

__isAccount(id)__

```javascript
/**
 * is account folder
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

__isExternal(id)__

```javascript
/**
 * is external folder
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

__isPrimary(id)__

```javascript
/**
 * is primary folder
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

__isUnified(id)__

```javascript
/**
 * is unified
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

__isUnifiedFolder(id)__

```javascript
/**
 * is unified folder
 * @param  {string}  id (folder_id)
 * @return {boolean}
 */
```

__parseAccountId(str, strict)__

```javascript
/**
 * get account id
 * @param  {string|number} str (folder_id|account_id)
 * @param  {boolean} strict
 * @return {integer} account id
 */
```

__refresh()__

```javascript
/**
 * bind to global refresh; clears caches and trigger refresh.all
 * @fires  api#refresh.all
 * @return {promise}
 */
```

__remove(data)__

```javascript
/**
 * delete mail account
 * @param  {object} data (attributes)
 * @fires  api#refresh.all
 * @fires  api#delete
 * @return {deferred}
 */
```

__update(data)__

```javascript
/**
 * update account
 * @param  {object} data (account)
 * @return {deferred} returns new account object
 */
```

__validate(data)__

```javascript
/**
 * validate account data
 * @param  {object} data (accont object)
 * @return {deferred} returns boolean
 */
```

## Apps

- located: ``io.ox/core/api/apps.js``
- not instantiated via api factory

__get(id)__

```javascript
/**
 * get app (creates empty one if doesn't exists yet)
 * @param  {string} id
 * @return {object} app
 */
```

__getByCategory(id)__

```javascript
/**
 * get by category ('productivity', 'basic', 'dev')
 * @param  {string} category
 * @return {array} object for each category
 */
```

__getCategories()__

```javascript
/**
 * get number of apps per category/special category
 * @return {array} object for each category
 */
```

__getFavorites()__

```javascript
/**
 * get favorite apps (special category)
 * @param  {string} [optional]
 * @return {array} app objects
 */
```

__getInstalled(mode)__

```javascript
/**
 * get installed apps
 * @param  {string} [optional]
 * @return {array} app objects
 */
```

__isFavorite(data)__

```javascript
/**
 * checks if app is marked as favorite (special category)
 * @param  {object}  data (app object)
 * @return {boolean}
 */
```

__markAsFavorite(id)__

```javascript
/**
 * mark as favorites (special category)
 * @param  {string} id
 * @return {undefined}
 */
```

__unmarkAsFavorite(id)__

```javascript
/**
 * unmark as favorites (special category)
 * @param  {string} id
 * @return {undefined}
 */
```

## Attachment

- located: ``io.ox/core/api/attachment.js``
- not instantiated via api factory

__getAll()__

```javascript
/**
 * gets all attachments for a specific object, for exsample a task
 * @param  {object} options
 * @return {deferred}
 */
```

__remove(options, data)__

```javascript
/**
 * removes attachments
 * @param  {object} options
 * @param  {object} data (id properties)
 * @return {deferred}
 */
```

__create(options, data)__

```javascript
/**
 * create attachment
 * @param  {object} options
 * @param  {object} data (attachment)
 * @return {deferred}
 */
```

__createOldWay(options, form)__

```javascript
/**
 * create attachment
 * @param  {object} options
 * @param  {object} form
 * @return {deferred}
 */
```

__getUrl(data, mode)__

```javascript
/**
 * builds URL to download/preview File
 * @param  {object} data
 * @param  {string} mode
 * @return {string} url
 */
```

__save(data, target)__

```javascript
/**
 * save attachment
 * @param  {object} data
 * @param  {string} target (folder_id)
 * @return {deferred}
 */
```


## Autocomplete

- located: ``io.ox/core/api/autocomplete.js``
- not instantiated via api factory

__search(query)__

```javascript
/**
 * search
 * @param  {string} query
 * @return {deferred} returns results
 */
```

__processItem(type, data)__

```javascript
/**
 * process results
 * @param  {string} type
 * @param  {array} data (contains results array)
 * @return {array}
 */
```

__processContactResults(type, data, query)__

```javascript
/**
 * process contact results
 * @param  {string} type
 * @param  {array}  data (contains results array)
 * @param  {string} query
 * @return {array}
 */
```

__processContactItem(type, list, obj, field)__

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

- located: ``io.ox/core/api/conversion.js``
- instantiated via api factory
- no events triggered
- no caching

__convert()__

```javascript
/**
 * @param  {object} dataSource
 * @param  {object} dataHandler
 * @return {deferred} done returns data object
 */
```

## Export

The module export allows to export specific module data (like Contacts, Tasks or Appointments) from a folder in several formats (iCal, vCard, CSV).

- located: ``io.ox/core/api/export.js``
- instantiated via api factory
- directly wired to http.js
- no events triggered
- no caching

__getCSV(folder, simulate)__

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

__getICAL(folder, simulate)__

```javascript
/**
 * done: returns ical string; fail: returns error object
 * @param  {string} id of folder (calendar or tasks) whose contents should be exported
 * @param  {boolean} simulate return only request url (optional)
 * @return {deferred}
 */
```

__getVCARD(folder, simulate)__

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

- located: ``io.ox/core/api/group.js``
- instantiated via api factory
- no events triggered

__getName(id)__

```javascript
/**
 * @param  {string} id
 * @return {deferred} done handler returns name (string)
 */
```

## Import

The module import allows to import specific module data (like Contacts, Tasks or Appointments) in several formats (iCal, vCard, CSV) into a folder.

- located: ``io.ox/core/api/import.js``
- not instantiated via api factory
- custom connection to http.js
- no events triggered
- no caching

__importFile(data)__

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

- located: ``io.ox/core/api/mailfilter.js``
- not instantiated via api factory

__delete(ruleId)__

```javascript
/**
 * delete rule
 * @param  {string} ruleId
 * @return {deferred}
 */
```

__create(data)__

```javascript
/**
 * create rule
 * @param  {object} data
 * @return {deferred}
 */
```

__getRules(flag)__

```javascript
/**
 * get rules
 * @param  {string} flag (filters list)
 * @return {deferred}
 */
```

__update(data)__

```javascript
/**
 * update rule
 * @param  {object} data
 * @return {deferred}
 */
```

## Publications / Subscriptions

- located: ``io.ox/core/api/pubsub.js``
- referenced as publications respectively subscriptions
- instantiated via api factory
- add/edit/remove own publications/subscriptions

__update(data)__

```javascript
/**
 * update publication/subscription
 * @param  {object} data
 * @return {deferred}
 */
```

__destroy(id)__

```javascript
/**
 * removes publication/subscription
 * @param  {string} id
 * @return {deferred}
 */
```

__create(data)__

```javascript
/**
 * create publication/subscription
 * @param  {object} data (pubsub model attributes)
 * @return {deferred} subscription id
 */
```

__refresh(data)__

- subscription only

```javascript
/**
 * refresh subscription
 * @param  {object} data (id,folder)
 * @return {deferred} item count
 */
```

## Publication Targets / Subscription Sources

- located: ``io.ox/core/api/pubsub.js``
- referenced as publicationTargets respectively sources
- instantiated via api factory

__getAll()__

- returns possible publication targets respectively subscription sources
- default api factory method
- please take a look at API Factory 

## Quota

- located: ``io.ox/core/api/quota.js``
- not instantiated via api factory

__get__

```javascript
/**
 * get mail and file quota
 * @return {deferred} returns quota object
 */
```

__getFile__

```javascript
/**
 * get File quota and current use
 * @return {deferred} returns object with quota and use properties)
 */
```

__getMail__

```javascript
/**
 * get mail quota and current use
 * @return {deferred} returns object with quota and use properties)
 */
```

## Reminder

- located: ``io.ox/core/api/reminder.js``
- not instantiated via api factory

__deleteReminder(reminderId)__

```javascript
/**
 * delete reminde
 * @param  {string} reminderId
 * @return {deferred}
 */
```

__remindMeAgain(remindDate, reminderId)__

```javascript
/**
 * remind again
 * @param  {number} remindDate (unix datetime)
 * @param  {string} reminderId
 * @return {deferred}
 */
```

__getReminders(range, module)__

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

- located: ``io.ox/core/api/resource.js``
- instantiated via api factory

__search(pattern)__

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

- located: ``io.ox/core/api/snippets.js``
- not instantiated via api factory

__getAll()__

```javascript
/**
 * get all snippets
 * @return {deferred}
 */
```

__create(snippet)__

```javascript
/**
 * create snippet
 * @param  {object} snippet
 * @return {deferred}
 */
```

__get(id)__

```javascript
/**
 * get snippet
 * @param  {string} id
 * @return {deferred}
 */
```

__list(ids)__

```javascript
/**
 * get snippets
 * @param  {array} ids
 * @return {deferred}
 */
```

__destroy(id)__

```javascript
/**
 * remove snippets
 * @param  {string} id
 * @fires  api#refresh.all
 * @return {deferred}
 */
```


## Templating

- located: ``io.ox/core/api/templating.js``
- not instantiated via api factory

__getNames()__

```javascript
/**
 * get names
 * @return {deferred} returns array of template names
 */
```

## User

- located: ``io.ox/core/api/user.js``
- instantiated via api factory

__editNewImage(o, changes, file)__

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

__getName(id)__

```javascript
/**
 * get user display name (or email if display name undefined)
 * @param {string} id of a user
 * @return {deferred} returns name string
 */
```

__getGreeting(id)__

```javascript
/**
 * get greeting ('Hello ...')
 * @param {string} id of a user
 * @return {deferred} returns greeting string
 */
```

__getTextNode(id)__

```javascript
/**
 * get text node which fetches user name asynchronously
 * @param {string} id of a user
 * @return {object} text node
 */
```

__getLink(id, text)__

```javascript
/**
 * get halo text link
 * @param {string} id of a user
 * @param  {string} text
 * @return {jquery} text link node
 */
```

__getPictureURL(id, options)__

```javascript
/**
* gets deferred.promise for fetching picture url
* @param {string} id of a user
* @param {object} options height, width, scaleType
* @return {promise}
*/
```

__getPicture(id, options)__

```javascript
/**
* get div node with callbacks managing fetching/updating
* @param {string} id of a user
* @param {object} options height, with, scaleType
* @return {object} div node with callbacks
*/
```

__getCurrentUser()__

```javascript
/**
 * get a contact model of the currently logged in user
 * @return {object} a contact model of the current user
 */
```

__update(o)__

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
