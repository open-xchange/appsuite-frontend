---
title: Feedback
---

The UI can show a feedback button, so users are able to give feedback for the appsuite in general or single apps inside it.
This feedback consists of a rating and a comment field. There is also some additional meta data collected to help analyse the provided feedback:

```
operating_system
browser
browser_version,
user_agent
screen_resolution,
language
client_version
```

The feedback Dialog can also be opened via direct link, if the url parameter 'showfeedbackdialog' is set to true (add '&showfeedbackdialog=true' to url)

# Configuration

This feature is enabled if the capability 'feedback' is provided by the middleware
and can be configured using JSLobs.

```
io.ox/core//feedback/supportlink
```
stores a link to a support site

```
io.ox/core//feedback/mode
```
provided by middleware. Defines the type used when sending the feedback request. Currently 'star-rating-v1' is the only possible value.

```
io.ox/core//feedback/dialog
```
used to switch feedback dialogs. 'modules' is the default value . Should only be changed for testing purpose, since only 'modules' has proper middleware support yet. (stars/modules/nps)

```
io.ox/core//feedback/position
```
defines the position of the feedback button. Default value is 'right'. (left/right)

```
io.ox/core//feedback/show
```
defines which feedback buttons to show. Default value is 'both'. (topbar/side/both)

```
io.ox/core//feedback/showHover
```
defines if the rating should show when hovering with the mouse over it. (true/false)

```
io.ox/core//feedback/showModuleSelect
```
only applies if 'io.ox/core//feedback/dialog' is set to 'modules'. Defines if the select box for he module selection should be replaced by a static text, resembling the current app. (true/false)
