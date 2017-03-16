---
title: Mobile device classification
description:
source: http://oxpedia.org/wiki/index.php?title=AppSuite:UI_smartphone_device_classification
---

# Introduction

For Appsuite UI development, it is important to determine whether the code is running on a mobile device or not. Furthermore, a solid distinction between smartphones and tablets is important. Since the development of 7 inch tablets, the device detection is more complicated. Therefore, we use a list of the 125 most used devices to verify our classification procedure.

# Detection criteria

A device is classified as a smartphone, if

- it has the correct size (smallest dimension <= 540),
- touch input and
- a mobile OS (iOS or Android)

## Device size

In a mobile browser, we have access to the css pixels of the screen in the variables screen.width and screen.height. It turned out, that 99% of smartphones can be distinguished from tablets because one dimension of a smartphone has less than 540 pixels.

We figured out that in the android stock browser these variables contain the actual physical pixels of the device. Therefore, the window.devicePixelRatio is used as divider for the screen dimensions.

## Touch and Mobile OS

To ensure, that a browser on a desktop pc which is scaled to a small size is not detected as a smartphone, we check if the device has touch input and is running a mobile operating system like android, ios, blackberry or windows phone. Furthermore, there are some small desktop screens with touch input which can only be detected using its operating system and/or if it uses touch input.

## Custom Detection

There are two devices in our list which are not detected correctly. At first, the Kindle Fire HD 7 inch. But Kindle is not supported by the Appsuite. Thus, it can be neglected. The second device is the Motorola Droid Razr HD. This device has a resolution of 1280 * 720 and a css pixel ratio of 1. That is why the size test will fail and we detect this device as a special case.

# Device list

The following list shows all devices, we used to verify our classification. In this list the device width and height is in CSS pixels.

