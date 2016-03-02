---
title: Folders
description: folder tree and folder list
icon: 
---

# Special configuration settings

Please refer to the [settings article](TODO) how to configure this server-side.

**io.ox/core//folder/blacklist/[id]**

_values: true/false_

This server-side setting allows hiding of any folder in the ui.

**Avoid white-space between the folder id and equal sign!**

```bash
# example: hide global address book
io.ox/core//folder/blacklist/6=true
```
