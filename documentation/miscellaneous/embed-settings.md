---
title: Embedding external settings
description: Embed your own configuration page via iFrame into the AppSuite's settings and pass our session onto your implementation.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Embedding_your_settings_into_AppSuite_settings
---

This is a replacement for "Config Jump" of OX6. Not to be confused with simply adding new settings into AppSuite

# Declare the page you want to embed

You can declare pages to embed via [Config Cascade](http://oxpedia.org/wiki/index.php?title=ConfigCascade) settings. 
There are several ways to do so, this example uses the most comfortable one, a YAML declaration:

``/opt/open-xchange/etc/settings/configjump.yml``

```yaml
io.ox/settings/configjump//changePlans:
   url: "http://localhost/~fla/changePlans.php?token=[token]"
   title: "Change Plan"
   after: "io.ox/mail"
   advancedMode: false
```

_io.ox/settings/configjump_ contains one object per embedded page (e.g. "changePlans"). 
If you want to add more pages, follow this pattern.

An object of this type has the following properties:

- __url__: The URL to be branched to. The place holder [token] will be replaced by the token you get from the token login system
- __title__: The title as to be seen on the settings page.
- __after__, __before__ or __index__: Where the page is supposed to be positioned. _Hint_: If you want to name a page as reference (as opposed to using the index), you need to figure out the name. One way to do so is go to that page in the settings and check for the id parameter in the URL.
- __advancedMode__: true or false to define if shown in advanced settings mode or not. Default is false

It's also possible to provide custom translations for the title. Just add "title_" plus the locale:


```yaml
io.ox/settings/configjump//changePlans:
   url: "http://localhost/~fla/changePlans.php?token=[token]"
   title: "Change Plan"
   title_en_US: "Change plan"
   title_de_DE: "Plan ändern"
   title_fr_FR: "..."
   ...
   after: "io.ox/mail"
```

# Create a secret

Now you just need to declare the app your are about to embed in the backend and you are good to go:


```bash
cat /opt/open-xchange/etc/tokenlogin-secrets
```


```yaml
#
# Listing of known Web Application secrets followed by an optional semicolon-separated parameter list
#
# e.g. 1254654698621354; accessPasword=true
#

# Dummy entry
# 1234-56789-98765-4321; accessPassword=true
12345-phpapp-54321
```

This secret, combined with the token, can be traded for a login.

# Redeem a token

```
GET /login?action=redeemToken
```

- __token__: The token you want to trade.
- __secret__: A valid secret for your app.

This request can be sent by the embedded app to the AppSuite backend to get authorisation info.