| Brand | Device | CSS Pixel Ratio | Device Width | Device Height | Smartphone or other | Detection | Match | Comment |
|------------|------------------------------------|-----------------|--------------|---------------|---------------------|------------|-------|----------------------|
| ASUS | Nexus 7 (2013 version) | 2 | 960 | 600 | other | other | true |  |
| ASUS | Nexus 7 (2012 version) | 1.325 | 966 | 604 | other | other | true |  |
| ASUS | MeMO Pad FHD 10 | 1.5 | 1280 | 800 | other | other | true |  |
| Amazon | Kindle Fire HD 8.9" | 1.5 | 1280 | 800 | other | other | true |  |
| Amazon | Kindle Fire HDX 7" | 2 | 960 | 600 | other | other | true |  |
| Amazon | Kindle Fire | 1 | 1024 | 600 | other | other | true |  |
| Amazon | Kindle Fire HD 7" | 1.5 | 853 | 533 | other | smartphone | false | Not supported |
| Amazon | Kindle Fire HDX 8.9" | 2 | 1280 | 800 | other | other | true |  |
| Apple | iPhone 6 | 2 | 667 | 375 | smartphone | smartphone | true |  |
| Apple | iPod Touch 4 | 2 | 480 | 320 | smartphone | smartphone | true |  |
| Apple | iPad Air | 2 | 1024 | 768 | other | other | true |  |
| Apple | MacBook Pro 15-inch Retina display | 2 | 1440 | 900 | other | other | true |  |
| Apple | iPhone 4 | 2 | 480 | 320 | smartphone | smartphone | true |  |
| Apple | iPhone 4S | 2 | 480 | 320 | smartphone | smartphone | true |  |
| Apple | iPad 2 | 1 | 1024 | 768 | other | other | true |  |
| Apple | iPhone 5C | 2 | 568 | 320 | smartphone | smartphone | true |  |
| Apple | iPhone 5S | 2 | 568 | 320 | smartphone | smartphone | true |  |
| Apple | iPod Touch 5 | 2 | 568 | 320 | smartphone | smartphone | true |  |
| Apple | iPhone 6 Plus | 3 | 736 | 414 | smartphone | smartphone | true |  |
| Apple | iPad Mini 2 | 2 | 1024 | 768 | other | other | true |  |
| Apple | MacBook Pro 13-inch Retina display | 2 | 1280 | 800 | other | other | true |  |
| Apple | iPhone 3GS | 1 | 480 | 320 | smartphone | smartphone | true |  |
| Apple | iPad 4 | 2 | 1024 | 768 | other | other | true |  |
| Apple | iPad 3 | 2 | 1024 | 768 | other | other | true |  |
| Apple | iPhone 5 | 2 | 568 | 320 | smartphone | smartphone | true |  |
| Apple | iPad 1 | 1 | 1024 | 768 | other | other | true |  |
| Apple | iPad Mini | 1 | 1024 | 768 | other | other | true |  |
| Blackberry | BlackBerry Bold 9900 | 1 | 640 | 480 | smartphone | smartphone | true |  |
| Blackberry | BlackBerry PlayBook | 1 | 1024 | 600 | other | other | true |  |
| Blackberry | BlackBerry Z10 | 2 | 640 | 384 | smartphone | smartphone | true |  |
| Blackberry | BlackBerry Z30 | 2 | 640 | 360 | smartphone | smartphone | true |  |
| Google | Nexus 7 | 1325 | 966 | 604 | other | other | true |  |
| Google | Nexus 7 2 | 2 | 960 | 600 | other | other | true |  |
| Google | Nexus 10 | 2 | 1280 | 800 | other | other | true |  |
| Google | Nexus 4 | 2 | 640 | 384 | smartphone | smartphone | true |  |
| Google | Nexus 5 | 3 | 640 | 360 | smartphone | smartphone | true |  |
| Google | Google Glass | 1.5 | 427 | 240 | smartphone | smartphone | true |  |
| HTC | Evo 3D | 1.5 | 640 | 360 | smartphone | smartphone | true |  |
| HTC | Thunderbolt | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| HTC | One X | 2 | 640 | 360 | smartphone | smartphone | true |  |
| HTC | HD2 | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| HTC | Sensation XE | 1.5 | 640 | 360 | smartphone | smartphone | true |  |
| HTC | Nexus One | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| HTC | Touch HD | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| HTC | One SV | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| HTC | Evo | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| HTC | EVO LTE | 2 | 640 | 360 | smartphone | smartphone | true |  |
| HTC | Desire HD | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| HTC | J Butterfly | 3 | 640 | 360 | smartphone | smartphone | true |  |
| HTC | Sensation | 1.5 | 640 | 360 | smartphone | smartphone | true |  |
| HTC | One | 3 | 640 | 360 | smartphone | smartphone | true |  |
| Kobo | Arc 7HD | 2 | 960 | 600 | other | other | true |  |
| LG | LG Optimus Black | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| LG | LG Optimus 2X | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| LG | LG Optimus 3D | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| LG | LG Optimus 4X HD | 1.7 | 753 | 424 | smartphone | smartphone | true |  |
| LG | LG G3 | 3 | 853 | 480 | smartphone | smartphone | true |  |
| LG | LG Nexus 4 | 2 | 640 | 384 | smartphone | smartphone | true |  |
| LG | LG Nexus 5 | 3 | 640 | 360 | smartphone | smartphone | true |  |
| LG | LG Optimus One | 1.5 | 320 | 213 | smartphone | smartphone | true |  |
| LG | LG Optimus G | 2 | 640 | 384 | smartphone | smartphone | true |  |
| LG | LG Optimus G Pro | 3 | 640 | 360 | smartphone | smartphone | true |  |
| LG | LG Optimus LTE | 1.7 | 753 | 424 | smartphone | smartphone | true |  |
| LG | LG Spectrum (VS920) | 1.7 | 753 | 424 | smartphone | smartphone | true |  |
| LG | LU1400 | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| LG | LG G2 | 3 | 640 | 360 | smartphone | smartphone | true |  |
| Microsoft | Surface | 1 | 1366 | 768 | other | other | true |  |
| Microsoft | Surface Pro 3 | 1.5 | 1440 | 960 | other | other | true |  |
| Microsoft | Surface Pro 2 | 1.5 | 1280 | 720 | other | other | true |  |
| Microsoft | Surface Pro | 1.5 | 1280 | 720 | other | other | true |  |
| Microsoft | Surface 2 | 1.5 | 1280 | 720 | other | other | true |  |
| Motorola | Xyboard | 1 | 1280 | 800 | other | other | true |  |
| Motorola | Moto G | 2 | 640 | 360 | smartphone | smartphone | true |  |
| Motorola | Droid X | 1.5 | 569 | 320 | smartphone | smartphone | true |  |
| Motorola | Droid | 1.5 | 569 | 320 | smartphone | smartphone | true |  |
| Motorola | Moto E | 2 | 480 | 270 | smartphone | smartphone | true |  |
| Motorola | Droid 4 | 1 | 960 | 540 | smartphone | smartphone | true |  |
| Motorola | Xoom | 1 | 1280 | 800 | other | other | true |  |
| Motorola | Droid Razr HD | 1 | 1280 | 720 | smartphone | other | false | Gets extra detection |
| Motorola | Defy | 1.5 | 569 | 320 | smartphone | smartphone | true |  |
| Motorola | Driod Razor M | 2 | 480 | 270 | smartphone | smartphone | true |  |
| Motorola | Atrix 4G | 1 | 960 | 540 | smartphone | smartphone | true |  |
| Motorola | Droid 3 | 1 | 960 | 540 | smartphone | smartphone | true |  |
| Motorola | Atrix 2 | 1 | 960 | 540 | smartphone | smartphone | true |  |
| Motorola | Droid Razr | 1 | 960 | 540 | smartphone | smartphone | true |  |
| Motorola | Milestone | 1.5 | 569 | 320 | smartphone | smartphone | true |  |
| Nokia | N810 | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | N800 | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | Lumia 900 | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | Lumia 920 | 2.4 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | Lumia 925 | 2.4 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | C7 | 1 | 640 | 360 | smartphone | smartphone | true |  |
| Nokia | Lumia 1020 | 2.4 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | Lumia 7X0 | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | Lumia 8XX | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | N900 | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | N97 | 1 | 640 | 360 | smartphone | smartphone | true |  |
| Nokia | X7 | 1 | 640 | 360 | smartphone | smartphone | true |  |
| Nokia | C6 | 1 | 640 | 360 | smartphone | smartphone | true |  |
| Nokia | C5 | 1 | 640 | 360 | smartphone | smartphone | true |  |
| Nokia | Lumia 928 | 2.4 | 533 | 320 | smartphone | smartphone | true |  |
| Nokia | N8 | 1 | 640 | 360 | smartphone | smartphone | true |  |
| Samsung | Epic (D700) | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Samsung | Galaxy Ace | 1 | 480 | 320 | smartphone | smartphone | true |  |
| Samsung | Galaxy Mega 6.3 | 1.8 | 711 | 400 | smartphone | smartphone | true |  |
| Samsung | Galaxy Nexus | 2 | 640 | 360 | smartphone | smartphone | true |  |
| Samsung | Galaxy Note | 2 | 640 | 400 | smartphone | smartphone | true |  |
| Samsung | Galaxy Note 3 | 3 | 640 | 360 | smartphone | smartphone | true |  |
| Samsung | Galaxy Note II | 2 | 640 | 360 | smartphone | smartphone | true |  |
| Samsung | Galaxy Note Pro 12.1 | 2 | 1280 | 800 | other | other | true |  |
| Samsung | Galaxy S | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Samsung | Galaxy S4 | 3 | 640 | 360 | smartphone | smartphone | true |  |
| Samsung | Galaxy S II | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Samsung | Galaxy S III | 2 | 640 | 360 | smartphone | smartphone | true |  |
| Samsung | Galaxy S Plus | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Samsung | Galaxy Tab 10.1 | 1 | 1280 | 800 | other | other | true |  |
| Samsung | Galaxy Tab 7.7 | 1 | 1280 | 800 | other | other | true |  |
| Samsung | Galaxy Tab 8.9 | 1 | 1280 | 800 | other | other | true |  |
| Samsung | Galaxy Tab Pro 10.1 | 2 | 1280 | 800 | other | other | true |  |
| Samsung | Galaxy Tab Pro 8.4 | 2 | 1280 | 800 | other | other | true |  |
| Samsung | Galaxy W | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Samsung | Nexus 10 | 2 | 1280 | 800 | other | other | true |  |
| Samsung | Nexus S LCD | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Samsung | Nexus S SAMOLED | 1.5 | 533 | 320 | smartphone | smartphone | true |  |
| Sony | Xperia Ion | 2 | 640 | 360 | smartphone | smartphone | true |  |
| Sony | Xperia P | 2 | 480 | 270 | smartphone | smartphone | true |  |
| Sony | Xperia S | 2 | 640 | 360 | smartphone | smartphone | true |  |
| Sony | Xperia Sola | 1 | 854 | 480 | smartphone | smartphone | true |  |
| Sony | Xperia U | 1 | 854 | 480 | smartphone | smartphone | true |  |
| Sony | Xperia Z | 3 | 640 | 360 | smartphone | smartphone | true |  |
| Sony | Xperia Z1 | 3 | 640 | 360 | smartphone | smartphone | true |  |
| Tesco | Hudl | 1.5 | 933 | 600 | other | other | true |  |
| Xiaomi | Mi2 | 3 | 427 | 240 | smartphone | smartphone | true |  |
| Xiaomi | Mi3 | 4 | 480 | 270 | smartphone | smartphone | true |  |
