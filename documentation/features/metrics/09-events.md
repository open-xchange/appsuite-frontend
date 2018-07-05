---
title: Events
---

<!--lint disable no-undefined-references no-shortcut-reference-link no-html-->

A list of all tracked events identified with their composite id (app, ui element, action, detail). Please notice that words within box brackets are used as placeholders.

<!--lint disable no-undefined-references no-shortcut-reference-link no-html-->

For more information please visit he other metrics articles.

# General

**Placeholders**

```
[action] the data-action property of the action node
```

## Header/Logo

| EventId           | Trigger               |
| ----------------- | --------------------- |
| core/banner/title | Click on header title |
| core/banner/logo  | Click on header logo  |

## File Viewer

| EventId                      | Trigger                                           |
| ---------------------------- | ------------------------------------------------- |
| core/viewer/toolbar/[action] | User clicks on action while using the file viewer |

## Settings

| EventId                       | Trigger                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| core/toolbar/[action]         | clicks on settings, my contact data, help, getting started, fullscreen, about, sign out ... |
| settings/folder/select/[type] | Click on a specific folder/part in the setting                                              |

## Data

| EventId                                        | Trigger                                           |
| ---------------------------------------------- | ------------------------------------------------- |
| data/drive/account/[action]/[filestorage‑type] | create, update, delete filestorage authentication |

## Help

| EventId                  | Trigger                 |
| ------------------------ | ----------------------- |
| core/toolbar/help/[type] | Help action was clicked |

## Guided Tours

| EventId                         | Trigger                                   |
| ------------------------------- | ----------------------------------------- |
| core/toolbar/guided-tour/[type] | Click on 'Start guided tour for this app' |

## Loadtime

A event triggers when an app started. The measure time is between the click on the app launcher and the moment the app was loaded (via ox.launch)

| EventId                        | Trigger               |
| ------------------------------ | --------------------- |
| core/loadtime/[appname]/[time] | Click on app launcher |

## Upsell

| EventId                               | Trigger                |
| ------------------------------------- | ---------------------- |
| core/upsell/[upsell.type]/[upsell.id] | Upsell event triggered |

## Halo

| EventId         | Trigger               |
|-----------------|-----------------------|
| core/halo/[app] | Halo link was clicked |

## Search

| EventId                                  | Trigger                |
|------------------------------------------|------------------------|
| [app]/search/filter/[facet]/[add|remove] | Active filters changed |

# Apps

## Portal

| EventId                           | Trigger                                                     |
| --------------------------------- | ----------------------------------------------------------- |
| portal/toolbar/add/[type]         | Click on “Add widget” button in upper right area of portal. |
| portal/widgets/show‑detail/[type] | Click on the area of the widget, which gets displayed.      |
| portal/widget/disable/[type]      | Click on the remove widget icon ("X")                       |
| portal/widget/change‑order/[type] | Reordering a widget into another location on the screen.    |

## Mail

| EventId                                                                                                                                                       | Trigger                                                                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| mail/list/[layout]/select/one <br> mail/list/[layout]/select/multiple                                                                                         | Select mail by click on the list/grid (layout: vert, horiz, compact, list)                                                                |
| mail/toolbar/[action] <br> mail/list/toolbar/[action] <br> mail/detail/toolbar/[action] <br> mail/folder/toolbar/[action] <br>  mail/compose/toolbar/[action] | Clicks on a email action                                                                                                                  |
| mail/folder/select/[list‑of‑flags]                                                                                                                            | Clicks on a folder in the mail folder tree (flags: primary, external, default, virtual, unified, trash, inbox, send, drafts, spam, trash) |
| mail/folder/context-menu/[action]                                                                                                                             | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon                                          |
| mail/folder/drop/[single,multiple]                                                                                                                            | Drops selected mail(s) in listview on folder                                                                                                       |
| mail/folder/account/add                                                                                                                                       | Clicks on “Add new mail account”                                                                                                          |
| mail/settings/account/add                                                                                                                                     | Clicks within “Social + Mail Accounts” on “Add account”                                                                                   |

## Contacts

