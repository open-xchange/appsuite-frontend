---
title: Upsell Widget
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Using_the_Upsell_widget
---

The Upsell widget uses an existing portal widget, which you just need to configure on the backend. 
It makes use of the [config options](http://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins).

# Nomenclature and inner workings

The _widget_ is one portal _tile_. 
A _tile_ covers one topic, like "Buy more storage capacity!". One widget contains several slides, like "this is why you need more storage space", "your neighbours have more storage space than you", "Your colleagues at work have more storage space than you" and "Your significant other dreams of more storage space".
_Slides_ contain a picture or a text (or both) that advertise one topic. 
A click on the tile (independent of which slide is shown) can start an app, usually an Upsell wizard.

# YaML file

## Example layout


```yaml
io.ox/portal//widgets/protected:
  upsellads_0:
    plugin: "plugins/portal/upsellads/register"
    type: "upsellads"
    index: 0
    changeable:
      index: true
    props:
      ad: "loremgibsum"

io.ox/upsell//ads:
  loremgibsum:
    capabilities: loremgibsum-active
    startDate: 2013-01-01
    endDate: 2013-12-31
    slides:
      en_US:
        slide1:
          type: text-only
          text: nodal point -ware pen drone pre- shrine otaku. lights vehicle decay uplink concrete engine vehicle. nano- smart- face forwards office shoes beef noodles courier. computer advert wristwatch A.I. 
        slide2:
          type: text-top
          image: http://placekitten.com/1024/768
          text: plastic drugs paranoid -ware fluidity artisanal grenade. meta- RAF franchise sentient shrine nodality savant. smart- woman otaku hotdog woman rebar construct. car hacker garage crypto- dolphin industrial grade sprawl. soul-delay pen boat city computer artisanal beef noodles. nodal point table engine A.I. numinous crypto- chrome. denim market render-farm shrine spook meta- footage. claymore mine saturation point dolphin singularity meta- advert decay nano- receding into warehouse motion geodesic RAF faded apophenia. 
        slide3:
          type: text-bottom
          image: http://placekitten.com/960/720
          text: urban Kowloon assassin skyscraper systema table render-farm. cyber- free-market grenade pistol network engine futurity. youtube paranoid sprawl shoes fetishism nodal point dead. otaku katana decay narrative man tanto dead. range-rover bomb digital BASE jump silent soul-delay crypto-. post- construct apophenia silent soul-delay nodal point drugs. computer tanto receding sensory bridge neon refrigerator. claymore mine saturation point dolphin singularity meta- advert decay nano- receding into warehouse motion geodesic RAF faded apophenia. realism gang warehouse A.I. bridge film post- tank-traps sign youtube 
```

__Explanations__

The .yml file contains two sections. 
The first defines the widget itself, how it is place, that it is not removable, but can be moved around. 
This seems to be a good setup for advertisements, but variations can be found in [Configuring portal plugins](http://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins).

The second section defines the content of the widget. 
The main part are the slides, but there is also the option to make sure this ad only runs for a specific time frame.

The two parts are connected by an ID (in this case "loremgibsum"), which is in ...props.ad for the first part and is the key in the second part.

# Conventions

- if the user's language cannot be matched, the first language given is used. In most cases, it is prudent to make that some English variant.
- Slides are named "slide1", "slide2" and so on. This is due to the OX parser not being able to deal with YaML lists, not working with integers as keys and due to JavaScript doing some weird sorting of keys in an object.
- Start and end date are interpreted in the user's time zone.
- remember that you will have to provide the translations. You won't be able to get the translators of the main product to do it for you.

