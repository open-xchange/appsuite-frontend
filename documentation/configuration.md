---
title: Configuration
icon: fa-cog
description: Server settings (property files), config cascade and how they affect the ui
---

# Core

## Client onboarding wizard

**enrty points**

The wizard can be started via different entry points.. Further more a portal widget is available.

_textlink in the topbar dropwon (burger menu)_

```
point: io.ox/core/topbar/right/dropdown
extension-id: onboarding
```

_via a link in the new premium bar (in case it's activated)_

```
action: io.ox/[action]/premium/actions/synchronize
```

_via portal widget_

```
point: io.ox/portal/widget
extension-id: client-onboarding

point: io.ox/portal/widget/client-onboarding
point: io.ox/portal/widget/client-onboarding/settings
```

**platforms, devices and scenarios**

Please refer to the middleware feature [config documentation](https://oxpedia.org/wiki/index.php?title=AppSuite:Client_Onboarding) for more details.

**capability**

```
client-onboarding
```

**upsell**

Please refer to the [upsell documentaion](http://oxpedia.org/wiki/index.php?title=AppSuite:Upsell#Custom_upsell_links) for more details.

_middleware: configuration_

upsell event is only triggered for clicks on disabled (`enabled=false`) scenarios that have a valid *missing_capabilities* array property. Please take a look at the [middleware configuration](https://oxpedia.org/wiki/index.php?title=AppSuite:Client_Onboarding#Onboarding_providers) for more details.

_upsell: configuration_

Also the stated missing capability has to be [enabled for upsell](https://documentation.open-xchange.com/latest/ui/features/upsell.html#enable-upsell).

```
# example: enables upsell for tasks
io.ox/core//upsell/enabled/tasks=true
```

_upsell: configuration_

```
# draw premium boxes (default: true)
io.ox/core//features/upsell/client.onboarding/enabled=true
```

```
# optional: otherwise upsell default appearance is used (default: unset)
io.ox/core//features/upsell/client.onboarding/color
io.ox/core//features/upsell/client.onboarding/icon
io.ox/core//features/upsell/defaultIcon
```

**metrics**

Please refer to the [metrics article](http://oxpedia.org/wiki/index.php?title=AppSuite:Metrics-Events#Client_Onboarding)