| EventId                                                                                                                                   | Trigger                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| contacts/list/select/one <br>  contacts/list/select/multiple                                                                              | Select contact by click on the list/grid                                                         |
| contacts/folder/select/[list‑of‑flags]                                                                                                    | Clicks on a folder in the contact folder tree (flags: private, public, shared, default, virtual) |
| contacts/toolbar/[action] <br> contacts/list/toolbar/[action] <br> contacts/detail/toolbar/[action] <br> contacts/folder/toolbar/[action] | Clicks on a contact action                                                                       |
| contacts/edit/contact/toolbar/[action]                                                                                                    | Clicks on a action in the create/edit dialog                                                     |
| contacts/edit/distribution‑list/toolbar/[action]                                                                                          | Clicks on a action in the create/edit dialog                                                     |
| contacts/edit/contact/add‑attachment                                                                                                      | Successfully adding a attachment                                                                 |

## Calendar

| EventId                                                                                                                                    | Trigger                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| calendar/toolbar/[action] <br> calendar/list/toolbar/[action] <br> calendar/detail/toolbar/[action] <br>  calendar/folder/toolbar/[action] | Clicks on calendar toolbar action                                                                 |
| calendar/[layout-mode]/select                                                                                                              | Clicks on appointments within non-list layout modes                                               |
| calendar/[layout-mode]/create                                                                                                              | Clicks on blank space within non-list layout modes to create appointment                          |
| calendar/folder/select/[list‑of‑flags]                                                                                                     | Clicks on a folder in the calendar folder tree (flags: private, public, shared, default, virtual) |
| calendar/folder/permissions                                                                                                                | Clicks on the “cloud” icon and the “User” icon next to the folder name                            |
| calendar/folder/context‑menu/[action]                                                                                                      | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon  |
| calendar/detail/toolbar/[action]                                                                                                           | Clicks on calendar detail view toolbar action                                                     |
| calendar/edit/toolbar/[action]                                                                                                             | Clicks on a action in the create/edit dialog                                                      |
| calendar/edit/add‑attachment                                                                                                               | Successfully adding a attachment                                                                  |

## Tasks

| EventId                                                                                                                       | Trigger                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| tasks/list/select/one <br>  tasks/list/select/multiple                                                                        | Select task by click on the list                                                                 |
| tasks/folder/select/[list‑of‑flags]                                                                                           | Clicks on a folder in the tasks folder tree (flags: private, public, shared, default, virtual)   |
| tasks/folder/context‑menu/[action]                                                                                            | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon |
| tasks/toolbar/[action] <br> tasks/list/toolbar/[action] <br> tasks/detail/toolbar/[action] <br> tasks/folder/toolbar/[action] | Clicks on tasks toolbar action                                                                   |
| tasks/edit/toolbar/[action]                                                                                                   | Clicks on a action in the create/edit dialog                                                     |
| tasks/edit/add‑attachment                                                                                                     | Successfully adding a attachment                                                                 |
## Drive

| EventId                                                                                    | Trigger                                                                                             |
|--------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| drive/folder/select/[types]                                                                | Clicks on a folder in drive folder tree (flags: default, documents, music, pictures, videos, trash) |
| drive/folder/context‑menu/[action]                                                         | Clicks within the context menu, which pops up, when you click on a folder name and its menu icon    |
| drive/toolbar/[action] <br> drive/list/toolbar/[action] <br> drive/folder/toolbar/[action] | Clicks on drive toolbar action                                                                      |
| drive/folder/account/add/[id]                                                              | Clicks on 'Add account' buttons                                                                     |                                                                    |

## Text App (aka Text Portal)

| EventId                         | Trigger                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| text‑portal/toolbar/[action]    | Clicks on Text App toolbar action (text-newblank, text-open) |
| text‑portal/recentlist/[action] | Clicks on documents in the recent list (text-edit)           |
| text‑portal/templates/[action]  | Clicks on templates (text-newfromtemplate, text-newblank)    |

## Spreadsheet App (aka Spreadsheet Portal)

| EventId                                | Trigger                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| spreadsheet‑portal/toolbar/[action]    | Clicks on Spreadsheet App toolbar action (spreadsheet-newblank, spreadsheet-open) |
| spreadsheet‑portal/recentlist/[action] | Clicks on documents in the recent list (spreadsheet-edit)                         |
| spreadsheet‑portal/templates/[action]  | Clicks on templates (spreadsheet-newfromtemplate, spreadsheet-newblank)           |

## Text Editor

| EventId                      | Trigger                       |
| ---------------------------- | ----------------------------- |
| text‑editor/toolbar/[action] | Clicks on Text Editor toolbar |

<!--lint enable no-undefined-references no-shortcut-reference-link no-html-->
