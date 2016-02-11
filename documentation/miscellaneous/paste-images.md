---
title: Paste images
description: Pasting images is basically supported by any major browser. But there are several difficulties to provide a cross-browser solution. 
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Paste_inline_images
---

# Paste images

If speaking about pasting images, it is important to consider the source where the image was copied. 
Basically, copying images from an application is possible (for details see Section Applications). 
It seems like these applications are simply storing the image data in the clipboard which can be accessed by the paste events of the browser.

Pasting images from a folder of the operating system does not work on any tested environment. 
Whereas OS X does provide the filename and a dummy picture, the clipboard of all browsers on Windows Systems remains empty.

# Support

The following table lists all major browsers and their ability to insert pasted images from applications.

| browser | paste support (tested version) | specifics |
|-------------------|--------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Chrome | 43.0.2357.81 |  |
| Safari | <span style="color:red">no support in 8.0.6 </span>| Does not provide images in clipboardData. After pasting, the browser inserts an img-tag with webkit-fake-url. There is no pure javascript solution to retrieve the image data for upload. |
| Firefox | 38.0.1 | Does not provide images in clipboardData. After pasting, the browser inserts an img-tag with base64 encoded src. |
| Internet Explorer | 11.0.9600.16428 | IE 10 does not support image pasting. |

# Applications

This table lists some applications which were tested as copy sources for images.
Mainly, OS related applications does are not supported as copy source whereas image viewing/editing related applications are supported.

| application | paste support | operating system |
|----------------------|---------------|------------------|
| Finder | no | OS X |
| Preview | yes | OS X |
| Fotos | yes | OS X |
| Chrome | yes  | OS X and Windows |
| Internet Explorer | yes  | Windows |
| Windows Explorer | no | Windows |
| Windows Photo Viewer | no | Windows |
| Paint | yes | Windows |
| GimP | yes | OS X and Windows |
