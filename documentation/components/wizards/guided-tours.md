---
title: Guided tours 
description: Guided tours are series of little steps meant to explain the various functions of OX to an end user. 
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Guided_tours
---

# Basic framework

Guided tours are built on [LinkedIn's hopscotch.js framework](https://github.com/linkedin/hopscotch). 
It forms a series of small information "bubbles" that point to UI elements and display a text as well as small navigation elements.

## Package

Guided tours are contained in a separate package, named open-xchange-guidedtours. 
This will install UI as well as backend components (in the form of a config file).

## Configuration

Several configuration parameters guide the running of Guided Tours:


| ID | Description |
|-----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| io.ox/tours//server/disableTours | Disabled the tours completely|
| io.ox/tours//server/disable/$moduleName | Disables the tour for a specific module, e.g. "io.ox/tasks" |
| io.ox/tours//server/startOnFirstLogin | start the tour the first time a user logs in |
| io.ox/tours//server/version | arbitrary integer denoting the version of the tour. If startOnFirstLogin is true, the user might have seen a previous version but not the recent one. Increasing the number makes sure the users sees the updated version again. |

## Customizing

Tours use [extension points](http://oxpedia.org/wiki/index.php?title=AppSuite:Extension_points) as mechanism to extend them. 
The relevant point is _io.ox/tours/extensions_.

# Example tour

A tours looks like this:


```javascript
ext.point('io.ox/tours/extensions').extend({
   id: 'default/io.ox/intro',
   app: 'io.ox/intro',
   priority: 1,
   tour: {
     id: 'Switching from OX6',
     steps: [
         {
           title: gt('Launching an app'),
           placement: 'bottom',
           target: function () { return $('.launcher[data-app-name="io.ox/mail"]')[0]; },
           content: gt('To launch an app, click on an entry on the top-left side of the menu bar.')
         },
         {
           onShow: function () { notifications.hideList(); },
           title: gt('Displaying the help or the settings'),
           placement: 'left',
           target: function () { return $('.launcher .icon-cog:visible')[0]; },
           content: gt('To display the help or the settings, use the icons on the right side of the menu bar.'),
           arrowOffset: 1,
           yOffset: -5
         },
         {
           onShow: function () { notifications.showList(); },
           title: gt('New objects icon'),
           placement: 'left',
           target: function () { return $('#io-ox-notifications-icon:visible')[0]; },
           content: gt('The New objects icon shows the number of unread E-Mails or other notifications. If clicking the icon, the info area opens.'),
           arrowOffset: -1
         }
         //[...]
    ]
  }
});
```

# Components of a tour

A tours is a set of steps that are can be navigated by going forward and backwards. It needs...

| Attribute | Description |
|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| id | This needs to be unique, like for all extension points. Even if you want to overwrite another tour, you need a different id! |
| app | The application this tour is related to. |
| Priority | The tour with the largest number for the priority for a specific app is the one shown. This is how you overwrite an existing tour with your custom one. |
| tour | The steps of a tour |

# Tour steps

A tour step is a text bubble that is shown next to a UI element. It needs...

| Property | Description |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| title | This needs to be unique, like for all extension points. Even if you want to overwrite another tour, you need a different id! |
| target | The UI element this text bubble is displayed next to. Hopscotch only allows identifiers as passed to JQuery, but App Suite extends this to functions. Most functions used simply return JQuery identifiers, the difference is when it is resolved: Functions are resolved later, which is helpful if your application is built by doing DOM manipulations as late as possible - App Suite is. |
| content | The content of a text bubble. Can be html, as it uses the innerHtml method of JQuery to attach itself. |
| placement | Where the text bubble is placed in relation to the UI element. Possible values are "top", "bottom", "left" and "right" |
| xOffset | Passed directly to hopscotch. Moves the box horizontally relative to its standard position. |
| yOffset | Passed directly to hopscotch. Moves the box vertically relative to its standard position. |
| arrowOffset | Passed directly to hopscotch. Moves the arrow relative to its standard position, horizontally if the bubble is placed "top" or "bottom", vertically if "left" or "right". |
| onShow | Passed directly to hopscotch. A function that is executed when the bubble is shown. |
| onShowDeferred | A workaround for onShow: This waits for the deferred to be resolved before showing the bubble. |

And that is all there is to creating a tour.






