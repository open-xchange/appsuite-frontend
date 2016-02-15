---
title: Extension points
description: Create custom folderview entries in settings
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Create_custom_folderview_entries_in_settings_app
---

This articles covers which extension points are provided by the settings app and how to extend them to add custom folderview entries.

# Misc

- io.ox/settings/accounts/mail/settings/detail


# Customize

## Add a new settings link

By default, the folderview in settings contains four sections. 
If you want to add a link to a section, you have to find out the ID of the section. 
The extension point you are looking for has the name

```javascript
'io.ox/settings/pane/' + sectionID
```

For example, if you want to have a setting in the section external (this is where you should usually put your settings) you can use the following code:

```javascript
ext.point('io.ox/settings/pane/external').extend({
    title: gt('Title'),
    index: 350,
    id: 'myUniqueID',
    ref: 'reference/to/settings/page'
});
```

## Create a subsetting link

Let's say you have a setting and you want to add a subsetting beyond that. 
To do this, you have to know the name and ID of the parent extension point.
Then you simply have to extend the extension point with the name:

```javascript
parentName + '/' + parentID
```

The following code example creates a subsetting for the setting created above:

 ```javascript
ext.point('io.ox/settings/pane/external/myUniqueID').extend({
    title: gt('Title of Subsetting'),
    index: 100,
    id: 'myOtherUniqueID',
    ref: 'reference/to/other/settings/page'
});
 ```

## Create a new settingsgroup

If you have several settings that should be provided in a seperate section, you can extend the following extension point:

```javascript
ext.point('io.ox/settings/pane').extend({
    id: 'mySectionID',
    index: 500,
    subgroup: 'io.ox/settings/pane/mySectionID'
});
```

You have to provide a unique sectionID and a unique subgroupID to create a section. If you want to add links to this section, you just have to extend the extension point:

```javascript
'io.ox/settings/pane/mySectionId'
```

