---
title: Client Onboarding
description: Helping users to get the right config/software for their os/device
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Client_Onoarding
---

This Feature is introduced with _7.8.1_, covers _non-smartphone devices_ and is _disabled by default_.

# activation

## capability

Activate the wizard with the following capability:

```
client-onboarding
```

## affects

With this feature enabled the following ui changes are applied.
First of all the wizard itself is available and can be started.
This can be done via a textlink in the topbar dropwon (burger menu) and also via a link in the new premium bar (in case it's activated).
Further more a portal widget is available.

# components

## wizard dialog

### select platform (1. step)

available options per _default configuraton_:

- windows
- android
- apple

### select device (2. step)

available options per _default configuration_:

- pc
- android smartphone
- android tablet
- iPhone
- iPad
- mac

### select scenario and action (3. step)

Please take a look at the related middleware documentaion and yaml config files for more details.

**extension points**

```
// mapping of action and corresponding view
io.ox/onboarding/clients/views
```

### upsell settings

Please refer to the [upsell documentaion](http://oxpedia.org/wiki/index.php?title=AppSuite:Upsell#Custom_upsell_links) for more details.

**extension points**

```
io.ox/core//features/upsell/client.onboarding/enabled
io.ox/core//features/upsell/client.onboarding/color
io.ox/core//features/upsell/client.onboarding/icon
```

### metrics

Please refer to the [metrics article](http://oxpedia.org/wiki/index.php?title=AppSuite:Metrics-Events#Client_Onboarding)

## widget

**extension points**

```
// enables the widget
io.ox/portal/widget

// main extension defining the widgets content
io.ox/portal/widget/client-onboarding

// defines that this widget is unique and can be added only once
io.ox/portal/widget/client-onboarding/settings
```

## deprecated parts

The wizard replaces and extends the functionality of the old Download Section in settings and the correspoinding widgets. We recommend to disable these outdated parts.

- widget: get ox drive
- widget: update
- settings entry: downloads

### remove settings section 'Downloads'

Edit the property file and change the value to `true`:

```
io.ox/core//settings/downloadsDisabled
```

### remove widgets

To remove the both related portal widget/tiles please refer to:

[oxpedia > configuring portal plugins > Disabling_a_tile_completely
](https://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins#Disabling_a_tile_completely)

- io.ox/portal/widget/oxdriveclients
- io.ox/portal/widget/updater
