---
title: Analytics solutions 
description: 
---

# PIWIK

With this easy step-by-step guide it should be quite simple to setup PIWIK and adjust the relevant properties to start tracking. Documentation about the corresponding front end adapter can be found [ here].

## Preconditions

### important

Please ensure PIWIK runs also on SSL in case OX Appsuite does.

### adblockers

hint: in case you consider to bypass adblockier mechanisms please avoid suspicious strings for any part of the url (for example ‘piwik’). One possible solution would be to use _apaches mod\_rewrite_ or something similar to alias affected urls.

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

## Appsuite properties

Now we have to extract some of the information used in this script. The script itself do not has to be added to OX Appsuite. Use the following file to adjust/add the properties:

```
  /opt/open-xchange/etc/settings/metrics.properties
```

### base url

You need to specify the base url that allows OX Appsuite calling the PIWIK tracking API. You can simply check if got the right url by trying to open the url followed by ‘piwik.php’ in the browser (example: ‘https:%%//%%metrics.example.com/piwik/piwik.php’). You should see some message similiar to ‘Piwik is a free/libre web analytics that lets you keep control of your data.’

_generated PIWIK script_

```javascript
    [...]
    var u="//metrics.example.com/piwik/";
    [...]
```

_appsuite property_

```javascript
    io.ox/core//tracking/piwik/url=https://metrics.example.com/piwik/
```

### siteId

With PIWIK you can separate tracking by using different contextes called ‘websites’. These contextes are identified by an unique id that usually starts with 1 and increments by 1 for every newly created page. To guarantee tracked date is added to the right context you have to specify this id in the settings. In case no setting is provided the id ‘1’ is used as default

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
