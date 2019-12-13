---
title: Upsell
icon: fa-funnel-dollar
---

This section is mainly for UI developers and introduces the concept of upsell from a technical point of view.

In short: End user have a set of so-called capabilities. UI, however, offers functionality beyond that limited set for promotion purposes e.g. inline links, that require missing capabilities, trigger an in-app upsell. This process leads to a trial period or a new subscription.

Technical challenge for the UI developer is to check what the end user has, what can be shown beyond that, and how to handle upsell.
It is also possible for hosting companies to easily integrate their own online shop since the internal mechanisms are loosely coupled via events.

# Enablement

In order to configure upsell server-side, create a new file `upsell-appsuite.properties`
or append to existing file `appsuite.properties`
(mind the double-slash; this is not a typo!).

If you configure upsell in the `upsell-appsuite.properties`, the properties are loaded when you trigger the live reload function.

```javascript
io.ox/core//upsell/enabled/infostore=true
io.ox/core//upsell/enabled/portal=true
io.ox/core//upsell/enabled/tasks=true
```

Each line enables a specific [capability]({{ site.baseurl }}/ui/customize/manifests.html#capabilities) for upsell.
That means whenever a feature misses one of these capabilities, a special upsell related event is triggered.

**Note**: For simple demo purposes, you can enable an internal upsell configuration by appending *&demo=upsell* to the URL and reload the specific page.

# Tracking

When implementing cross-/upsell trigger, tracking should be integrated at the same time in order to analyse performance.

The [Metrics]({{ site.baseurl }}/ui/features/metrics.html) module provides a very flexible and extendible way to track user behaviour and conditions within OX App Suite.

Upsell can be tracked via the specific [events]({{ site.baseurl }}/ui/features/metrics/09-events.html#upsell).

For more information see [trackevent]({{ site.baseurl }}/ui/features/metrics/01-details.html#trackevent).
