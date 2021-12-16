---
title: UI
---
# Contents
Please choose your desired topic from the navigation on the left. You will find some information about App Suite UI config, some development articles as well as information about Data Protection or Accessibility in App Suite UI.

# Developing for App Suite UI
If you are looking for information about extending or modifying the App Suite UI source code, find some additional information here.

## How to get the App Suite UI code

Get the UI sourcecode from our GitLab repository here [https://gitlab.open-xchange.com/frontend/core](https://gitlab.open-xchange.com/frontend/core)

## Using extension points

Writing apps or plugins for App Suite will mostly be extending the user interface. App Suite provides extension points for you to add your own content.
Further reading: [Hands-on introdcution](extension-points/01-introduction)

## What can I build?

There are many options available for App Suite developers. For example:

- [A portal plugin](customize/portal-widget) is a widget, which can only be used in the 'portal'-section of App Suite. Please just check for the right [extension point](extension-points.html) when writing a plugin which extends and interacts with other parts of App Suite. Configuring portal plugins is described in [this guide](https://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins).

- [A real application/module](customize/app/simple-application) for App Suite apps which should be displayed full screen.

- [A wizard](customize/welcome-wizard) which can be used to show first time users important information or help with the initial configuration of settings for 3rd party applications.
