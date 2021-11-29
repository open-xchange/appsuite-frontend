---
title: Client onboarding
description:
---

```
namespace:  io.ox/onboarding/clients
settings:   -
capability: client-onboarding
```

# Entry points

The wizard can be started via different entry points or by using the available portal widget.

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

# Platforms, devices and scenarios
The new onboarding wizard is configured via settings and capabilities, please see:
https://documentation.open-xchange.com/7.10.5/ui/configuration/settings-list-of.html#onboarding

The old wizard can still be enabled via setting:
<config>io.ox/core//onboardingWizard=false</config>
Please refer to the middleware feature [config documentation](https://oxpedia.org/wiki/index.php?title=AppSuite:Client_Onboarding) for more details about the old wizard.

# Upsell

Please refer to the [upsell documentation]({{ site.baseurl }}/ui/features/upsell.html) for more details.

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

# Metrics

Please refer to the [metrics article](https://documentation.open-xchange.com/latest/ui/features/metrics/09-events.html)
