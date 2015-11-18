---
title: Capabilities
description: How to use capabilities so that your new AppSuite plugin can be enabled or disabled.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Capabilities
---

## What are capabilities?

__Usecase__

You write a new UI app or plugin (chat module, for example) and in addition, you want to make sure that only a specific set of users or contexts within the system are allowed to use it. 

_Example:_ 

Your chat app should only be available after a user has bought it in your online shop. To do so, you will need to implement the capabilities logic within your UI app or plugin and restrict it to a user or context marked accordingly (called "premium" in further examples).

## Set a capability

First, disable it for everyone as default (or enable it for everyone, depending on what your aim is). 

In <tt>/opt/open-xchange/etc/[myproduct].properties</tt>:
{% highlight javascript linenos %}
  com.openexchange.capability.[myproduct]=false # off for everyone
{% endhighlight %}

Then restart the OX Application Server and afterwards use the general OX AppSuite commandline tools to enable the capability/capabilities. 

The commandline tools used in the following examples are located in: 

{% highlight javascript linenos %}
  /opt/open-xchange/sbin
{% endhighlight %}

In this example, only for a specific user:

{% highlight javascript linenos %}
  changeuser ... --config/com.openexchange.capability.[myproduct]=true
{% endhighlight %}

...or for a full context:

{% highlight javascript linenos %}
  changecontext -c ... --config/com.openexchange.capability.[myproduct]=true
{% endhighlight %}

...or set the capability to a context set:

{% highlight javascript linenos %}
  changecontext -c ... --taxonomy/types=premium
{% endhighlight %}

To get the capability/capabilities working for context sets (like above), you also need to edit the contextSet files in:

{% highlight javascript linenos %}
  <tt>/opt/open-xchange/etc/contextSets/premium.yml</tt>
{% endhighlight %}

And add the corresponding capability/capabilities:

{% highlight javascript linenos %}
  premium:
     com.openexchange.capability.[myproduct]: true
     withTags: premium
{% endhighlight %}

Then restart the OX Application Server!

## Query capabilities via the HTTP API

{% highlight javascript linenos %}
Query:
  GET /appsuite/api/capabilities?action=all&session=991fd40f635b45...
Response:
{"data":[
    {"id":"oauth","attributes":{}},
    {"id":"webmail","attributes":{}},
    {"id":"document_preview","attributes":{}},
    {"id":"printing","attributes":{}},
    {"id":"spreadsheet","attributes":{}},
    {"id":"gab","attributes":{}},
    {"id":"multiple_mail_accounts","attributes":{}},
    {"id":"publication","attributes":{}},
    {"id":"rss_bookmarks","attributes":{}},
    {"id":"linkedin","attributes":{}},
    {"id":"filestore","attributes":{}},
    {"id":"ical","attributes":{}},
    {"id":"rt","attributes":{}},
    {"id":"olox20","attributes":{}},
    {"id":"forum","attributes":{}},
    {"id":"active_sync","attributes":{}},
    {"id":"conflict_handling","attributes":{}},
    {"id":"rss_portal","attributes":{}},
    {"id":"oxupdater","attributes":{}},
    {"id":"infostore","attributes":{}},
    {"id":"contacts","attributes":{}},
    {"id":"collect_email_addresses","attributes":{}},
    {"id":"drive","attributes":{}},
    {"id":"rss","attributes":{}},
    {"id":"pinboard_write_access","attributes":{}},
    {"id":"mobility","attributes":{}},
    {"id":"calendar","attributes":{}},
    {"id":"participants_dialog","attributes":{}},
    {"id":"edit_public_folders","attributes":{}},
    {"id":"text","attributes":{}},
    {"id":"groupware","attributes":{}},
    {"id":"msisdn","attributes":{}},
    {"id":"carddav","attributes":{}},
    {"id":"tasks","attributes":{}},
    {"id":"portal","attributes":{}},
    {"id":"mailfilter","attributes":{}},
    {"id":"read_create_shared_folders","attributes":{}},
    {"id":"vcard","attributes":{}},
    {"id":"pim","attributes":{}},
    {"id":"caldav","attributes":{}},
    {"id":"projects","attributes":{}},
    {"id":"usm","attributes":{}},
    {"id":"webdav","attributes":{}},
    {"id":"dev","attributes":{}},
    {"id":"delegate_tasks","attributes":{}},
    {"id":"freebusy","attributes":{}},
    {"id":"subscription","attributes":{}},
    {"id":"linkedinPlus","attributes":{}},
    {"id":"autologin","attributes":{}},
    {"id":"webdav_xml","attributes":{}},
    {"id":"twitter","attributes":{}}
]}

ABOUT
{% endhighlight %}

Here <tt>id</tt> is the name of the capability.

## Query capabilities in the UI

{% highlight javascript linenos %}
  require(['io.ox/core/capabilities'], function (cap) { if cap.has('[myproduct]' { ... } );
{% endhighlight %}

## Require the capabilities in your UI manifest file

{% highlight javascript linenos %}
{
    namespace: ...
    requires: '[myproduct]'
}
{% endhighlight %}

Now your plugin will only be loaded if the capability '[myproduct]' is set for a specific user, context, context set.

## Testing the capabilities

* For testing purposes use an URL parameter to test capabilities. 

Add the following parameter to your AppSuite URL in the browser to activate:

{% highlight javascript linenos %}
  &cap=[myproduct]
{% endhighlight %}

or use 

{% highlight javascript linenos %}
  &disableFeature=[myproduct]
{% endhighlight %}

to disable a certain capability. 

In general, after adding those URL parameters, you need to reload the UI to temporarly test/enable the set capability.

## Further informations
* See the dedicated wiki page of the [[ConfigCascade]] mechanism for more details.
* If you want to know about existing capabilities and the way they are used for upsell, see [[AppSuite:Upsell#Capabilities_and_Upsell_triggers]]
