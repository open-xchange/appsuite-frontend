---
title: Step-by-step guide
---

With this easy step-by-step guide it should be quite simple to setup PIWIK and adjust the relevant properties to start tracking.

## Preconditions
__important__ 

Please ensure PIWIK runs also on SSL in case OX Appsuite does.

__adblockers__

hint: in case you consider to bypass adblockier mechanisms please avoid suspicious strings for any part of the url (for example 'piwik'). One possible solution would be to use [apaches mod_rewrite](http://httpd.apache.org/docs/current/mod/mod_rewrite.html) or something similar to aliases for affected urls. 

## Install PIWIK

Simply follow the steps provided by the PIWIK documentation
[http://piwik.org/docs/installation/](http://piwik.org/docs/installation/)

Please pause when you reach step 8 of the wizard (JavaScript Tag) and move on with part 2 of this guide.

## Take a deeper look at the generated script

The script provided by PIWIK will look like this:




```bash
$ test
#comment
git information
```

```git
diff --git a/ui/apps/io.ox/search/facets/extensions.js b/ui/apps/io.ox/search/facets/extensions.js
index 175dba2..17b4823 100644
--- a/ui/apps/io.ox/search/facets/extensions.js
+++ b/ui/apps/io.ox/search/facets/extensions.js
@@ -457,9 +457,9 @@ define('io.ox/search/facets/extensions',
 
                         if (value !== '') {
                             // standard date format
-                            value = (dateAPI.Local.parse(value, dateAPI.DATE));
-                            // use 23:59:59 for end date
-                            value = type === 'start' ? value : value.setHours(0,0,0,0).add(dateAPI.DAY-1);
+                            value = (dateAPI.Local.parse(value, dateAPI.DATE)).setHours(0,0,0,0);
+                            // use 23:59:59:999 for end date
+                            value = type === 'start' ? value : value.add(dateAPI.DAY-1);
                         } else {
                             // use wildcard
                             value = value !== '' ? value : WILDCARD;
@@ -550,7 +550,7 @@ define('io.ox/search/facets/extensions',
                                     .append(
                                         getBlock(gt('Starts on'), 'start', from),
                                         $('<span class="input-group-addon">').text('-'),
-                                        getBlock(gt('Ends on'), 'start', to)
+                                        getBlock(gt('Ends on'), 'end', to)
                                     )
                                     .datepicker({
                                         format: dateAPI.getFormat(dateAPI.DATE).replace(/\by\b/, 'yyyy').toLowerCase(),


```


```javascript
// Piwik
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
    g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
  })();
<noscript><p><img src="//metrics.open-xchange.com/piwik/piwik.php?idsite=1" style="border:0;" alt="" /></p></noscript>


// show anchor icons on hover
(function() {
    var helper = window.helper;

    function updateHash() {
        var id = this.parentNode.getAttribute('id');
        if (id) window.location.hash = id;
    }

    function updateHash () {
        this.test;
        var id = this.parentNode.getAttribute('id');
        if (id) window.location.hash = id;
    }

    var conainer = window.document.querySelector('.article'),
        elements = conainer.querySelectorAll('h1:not(.article-header), h2, h3, h4, h5');

    // for each headline tag
    Array.prototype.forEach.call(elements, function (el) {
        // add class
        helper.addClass(el, 'anchor');
        // create icon node
        var icon = document.createElement('i');
        helper.addClass(icon, 'fa');
        helper.addClass(icon, 'fa-link');
        // append icon node
        el.appendChild(icon);
        // update hash on click
        icon.addEventListener('click', updateHash);
    });

    // add bootstrap style to table
    elements = conainer.querySelectorAll('table');
    Array.prototype.forEach.call(elements, function (el) {
        helper.addClass(el, 'table');
    });

})();


```



## Appsuite properties

Now we have to extract some of the information used in this script. The script itself do not has to be added to OX Appsuite. Use the following file to adjust/add the properties:

{% highlight text linenos %}
/opt/open-xchange/etc/settings/metrics.properties
{% endhighlight %}

__base url__

You need to specify the base url that allows OX Appsuite calling the PIWIK tracking API. You can simply check if got the right url by trying to open the url followed by 'piwik.php' in the browser (example: 'https://metrics.example.com/piwik/piwik.php'). You should see some message similiar to 'Piwik is a free/libre web analytics that lets you keep control of your data.'

_generated PIWIK script_

{% highlight javascript linenos %}
//[...]
var u="//metrics.example.com/piwik/";
//[...]
{% endhighlight %}
_appsuite property_

{% highlight properties %}
io.ox/core//tracking/piwik/url=https://metrics.example.com/piwik/
{% endhighlight %}

__siteId__

With PIWIK you can separate tracking by using different contextes called 'websites'. These contextes are identified by an unique id that usually starts with 1 and increments by 1 for every newly created page. To guarantee tracked date is added to the right context you have to specify this id in the settings. In case no setting is provided the id '1' is used as default

_generated PIWIK script_

{% highlight javascript linenos %}
// [...]
_paq.push(['setSiteId', 1]);
//[...]
{% endhighlight %}

_appsuite property_

{% highlight properties linenos %}
io.ox/core//tracking/piwik/id=1
{% endhighlight %}

__enabling/disabling__

Finally you need to enable tracking in general and PIWIK in particular.

{% highlight properties linenos %}
io.ox/core//tracking/enabled=true
io.ox/core//tracking/piwik/enabled=true
{% endhighlight %}

## Continue 

Please continue with the PIWIK Installation wizard.

