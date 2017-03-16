---
title: UI
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Developing_for_the_UI
---

This section contains articles about the inner workings of the web-based graphical user interface (_ui_ and _front end_ is used synonymously).
It is aimed at software developers that want to improve on existing features, implement extensions or just gain a general understanding.

In case you just don't where to start take a look at the [getting started articles](00-getting-started.html).

# Tech Overview

All technologies and frameworks used for developing a new component for the App Suite UI are listed and described in the following article: [Requirements to develop for the UI](00-getting-started/01-skills-needed.html).

# Development Guidelines

While developing code for OX products [the UI Development Style Guide](00-getting-started/02-styleguide) helps you write safe, clear and functional code.

Always keep in mind that using OX products should be possible for everyone. Therefor it's important to follow simple rules regarding [accessibility](accessibility.html).

# Using extension points

Writing apps or plugins for App Suite will often include extending the existing user interface. App Suite provides extension points for you to add your own content.
Beginning to develop using extension points? Read this guide first: [a hands-on introduction](extension-points/01-introduction) for extending the OX user interface.

# How to get code

Using git as a version control system and getting the code for existing OX products is quite easy.
Simply clone the [UI](https://gitlab.open-xchange.com/frontend/core) repository and start working with it.
If you would like to develop for the server/backend (using the OSGI Framework) plugins, you should check out the [middleware]({{ site.baseurl }}/middleware).

### What can I build?

If you want a simple introduction with easy to follow steps - from creating your workspace to actually integrating your source code within App Suite - please read our [GettingStarted guide].

There are many options available for App Suite developers. For example:

- [A portal plugin](customize/portal-widget) is a widget, which can only be used in the 'portal'-section of App Suite. Please just check for the right [extension point](extension-points.html) when writing a plugin which extends and interacts with other parts of App Suite. Configuring portal plugins is described in [this guide](https://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins).

- [A contacts plugin](customize/extension) let's you modify parts of App Suite's contact view.

- [A real application/module](customize/app/simple-application) for App Suite apps which should be displayed full screen.

- [A notification plugin](customize/notifications.html) for App Suite

- [A wizard](customize/welcome-wizard) which can be used to show first time users important information or help with the initial configuration of settings for 3rd party applications.

And if you get stuck somewhere? Then here are some hints to help you [debugging the UI](miscellaneous/debugging.html).
