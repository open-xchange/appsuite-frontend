---
title: Baton
description: 
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Extending_the_UI
---

Part of extension points system is a structure called baton which serves as an context object. 
The baton passed back through callbacks within programmatic flow allowing data exchange between extension points.

# attributes

- data: usually contains current entity object, also used for data exchange
- options: contains data such as the current active application if a baton is used comprehensively
- flow: 
    - disabled: stores disabled extensions (managed via baton.disable(pointId, extensionId))
- $: used to reference a jQuery node object


# disable extensions

```javascript
 //disable
 baton.disable(pointid, extensionid);

 //is disabled
 var isDisabled = baton.isDisabled(pointid, extensionid);
```


__example__

```javascript
 var pointid = 'io.ox/mail/detail',
     extensionid = 'example3',
     node = $('div'),
     baton = ext.Baton();

//disable extension
//returns undefined
baton.disable(pointid,extensionid);

//invoke extension with baton instance 
ext.point(pointid).invoke('draw', node, baton)
```


# data exchange

__example__

```javascript
 //extension using baton to store data
 {
     id: 'example1',
     index: 100,
     draw: function (baton) {
         //get the currenty process mail object
         var mail = baton.data;
         //append subject to current node referenced as this
         this.append(
             $('div').text(mail.subject);
         )
         //extend mail object to store some flag
         mail.drawn = mail.drawn || {};
         mail.drawn.subject = true;
         //disable extension3
         baton.disable()
     }
 };
 {
     id: 'example2',
     index: 200,
     draw: function (baton) {
         //get the currenty process mail object
         var mail = baton.data;
         //use value set by 'example1'
         if(mail && mail.drawn && mail.drawn.subject) {
             //do something
         }
     }
 };
 {
     id: 'example3',
     index: 300,
     draw: function (baton) {
         //wil not be executed if baton from 'disable example' is used
     }
 };
```

# ensure

- ensure that submitted object is instanceof baton
- return obj if it's an instanceof baton
- return new baton instance where baton.data is extended by obj or obj.data (if exists)

```javascript
var baton = ext.Baton.ensure(obj) 
```

__example__

```javascript
 //new baton.data extended by object
 var baton = ext.Baton.ensure({ id: 2 })
```

![](04_baton.png)


