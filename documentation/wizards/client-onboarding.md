---
title: Client Onboarding
description: Helping users to get the right config/software for their os/device
---

# activation/deactivation

## capability

```
client-onboarding
```

## affects

+ portal widget
+ textlink entry in premium bar
+ textlink entry in topbar dropdown (burger)
+ wizard dialog

# components


## wizard

### actions

+ download
+ email
+ sms
+ display/easmanual
+ display/davmanual
+ display/mailmanual
+ link/mailappinstall
+ link/emclientinstall
+ link/oxupdaterinstall
+ link/drivewindowsclientinstall
+ link/driveappinstall
+ link/syncappinstall
+ link/drivemacinstall

__extension points__

```
// mapping of action and corresponding view
io.ox/onboarding/clients/views
```


### upsell settings

__extension points__

```
io.ox/core//features/upsell/client.onboarding/enabled
io.ox/core//features/upsell/client.onboarding/color
io.ox/core//features/upsell/client.onboarding/icon
```

### metrics


__events__

```
// selections
core/client-onboarding/platform/select
core/client-onboarding/device/select
core/client-onboarding/scenario/select
core/client-onboarding/action/select

// execute action
core/client-onboarding/action/execute

// toggle between simple and expert mode
core/client-onboarding/mode/toggle
```


## widget

__extension points__

```
// simply enables the widget
io.ox/portal/widget

// The main extension defining the widgets content
io.ox/portal/widget/client-onboarding

// Defines that this widget is unique and can be added only once.
io.ox/portal/widget/client-onboarding/settings
```

### customization hints

In case you want to change styles that are applied inline just overwrite the load function of the extension.


## deprecated parts

Disable/remove the 'old' widget and settings entries:

+ widget: get ox drive
+ widget: update
+ settings entry: downloads

Their functionality is now covered by the client onboarding wizard.

### settings

Remove the settings pane by disabling the follwing extension:

```
ext.point('io.ox/settings/pane/tools').disable('io.ox/core/downloads');
```

### widgets

To remove the both related portal widget/tiles please refer to:<br>
[oxpedia > configuring portal plugins > Disabling_a_tile_completely
](https://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins#Disabling_a_tile_completely
)


+ io.ox/portal/widget/oxdriveclients
+ io.ox/portal/widget/updater
