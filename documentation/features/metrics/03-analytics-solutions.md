---
title: Analytics solutions
description:
---

# PIWIK

With this easy step-by-step guide it should be quite simple to setup PIWIK and adjust the relevant properties to start tracking. Documentation about the corresponding front end adapter can be found [here](02-adapters.html#piwik).

## Preconditions

### important

Please ensure PIWIK runs also on SSL in case OX App Suite does.

### adblockers

hint: in case you consider to bypass adblockier mechanisms please avoid suspicious strings for any part of the url (for example ‘piwik’). One possible solution would be to use _apaches mod_rewrite_ or something similar to alias affected urls.

## Install PIWIK

Simply follow the steps provided by the PIWIK documentation [piwik.org/docs/installation](http://piwik.org/docs/installation)

Please pause when you reach step 8 of the wizard (JavaScript Tag) and move on with part 2 of this guide.

## Take a deeper look at the generated script

The script provided by PIWIK will look like this:

```javascript
  <!-- Piwik -->
  <script type="text/javascript">
    var _paq = _paq || [];
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
      // in this line you can see the base url that we need to add as property
      var u="//metrics.example.com/piwik/";
      _paq.push(['setTrackerUrl', u+'piwik.php']);
      // in this line you can see the site id that we need to add as property
      _paq.push(['setSiteId', 1]);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js';
      s.parentNode.insertBefore(g,s);
    })();
  </script>
  <img src="//somedomain.com/piwik/piwik.php?idsite=1" style="border:0;" alt="" />
  <!-- End Piwik Code -->
```

## OX App Suite properties

Now we have to extract some of the information used in this script. The script itself do not has to be added to OX App Suite. Use the following file to adjust/add the properties:

```
  /opt/open-xchange/etc/settings/metrics.properties
```

### base url

You need to specify the base url that allows OX App Suite calling the PIWIK tracking API. You can simply check if got the right url by trying to open the url followed by ‘piwik.php’ in the browser (example: ‘https&#x3A;%%//%%metrics.example.com/piwik/piwik.php’). You should see some message similar to ‘Piwik is a free/libre web analytics that lets you keep control of your data.’

_generated PIWIK script_

```javascript
    [...]
    var u="//metrics.example.com/piwik/";
    [...]
```

_appsuite property_

```javascript
    io.ox/core//tracking/piwik/url/lib=https://metrics.example.com/piwik/piwik.js
    io.ox/core//tracking/piwik/url/api=https://metrics.example.com/piwik/piwik.php
```

### siteId

With PIWIK you can separate tracking by using different contexts called ‘websites’. These contexts are identified by an unique id that usually starts with 1 and increments by 1 for every newly created page. To guarantee tracked date is added to the right context you have to specify this id in the settings. In case no setting is provided the id ‘1’ is used as default

_generated PIWIK script_

```javascript
    [...]
    _paq.push(['setSiteId', 1]);
    [...]
```

_appsuite property_

```javascript
    io.ox/core//tracking/piwik/id=1
```

_enabling/disabling_

Finally you need to enable tracking in general and PIWIK in particular.

```javascript
  io.ox/core//tracking/enabled=true
  io.ox/core//tracking/piwik/enabled=true
```

## Continue

Please continue with the PIWIK Installation wizard.

### custom variables

As a default the metrics framework tracks three values for each session:

- language: the one defined in the user setting of OX App Suite
- version: the current version of OX App Suite
- capabilities: a list of active capabilities

Unfortunately PIWIK limits the maximal length of custom variable values to [200 chars](http://piwik.org/docs/custom-variables/). Usually the list of capabilities has more than 800 chars. For this reason the capabilities are split into smaller chunks (id: capabilities-1, id: capabilities-2, ...). As default PIWIK only supports 5 custom variables so you have to [increase the number](http://piwik.org/faq/how-to/faq_17931/) to at least 7.

# Google Analytics

With this easy step-by-step guide it should be quite simple to setup Google Analytics and adjust the relevant properties to start tracking. Documentation about the corresponding front end adapter can be found [here](02-adapters.html).

## Preconditions

## adblockers

hint: in case you consider to bypass adblockier mechanisms please avoid suspicious strings for any part of the url (for example ‘analytics’).

## OX App Suite properties

Now we have to that tracking id. Use the following file to adjust/add the properties:

```
  /opt/open-xchange/etc/settings/metrics.properties
```


### tracking id

Please visit the admin page and open the 'tracking code' pane. At the very top of this pane there is a text block captioned as 'tracking id' with an identifier starting with 'UA-'.

_appsuite property_

```javascript
    io.ox/core//tracking/analytics/id=UA-xxxxxxxx-xx
```

### base url

You can optionally adjust the url where the `analytics.js` is provided. As a default value we use `https://www.google-analytics.com/analytics.js` which should work out of the box for most uses cases.

_appsuite property_

```javascript
    io.ox/core//tracking/analytics/url=https://www.google-analytics.com/analytics.js
```

### custom dimensions

As a default the metrics framework tracks three values for each session:

- language: the one defined in the user setting of OX App Suite
- version: the current version of OX App Suite
- capabilities: a list of active capabilities

To submit this data to Google Analytics you have to setup corresponding [custom dimensions](https://support.google.com/analytics/answer/2709828) and specify mappings in the OX App Suite property file.

_appsuite property_

```javascript
    io.ox/core//tracking/analytics/mapping/language=dimension1
    io.ox/core//tracking/analytics/mapping/version=dimension2
    io.ox/core//tracking/analytics/mapping/capabilities=dimension3
```


## Enabling and disabling

_appsuite property_
Finally you need to enable tracking in general and Google Analytics in particular.

```javascript
  io.ox/core//tracking/enabled=true
  io.ox/core//tracking/analytics/enabled=true
```
