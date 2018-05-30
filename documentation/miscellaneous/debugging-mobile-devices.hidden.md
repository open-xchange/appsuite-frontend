---
title: Debugging mobile devices
description: A how-to for debugging App Suite on mobile devices
source: http://oxpedia.org/wiki/index.php?title=AppSuite:UI_remote_debugging_android_mac
---

# Android on Mac

## Prerequisites

You need the latest X-Code and a working setup of the latest Homebrew. Check with `brew doctor`.

## Setup

```bash
brew install android-sdk
```

Add this to your shells rc (e.g. .bashrc or .zshrc)

```bash
export ANDROID_HOME=/usr/local/opt/android-sdk
```

Launch the “Android SDK Manager”.

```bash
android
```

Check `Android SDK Platform-tools` and `Android Support Library` uncheck everything else, except if you plan on using other components of the SDK.

Add this to your shells rc (e.g. .bashrc or .zshrc) for convenience:

```bash
alias chrome-android="adb forward tcp:9222 localabstract:chrome_devtools_remote"
```

## Usage

- Connect an Android Device via USB.
- Open a terminal and enter “chrome-android”.
- Open Chrome on your device.
- Visit `localhost:9222` on your desktop machine for remote debugging.

## Chrome Plugin

A simpler way to perform remote debugging directly with Chrome is to install the “ADB Plugin”.
It's a Chrome Plugin/App and can be installed from the Chrome Webstore.
All you need is a running Android SDK, nothing else.
The ADB Plugin adds a icon to the Chrome toolbar which shows all inspectable targets on connected devices/emulators.
