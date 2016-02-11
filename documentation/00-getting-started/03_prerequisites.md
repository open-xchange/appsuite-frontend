---
title: Prerequisites
description: This article explains the languages and frameworks used within the AppSuite frontend
---

# Getting started

This technical documentaiton will get you started to develop your own plugins and apps for OX app suite. 
We will look at the steps necessary but will also tempt you to learn more by linking you to some more in-depth documentation about these topics. 
Depending on how you wound up reading this page, you will probably have already completed some of the steps below.

# Prerequisites

Before we begin, here are a few things that you need to have set up before going on - an OX Backend. 
We will not cover how to set up one of these. 
Either have it running locally on your development machine, if you are also developing backend functionality, or install an OX server on another machine as a normal set up. 
Either one is fine. - To follow this guide, on your development machine you will need git, node (0.4 or later) and a text editor, for the actual development.

# Check out the source

Firstly you will need to check out our source code. 
This also includes the most up to date version of this documentation. The source code for the frontend is hosted at [code.open-xchange.com/wd/frontend/web](code.open-xchange.com/wd/frontend/web). 

Since we're living on the edge here, we will use the branch where the actual development is going on, called _develop_. 
Depending on your needs and taste, the stable master branch might also be a good choice. 
In a shell navigate to where you want to work on the app suite and type:


```bash
git clone -b develop https://code.open-xchange.com/git/wd/frontend/web
```

and wait for the checkout to complete. 
This will create the directory web with the source code of the frontend in it. Building the ui and documentation

# Build
Please refer to the build process article [here](/ui/build-process/076_appserve.html)
