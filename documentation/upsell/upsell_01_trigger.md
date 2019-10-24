---
title: Trigger
---

# Custom trigger

This sections lists custom triggers and how they can be configured.


| ID                          | Configuration                              | Text | Default capabilities              | Description                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ----------------------------------- | ----- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| secondary-launcher          | icon, color                         | title | active_sync or caldav or carddav  | This trigger is located in the secondary toolbar next to the notification or app launcher. Icon, text and color can be customized. Due to space limitations, the trigger is not shown on mobile devices.                                                                                                                                             |
| folderview/mail             | icon, color                         | title | active_sync                       | This trigger is located below the folderview of the mail app/module.                                                                                                                                                                                                                                                                                                                                                   |
| folderview/mail/bottom^1      | color                               | title | active_sync                       | This trigger is located at the bottom of the folderview of the mail app/module in the premium area. This trigger is styled as button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                              |
| folderview/contacts         | icon, color                         | title | carddav                           | This trigger is located below the folderview of the addressbook app/module.                                                                                                                                                                                                                                                                                                                                        |
| folderview/contacts/bottom^1  | color                               | title | carddav                           | This trigger is located at the bottom of the folderview of the contacts app/module in the premium area. This trigger is styled as button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                          |
| folderview/calendar         | icon, color                         | title | caldav                            | This trigger is located below the folderview of the calendar app/module.                                                                                                                                                                                                                                                                                                                                            |
| folderview/calendar/bottom^1  | color                               | title | caldav                            | This trigger is located at the bottom of the folderview of the calendar app/module in the premium area. This trigger is styled as button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                          |
| folderview/infostore/bottom^1 | color                               | title | boxcom or google or msliveconnect | This trigger is located at the bottom of the folderview of the drive app/module in the premium area. This trigger is styled as button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                             |
| topbar-dropdown             | icon, color                         | title | active_sync or caldav or carddav  | This trigger is located on the first position of the dropdown in the secondary toolbar. It contains text and an icon.                                                                                                                                                                                                                                                                                  |
| portal-widget               | imageURL, removable (boolean), icon | title | active_sync or caldav or carddav  | This trigger adds a draggable portal widget with default text to the OX App Suite portal. You can add a background image with 'imageURL'; If no image is used, the widget displays the text centered with a customizable space separated list of font-awesome icons. This widget is not removable by default; you have to  set ‘removable’ to true. |
| mail-folderview-quota       | upsellLimit, icon, color            | title | active_sync or caldav or carddav  | This trigger is appended below the folderview and has no icon by default. You can set the upsell limit in Bytes. If the maximum mail quota is larger than upsell limit, the trigger will not be shown.                                                                                                                                                  |

^1 These upsell trigger are placed inside the premium area at the bottom of the folderview. Therefore, these upsell trigger are only shown if the premium area is enabled.
You can enable it by setting *io.ox/core//upsell/premium/folderView/visible=true*

**Note**: Please see upsell tools for more features that can be used as trigger for upsell.



# Visibility of trigger

The OX App Suite provides several upsell trigger which can be configured via settings, since upsell trigger compared to the usual links would require custom UI development.

If you configure the upsell settings, the custom upsell trigger will be enabled by default. Those trigger will appear when the expression of required [capability](../customize/manifests.html#capabilities) is not satisfied and the required set of upsell trigger is satisfied.

To clearify, when triggers are shown or not, we proceed with an example:
A hoster can provide a custom upsell trigger in the secondary toolbar (next to the app launcher). This upsell trigger should promote a premium account to the user and has the default requirement of *active_sync* or *caldav* or *carddav*.
That means, if one of those capability is not set for a user and upsell is activated for *active_sync* and *caldav* and *carddav*, the upsell trigger will be shown.

You can enable upsell for those [capabilities](../customize/manifests.html#capabilities) inside an existing or new file `.properties` with

```javascript
io.ox/core//upsell/enabled/active_sync=true
io.ox/core//upsell/enabled/caldav=true
io.ox/core//upsell/enabled/carddav=true
```

**Note**: You have to restart the server so that the changes take place.

If the user clicks on the upsell trigger, a upsell event of type 'custom' with id 'secondary-toolbar' is triggered so that the page/dialog which opens can react depending on the clicked link.


## Visibility based on capabilities

If you want certain upsell trigger to appear on different capabilities, you can configure this inside the `.properties` file.

Therefore, you have to configure the required field with a logical expression of capabilities for the trigger. If the actual capabilities does not satisfy the expression and the upsell capabilites satisfies the expression, the upsell trigger will be drawn.

See the following example which requires *eas* and *caldav* or not *carddav*:

```javascript
io.ox/core//features/upsell/$id/requires="active_sync && (caldav || !carddav)"
```

## Disable individual trigger

If you want to disable a custom upsell trigger, you can add the following to the `.properties` file:

```javascript
io.ox/core//features/upsell/$id/enabled=false
```



# Customize appearance/strings

## Change default icon

All custom upsell trigger have a 'fa-star' as default icon. You can change the default icon to any font-awesome icon or a set of space separated icons.

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

Some of the custom upsell trigger use a title (or other strings) which a hoster could customize. You can provide your own text via

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

OX App Suite UI offers different feature toggles. These toggles control the appearance of different features in the UI. Find more details about upsell feature toggles under [Settings list](https://documentation.open-xchange.com/latest/ui/configuration/settings-list-of.html)
