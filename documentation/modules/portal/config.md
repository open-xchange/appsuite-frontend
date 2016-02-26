---
title: Configuring
description: How to configure which plugins ('widgets') are shown, whether they are mandatory or just suggested to the user
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins
---

This article covers how to configure which plugins ("tiles") are shown, whether they are mandatory or just suggested to the user


# Configuring the portal


When running OX AppSuite you may want to specify a starting configuration for which tiles the portal shows and whether certain tiles are mandatory or not. This is especially useful when you are introducing your own tile implementations. 
To make this possible, the portal consists of three types of tiles: User tiles, eager tiles and protected tiles. 
User tiles are tiles that the user added herself to the portal page, eager tiles are those suggested by the installation which can be removed and protected tiles are set by the backend.

In order to specify a tile, you will have to know about the configuration data to enter. 
You can use an appsuite installation to do that. 
If you want to configure a tile as eager or protected, navigate to the settings area of the portal page, add the tile you want and, in the JS console, enter:


```javascript
require("settings!io.ox/portal").get("widgets/user")
```

and in the list find the tile you want to suggest to or force on your users. As an example, we'll use the birthday widget:


```yaml
birthdays_0: Object
   color: "lightgreen"
   enabled: true
   id: "birthdays_0"
   index: 6
   inverse: false
   plugin: "plugins/portal/birthdays/register"
   props: Object
   type: "birthdays"
```

In order to configure widgets on the backend we have o turn the above into a valid YAML structure:

```yaml
birthdays_0:
   color: "lightgreen" # one of black, red, orange, lightgreen, 
                       # green, lightblue, blue, purple, pink, gray
   enabled: true       # Has to be true 
   index: "first"      # Where the widget is supposed to show up. 
                       # Possible values are numbers, "first" or 
                       # "last" 
   inverse: false      # If true, the color is applied to the body 
                       # of the tile and not the title. Can highlight 
                       # particular tiles
   plugin: "plugins/portal/birthdays/register" # The source file that contains the tile code
   type: "birthdays"   # The id of the widget type. Not the id above 
                       # has to have the form [type]_[someNumber]
```

Now we can use this snippet to configure the birthday widget in a variety of ways

# I want to suggest a widget, but the user can remove it, if they don't like it

For this, you can use the "eager" configuration method. Not that if you specify an eager or protected widget, all default widgets from Open-Xchange will not be configured as defaults anymore, so you might want to configure them as eager tiles as well. But let's stick to the birthday widget for now.

- Add a file /opt/open-xchange/etc/settings/portal.yml

```yaml
io.ox/portal//widgets/eager/gen_0:
   birthdays_0:
       color: "lightgreen"
       enabled: true
       index: "first"
       inverse: false
       plugin: "plugins/portal/birthdays/register"
       type: "birthdays"
```

This means the widget will be enabled for users, but users can still disable it. If you want to, at a later time and since you've made significant improvements to the tile, want to show it to the user again, you have to increase the "generation" of the widget configuration and offer it again:


```yaml
io.ox/portal/:
   generation: 1
```


```yaml
io.ox/portal//widgets/eager/gen_0:
   birthdays_0:
       color: "lightgreen"
       enabled: true
       index: "first"
       inverse: false
       plugin: "plugins/portal/birthdays/register"
       type: "birthdays"
```


```yaml
io.ox/portal//widgets/eager/gen_1:
   birthdays_0:
       color: "lightgreen"
       enabled: true
       index: "first"
       inverse: false
       plugin: "plugins/portal/birthdays/register"
       type: "birthdays"
```

All the "gen_[number]" entries up the tie io.ox/portal//generation will be used for this configuration. 
If a tile is deleted it is deleted only in that generation so can be reintroduced in a later portal configuration generation. 
If you want to keep the default tiles as used as a fallback for App Suite, you need this configuration to start out with:


```yaml
io.ox/portal//widgets/eager/gen_0:
   mail_0: 
       plugin: 'plugins/portal/mail/register'
       color: 'blue'
       enabled: true
       index: 1
   calendar_0: 
       plugin: 'plugins/portal/calendar/register'
       color: 'red'
       enabled: true
       index: 2
   tasks_0: 
       plugin: 'plugins/portal/tasks/register'
       color: 'green'
       enabled: true
       index: 3
   birthdays_0:
       plugin: 'plugins/portal/birthdays/register'
       color: 'lightgreen'
       enabled: true
       index: 4
   twitter_0:
       plugin: 'plugins/portal/twitter/register'
       color: 'pink'
       enabled: true
       index: 5
   linkedin_0:
       plugin: 'plugins/portal/linkedin/register'
       color: 'lightblue'
       enabled: true
       index: 6
```

And then modify this as wanted for your deployment

# Forcing a tile

Similarly to the eager tiles, tiles can be "protected", i.e. they can not be moved, removed and disabled. 
The configuration for this looks like that:


```yaml
io.ox/portal//widgets/protected:
   birthdays_0:
       color: "lightgreen"
       enabled: true
       index: "first"
       inverse: false
       plugin: "plugins/portal/birthdays/register"
       type: "birthdays"
```

If you want to allow movement of the widget, you can enable this in the following way:

```yaml
io.ox/portal//widgets/protected:
   birthdays_0:
       color: "lightgreen"
       enabled: true
       index: "first"
       inverse: false
       plugin: "plugins/portal/birthdays/register"
       type: "birthdays"
       changeable:
           index: true
```

In which case, users will be allowed to move the tile.

One caveat in all this: After changing any of the above configuration, you will have to reload the UI *_twice_*, 
since App Suite uses read-through caching for the settings data.


# Disabling a tile completely

The combination of making a tile both protected and disabling it makes it impossible for the user to enable it. 
From 7.6.0 on, this means it is not shown in the settings either. Before that, it was greyed out but still present.


```yaml
io.ox/portal/:
   widgets:
     protected:
       quota_0:
         color: "red"
         id: "quota_0"
         enabled: false
         index: 1
         inverse: false
         plugin: "plugins/portal/quota/register"
         type: "quota"
```



