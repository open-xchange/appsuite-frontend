---
title: Triggers
---

# Available triggers

This sections lists default triggers and how they can be configured.

## Menu bar / Top bar

| ID                            | Configurable properties     | Default capabilities             | On mobile | Description                                                         |
|-------------------------------|-----------------------------|----------------------------------|-----------|---------------------------------------------------------------------|
| quick-launchers               | none                        |                                  |           | Part of quick launch icon of an app.                                |
| app-launcher                  | none                        |                                  | shown     | Part of an app icon within app launcher dropdown menu.              |
| secondary-launcher            | enabled, icon, color, title | active_sync or caldav or carddav |           | Part of secondary toolbar next to the notification or app launcher. |
| topbar-dropdown               | enabled, icon, color, title | active_sync or caldav or carddav | shown     | Part of main toolbar's dropdown as first entry.                     |

Note: In case you want to add quick launcher entries for promoted apps please take a look at the [following settings section]({{ site.baseurl }}/ui/configuration/settings-list-of.html#topbar-apps)

## Folder view

**General**

| ID                            | Configurable properties             | Default capabilities              | On mobile | Description                                                                                                                                                                                           |
|-------------------------------|-------------------------------------|-----------------------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| mail-folderview-quota         | enabled, icon, color, upsellLimit   | active_sync or caldav or carddav  | shown     | Located below the folder view without an icon by default. You can set the upsell limit in Bytes. If the maximum mail quota is larger than upsell limit, the trigger will not be shown.                 |
| folderview/mail               | enabled, icon, color, title         | active_sync                       | shown     | Located below the folder view of the mail app/module.                                                                                                                                                  |
| folderview/contacts           | enabled, icon, color, title         | carddav                           | shown     | Located below the folder view of the addressbook app/module.                                                                                                                                           |
| folderview/calendar           | enabled, icon, color, title         | caldav                            | shown     | Located below the folder view of the calendar app/module.                                                                                                                                              |

**Premium Area**

Note: These upsell trigger are placed inside the premium area at the bottom of the folder view. Therefore, these upsell trigger are only shown if the premium area is enabled.
You can enable it by setting *io.ox/core//upsell/premium/folderView/visible=true*

| ID                            | Configurable properties             | Default capabilities              | On mobile | Description                                                                                                                                                                                           |
|-------------------------------|-------------------------------------|-----------------------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| folderview/mail/bottom        | enabled, color, title               | active_sync                       | shown     | Default text 'Try now' and has no icon by default.                                                                                                                                                    |
| folderview/contacts/bottom    | enabled, color, title               | carddav                           | shown     | Default text 'Try now' and has no icon by default.                                                                                                                                                    |
| folderview/calendar/bottom    | enabled, color, title               | caldav                            | shown     | Default text 'Try now' and has no icon by default.                                                                                                                                                    |
| folderview/infostore/bottom   | enabled, color, title               | boxcom or google or msliveconnect | shown     | Default text 'Try now' and has no icon by default.                                                                                                                                                    |

## Misc

| ID                            | Configurable properties             | Default capabilities              | On mobile | Description                                                                                                                                                                                           |
|-------------------------------|-------------------------------------|-----------------------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| client.onboarding             | enabled, icon, color                |                                   | shown     | Part of "Connect your device" wizard                                                                                                                                                                  |
| portal-widget                 | enabled, icon, imageURL, removable  | active_sync or caldav or carddav  | shown     | A draggable portal widget. You can add a background image with 'imageURL'. If no image is used, the widget displays the text centered with a customizable space separated list of font-awesome icons. |

Note: Please see [upsell tools](../upsell/upsell_02_tools.html) for more features that can be used as trigger for upsell.

# Visibility of triggers

The OX App Suite provides several upsell trigger which can be configured via settings, since upsell trigger compared to the usual links would require custom UI development.

If you configure the upsell settings, the common upsell trigger will be enabled by default. Those trigger will appear when the expression of required [capability](../customize/manifests.html#capabilities) is not satisfied and the required set of upsell trigger is satisfied.

To clearify, when triggers are shown or not, we proceed with an example:
A hoster can provide a custom trigger in the secondary toolbar (next to the app launcher). This upsell trigger should promote a premium account to the user and has the default requirement of *active_sync* or *caldav* or *carddav*.
That means, if one of those capability is not set for a user and upsell is activated for *active_sync* and *caldav* and *carddav*, the upsell trigger will be shown.

You can enable upsell for those [capabilities](../customize/manifests.html#capabilities) inside an existing or new file `.properties` with

```javascript
// mind the double slashes; this is not a typo
io.ox/core//upsell/enabled/active_sync=true
io.ox/core//upsell/enabled/caldav=true
io.ox/core//upsell/enabled/carddav=true
```

**Note**: You have to restart the server so that the changes take place.

If the user clicks on the upsell trigger, a upsell event of type 'custom' with id 'secondary-launcher' is triggered so that the page/dialog which opens can react depending on the clicked link.


## Visibility based on capabilities

If you want certain upsell trigger to appear on different [capabilities](../customize/manifests.html#capabilities), you can configure this inside the `.properties` file.

Therefore, you have to configure the required field with a logical expression of capabilities for the trigger. If the actual capabilities does not satisfy the expression and the upsell capabilities satisfies the expression, the upsell trigger will be drawn.

See the following example which requires *eas* and *caldav* or not *carddav*:

```javascript
io.ox/core//features/upsell/$id/requires="active_sync && (caldav || !carddav)"
```

## Disable individual trigger

If you want to disable a custom trigger, you can add the following to the `.properties` file:

```javascript
io.ox/core//features/upsell/$id/enabled=false
```



# Customize appearance/strings

## Change default icon

All custom triggers have a 'fa-star' as default icon. You can change the default icon to any font-awesome icon or a set of space separated icons.

```javascript
io.ox/core//upsell/defaultIcon="fa-star"
```

## Change single icon

You can replace the icon of individual trigger with

```javascript
io.ox/core//features/upsell/$id/icon="fa-star"
```
where '$id' is the id of the upsell trigger.

## Change color for individual trigger

You can change the color of some upsell trigger with

```javascript
io.ox/core//features/upsell/$id/color="#f00"
```
where '$id' is the id of the upsell trigger and the color can be any css color.

## Change text

Some of the custom triggers use a title (or other strings) which a hoster could customize. You can provide your own text via

```javascript
io.ox/core//features/upsell/$id/i18n/$lang/title="A custom title"
```
where '$lang' is the current language identifier (e.g. "en_US").

**Note**: It is important, that several translations are provided.

You can see the current language identifier when you open the webconsole and type

```javascript
ox.language
```




# Feature toggles for upsell

OX App Suite UI offers different feature toggles. These toggles control the appearance of different features in the UI. Find more details about upsell feature toggles under [Settings list]({{ site.baseurl }}/ui/configuration/settings-list-of.html)
