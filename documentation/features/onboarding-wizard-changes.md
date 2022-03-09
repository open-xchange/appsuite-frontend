---
title: Onboarding wizard changes
description:
---

With 7.10.5 we introduced a complete new **"Connect your device wizard"** which makes it a lot easier for end users to connect their native clients and mobile devices to the various native protocols supported by App Suite like CardDAV, CalDAV and IMAP.

The new wizard is enabled by default. You may choose to use the old client onboarding wizard for compatibility reasons, but we strongly encourage you to switch to the new one, to ensure easy configuration for your end users. The old wizard will be deprecated with App Suite 8.0.

To enable the old wizard, use the following setting:

`io.ox/core//onboardingWizard=false`

# Configuration and changes

The old onboarding configuration via middleware properties is mostly obsolete now. Instead most of the configuration is handled by ui settings. Enabling and disabling of certain setup scenarios is now regulated by capabilities. The mentioned settings and capabilities are described in detail here:

[Onboarding settings](https://documentation.open-xchange.com/7.10.5/ui/configuration/settings-list-of.html#onboarding)

Additionally the following onboarding scenario was removed and is no longer supported in favour of new onboarding methods like QR code support:

- sending configuration via SMS/ E-mail

Nevertheless the following properties from the old middleware configuration are still in use and are mandatory for manual configuration scenarios with the new wizard:

- `com.openexchange.client.onboarding.caldav.url`
- `com.openexchange.client.onboarding.carddav.url`
- `client-onboarding-mail.properties`
- `com.openexchange.client.onboarding.eas.url`

For more information please refer to this [article](https://oxpedia.org/wiki/index.php?title=AppSuite:Client_Onboarding), where the mentioned middleware properties are described in detail.

# Upsell
For now the new wizard does not support the configuration of upsell scenarios. Support for upsell is planned to be added in a future update.
