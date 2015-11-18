---
title: Events
---

## General

### Header/Logo

| EventId           | Trigger               |
|-------------------|-----------------------|
| core/banner/title | Click on header title |
| core/banner/logo  | Click on header logo  |

### File Viewer

| EventId                               | Trigger                |
|---------------------------------------|------------------------|
| core/viewer/toolbar/[action] | User clicks on action while using the file viewer |

### Settings

| EventId                    | Trigger |
|----------------------------|----------|
| core/toolbar/[action] | Clicks (settings, my contact data, help, getting started, fullscreen, about, sign out) within the context menu of our settings icon at the top right. |

### Upsell

| EventId                               | Trigger                |
|---------------------------------------|------------------------|
| core/upsell/[upsell.type]/[upsell.id] | Upsell event triggered |

## Apps

### Portal

| EventId                                  | Trigger                                                        |
|------------------------------------------|----------------------------------------------------------------|
| portal/toolbar/add/[type]         | Click on “Add widget” button in upper right area of portal.    |
| portal/toolbar/add/[type]         | Click on a specific widget to “install” it on the portal page. |
| portal/widgets/show-detail/[type] | Click on the area of the widget, which gets displayed.         |
| portal/widget/disable/[type]      | Click on the remove widget icon (“X”)                          |
| portal/widget/change-order/[type] | Reordering a widget into another location on the screen.       |

### Mail

| EventId                                                                                   | Trigger                                                                                                                                                      |
|-------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| mail/list/[layout]/select/one <br >mail/list/[layout]/select/mulitple                                              | Select mail by click on the list/grid (layout: vert, horiz, compact, list)                                                                                |
| mail/toolbar/[action] <br> mail/detail/toolbar/[action] <br> mail/compose/toolbar/[action] | Clicks on a email action                         |
| mail/folders/folder/select/[type]                                                         | Clicks on a folder in the mail folder tree (type: primary, external) |
| mail/folder/account/add                                                                   | Clicks on “Add new mail account”                                                                                                                             |
| mail/settings/account/add                                                                 | Clicks within “Social + Mail Accounts” on “Add account”                                                                                                      |

### Contacts

| EventId                                                  | Trigger                                                                               |
|----------------------------------------------------------|---------------------------------------------------------------------------------------|
| contacts/list/select/one <br>  contacts/list/select/multiple | Select contact by click on the list/grid                                              |
| contacts/folder/select/[type]                     | Clicks on a folder in the contact folder tree (folder-type: private, public, shared)  |
| contacts/toolbar/[action]                           | Clicks on a a contact action                                                          |

### Calendar

| EventId                                    | Trigger                                                                                          |
|--------------------------------------------|--------------------------------------------------------------------------------------------------|
| calendar/toolbar/[action]             | Clicks on calendar toolbar action                                                                |
| calendar/folder/select/[type]       | Clicks on a folder in the contact folder tree (folder-type: private, public, shared)             |
| calendar/folder/permissions                | Clicks on the “cloud” icon and the “User” icon next to the folder name                           |
| calendar/folder/context-menu/[action] | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon |
| calendar/detail/toolbar/[action]      | Clicks on calendar detail view toolbar action                                                   |

### Tasks

| EventId                                 | Trigger                                                                                          |
|-----------------------------------------|--------------------------------------------------------------------------------------------------|
| tasks/folder/select/[type]       | Clicks on a folder in the contact folder tree (folder-type: private, public, shared)             |
| tasks/folder/context-menu/[action] | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon |
| tasks/toolbar/[action]             | Clicks on tasks toolbar action                                                                   |
| tasks/detail/[action]              | Clicks on calendar detail view toolbar action                                                    |

### Drive

| EventId                                 | Trigger                                                                                          |
|-----------------------------------------|--------------------------------------------------------------------------------------------------|
| drive/folder/select/[type]       | Clicks on a folder in drive folder tree (folder-type: standard_folder_type + '.' + folder_type)             |
| drive/folder/context-menu/[action] | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon |
| drive/toolbar/[action]             | Clicks on tasks toolbar action                                                                   |




