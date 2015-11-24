---
title: Events
---

A list of all tracked events identified with their composite id (app, ui element, action, detail). Please notice that words within box brackets are used as placeholders.

For more information please visit he other metrics articles.

# General

__Placholders__

```
[action] the data-action property of the action node
```


## Header/Logo

| EventId           | Trigger               |
|-------------------|-----------------------|
| core/banner/title | Click on header title |
| core/banner/logo  | Click on header logo  |

## File Viewer

| EventId                      | Trigger                                           |
|------------------------------|---------------------------------------------------|
| core/viewer/toolbar/[action] | User clicks on action while using the file viewer |

## Settings

| EventId                       | Trigger                                                                                     |
|-------------------------------|---------------------------------------------------------------------------------------------|
| core/toolbar/[action]         | clicks on settings, my contact data, help, getting started, fullscreen, about, sign out ... |
| settings/folder/select/[type] | Click on a specific folder/part in the setting                                              |

## Help

| EventId                               | Trigger                |
|---------------------------------------|------------------------|
| core/toolbar/help/[type] | Help action was clicked |

## Guided Tours

| EventId                               | Trigger                |
|---------------------------------------|------------------------|
| core/toolbar/guided-tour/[type] | Click on 'Start guided tour for this app' |

## Loadtime

A event triggers when an app started. The measure time is between the click on the app launcher and the moment the app was loaded (via ox.launch)

| EventId                               | Trigger                |
|---------------------------------------|------------------------|
| core/loadtime/[appname]/[time] | Click on app launcher |

## Upsell

| EventId                               | Trigger                |
|---------------------------------------|------------------------|
| core/upsell/[upsell.type]/[upsell.id] | Upsell event triggered |

# Apps

## Portal

| EventId                               | Trigger                |
|---------------------------------------|------------------------|
| portal/toolbar/add/[type]         | Click on “Add widget” button in upper right area of portal.    |
| portal/widgets/show-detail/[type] | Click on the area of the widget, which gets displayed.         |
| portal/widget/disable/[type]      | Click on the remove widget icon ("X")                          |
| portal/widget/change-order/[type] | Reordering a widget into another location on the screen.       |

## Mail

| EventId                                                                                    | Trigger                                                                    |
|--------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| mail/list/[layout]/select/one <br >mail/list/[layout]/select/multiple                      | Select mail by click on the list/grid (layout: vert, horiz, compact, list) |
| mail/toolbar/[action] <br> mail/detail/toolbar/[action] <br> mail/compose/toolbar/[action] | Clicks on a email action                                                   |
| mail/folders/folder/select/[type]                                                          | Clicks on a folder in the mail folder tree (type: primary, external)       |
| mail/folder/account/add                                                                    | Clicks on “Add new mail account”                                           |
| mail/settings/account/add                                                                  | Clicks within “Social + Mail Accounts” on “Add account”      

## Contacts

| EventId                                                      | Trigger                                                                              |
|--------------------------------------------------------------|--------------------------------------------------------------------------------------|
| contacts/list/select/one <br>  contacts/list/select/multiple | Select contact by click on the list/grid                                             |
| contacts/folder/select/[type]                                | Clicks on a folder in the contact folder tree (folder-type: private, public, shared) |
| contacts/toolbar/[action]                                    | Clicks on a a contact action                                                         |

## Calendar

| EventId                               | Trigger                                                                                          |
|---------------------------------------|--------------------------------------------------------------------------------------------------|
| calendar/toolbar/[action]             | Clicks on calendar toolbar action                                                                |
| calendar/[layout-mode]/select         | Clicks on appointments within non-list layout modes                                              |
| calendar/[layout-mode]/create         | Clicks on blank space within non-list layout modes to create appointment                         |
| calendar/folder/select/[type]         | Clicks on a folder in the contact folder tree (folder-type: private, public, shared)             |
| calendar/folder/permissions           | Clicks on the “cloud” icon and the “User” icon next to the folder name                           |
| calendar/folder/context-menu/[action] | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon |
| calendar/detail/toolbar/[action]      | Clicks on calendar detail view toolbar action                                                    |                                              

## Tasks

| EventId                            | Trigger                                                                                          |
|------------------------------------|--------------------------------------------------------------------------------------------------|
| tasks/folder/select/[type]         | Clicks on a folder in the contact folder tree (folder-type: private, public, shared)             |
| tasks/folder/context-menu/[action] | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon |
| tasks/toolbar/[action]             | Clicks on tasks toolbar action                                                                   |
| tasks/detail/[action]              | Clicks on task detail view toolbar action                                                        |                                          

## Drive

| EventId                            | Trigger                                                                                          |
|------------------------------------|--------------------------------------------------------------------------------------------------|
| drive/folder/select/[type]         | Clicks on a folder in drive folder tree (folder-type: standard_folder_type + '.' + folder_type)  |
| drive/folder/context-menu/[action] | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon |
| drive/toolbar/[action]             | Clicks on tasks toolbar action                                                                   |                                                                

## Text App (aka Text Portal)

| EventId                         | Trigger                                                      |
|---------------------------------|--------------------------------------------------------------|
| text-portal/toolbar/[action]    | Clicks on Text App toolbar action (text-newblank, text-open) |
| text-portal/recentlist/[action] | Clicks on documents in the recent list (text-edit)           |
| text-portal/templates/[action]  | Clicks on templates (text-newfromtemplate, text-newblank)    |

## Spreadsheet App (aka Spreadsheet Portal)

| EventId                                | Trigger                                                                           |
|----------------------------------------|-----------------------------------------------------------------------------------|
| spreadsheet-portal/toolbar/[action]    | Clicks on Spreadsheet App toolbar action (spreadsheet-newblank, spreadsheet-open) |
| spreadsheet-portal/recentlist/[action] | Clicks on documents in the recent list (spreadsheet-edit)                         |
| spreadsheet-portal/templates/[action]  | Clicks on templates (spreadsheet-newfromtemplate, spreadsheet-newblank)           |

## Text Editor

| EventId                      | Trigger                           |
|------------------------------|-----------------------------------|
| text-editor/toolbar/[action] | Clicks on Text Editor toolbar nyi |


