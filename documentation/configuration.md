---
title: Configuration
icon: fa-cog
description: Server settings (property files), config cascade and how they affect the ui
---

# Core

## Client onboarding wizard

*capability: client-onboarding*

With this feature enabled the wizard itself is available and can be started.
This can be done via a textlink in the topbar dropwon (burger menu) and also via a link in the new premium bar (in case it's activated). Further more a portal widget is available.

Please refer to the middleware feature config documentation for more details.

**metrics**

Please refer to the [metrics article](http://oxpedia.org/wiki/index.php?title=AppSuite:Metrics-Events#Client_Onboarding)

**upsell settings**

Please refer to the [upsell documentaion](http://oxpedia.org/wiki/index.php?title=AppSuite:Upsell#Custom_upsell_links) for more details.

hint: upsell event is only triggered for clicks on disabled (`enabled=false`) scenarios that have a valid *missing_capabilities* array property. Also the stated missing capability has to be enabeled for upsell (`io.ox/core/upsell/enabled/`).

```
io.ox/core//features/upsell/client.onboarding/enabled
io.ox/core//features/upsell/client.onboarding/color
io.ox/core//features/upsell/client.onboarding/icon
io.ox/core//features/upsell/defaultIcon
```
