---
title: Accessibility
icon: fa-universal-access
---

# Overview

[Web accessibility][WCAG-INTRO] aims at helping users with disabilities to access the web, i.e. perceiving and interacting with web sites or web-based applications. In order to offer everyone – with or without disabilities – the best possible user experience, we continually strive to meet the [Level AA conformance][WCAG-WAI] as defined by the [Web Content Accessibility Guidelines][WCAG-TR] 2.1.

Accessibility typically covers keyboard support, tab order, focus management, color contrast, semantic markup, WAI-ARIA support, and screen reader support.

We perform screen reader testing with the following typical setups on desktop devices: [NVDA][NVDA] with Firefox, [JAWS][Jaws] with Internet Explorer and [Voiceover][VO] with Safari (with accessibility option turned on, i.e. tab highlights each item).

Automated testing with [axe-core][AXE] is also part of e2e tests in our build pipeline.

Annual accessibility audits are conducted by [the Paciello Group][TPG] or [DEQUE][DQ].

# History

Date   | Version | Activity
-------| --------| -----------------------------------------------------------------------
Apr 13 | 7.2.0   | Introduced fundamental keyboard support
Jul 13 | 7.4.0   | Introduced fundamental screen reader support (semantic markup, ARIA tags)
Aug 13 | -       | Accessibility training (UI) with Steve Faulkner in Hamburg
Sep 13 | 7.4.0   | Added support for tabbable panes
Nov 13 | 7.4.1   | Added live regions
Nov 13 | 7.4.1   | Added support for accessible popup dialogs
Feb 14 | 7.4.2   | Added support for accessible modal dialogs
Feb 14 | 7.4.2   | Added support for landmark roles
Jun 14 | 7.6.0   | Polished ARIA markup to improve accessibility
Jun 14 | 7.6.0   | Added high contrast theme
Oct 14 | 7.6.1   | Improved keyboard support for mail compose
Jan 15 | 7.6.2   | Accessibility audit by [the Paciello Group][TPG]
Feb 15 | 7.8.0   | Started to resolve identified issues from recent audit
Feb 15 | 7.8.0   | Improved color contrast
Mar 15 | -       | Workshop/Review with accessibility expert [Marco Zehe][MZ] in Hamburg
Jun 15 | 7.8.0   | Partially rearranged DOM elements to appear in source order
Feb 16 | -       | Workshop/Review with accessibility expert [Marco Zehe][MZ] in Hamburg
May 16 | 7.8.1   | Accessibility audit by [the Paciello Group][TPG]
Jun 16 | 7.8.2   | Started to resolve identified issues from recent audit
Aug 16 | 7.8.3   | Finally fixed remaining tabindex issues
Sep 16 | 7.8.3   | Added new accessible date picker
Oct 16 | 7.8.3   | Resolving remaining issues from recent audit
Dec 16 | 7.8.3   | Retest accessibility audit by [the Paciello Group][TPG]
Jan 17 | 7.8.4   | Fixed newly identified minor issues from Dec 16 TPG retest
Feb 17 | 7.8.4   | (Address book) Thumb index is now accessible by keyboard
Mar 17 | 7.8.4   | Accessibility improvements to search and login
Apr 17 | 7.8.4   | Fixed multiple issues regardings JAWs (labels, verbosity)
Apr 17 | 7.8.4   | Folder tree improvements for screen readers and keyboard support for home/end
Apr 17 | 7.8.4   | Added document role to dialogs to force screen readers in correct mode
Apr 17 | 7.8.4   | Multiple focus improvents throughout apps
Jul 17 | 7.8.4   | Added distinguishable focus styles for tabbed inbox
Jul 17 | 7.10.0  | Added explicit labels for form fields where they were missing
Aug 17 | 7.10.0  | Improved color contrast in Alerts, Settings
Aug 17 | 7.10.0  | Introduced visual line indicator for list view and vgrid
Aug 17 | 7.8.4   | Fixed invalid labels in dialogs (calendar, mail, settings)
Aug 17 | 7.10.0  | Added more contrast to drag and drop helper
Sep 17 | 7.8.4   | Attachment preview list has now appropriate ARIA roles, states and properties
Sep 17 | 7.8.4   | Header logo changed to image with alt text
Sep 17 | 7.8.4   | Signature settings now have proper textual roles and descriptions
Sep 17 | 7.8.4   | Replaced combobox component with an accessible implementation
Sep 17 | 7.8.4   | Implicit calendar and address book headings changed to semantically correct headings
Oct 17 | 7.8.4   | (Help) Landing pages markup improved for users with screen readers
Oct 17 | 7.8.4   | Fixed guided tours accessiblity issues (keyboard, focus)
Nov 17 | 7.10.0  | Mail threads expandibles were implemented in an accessible manner
Nov 17 | 7.10.0  | Workshop/Review with accessibility expert [Marco Zehe][MZ] in Dortmund
Dec 17 | 7.10.0  | Accessibility audit by [the Paciello Group][TPG]
Dec 17 | 7.10.0  | Fixed missing labels in Mail
Dec 17 | 7.10.0  | Tabbed inbox accessibility issues resolved
Jan 18 | 7.10.0  | New application launcher accessiblity support
Jan 18 | 7.10.0  | Removed obsolete high contrast setting
Feb 18 | 7.10.0  | Removed obsolete accessibility improvements setting
Feb 18 | 7.10.0  | Initial keyboard support for new window management
Mar 18 | 7.10.0  | Attended CSUN 2018
Mar 18 | 7.10.0  | Added focus management for new windows
May 18 | 7.10.0  | Toolbars and menus focus management and roving tabindex
May 18 | 7.10.0  | Reworked landmark roles
Jun 18 | 7.10.1  | Introduced axe-core to developer workflow
Jun 18 | 7.10.1  | Fixed several issues found with axe-core
Sep 18 | 7.10.1  | Accessibility audit by [DEQUE][DQ]
Oct 18 | 7.10.1  | Fixed most issues found in last Audit
Nov 18 | 7.10.1  | Retest / Validation audit by [DEQUE][DQ]
Nov 18 | 7.10.1  | Added axe-core to e2e tests in our pipeline and added first tests
Jan 19 | 7.10.2  | Fixed several issues found by automated testing
Feb 19 | 7.10.2  | Added e2e tests for all apps and settings

[WCAG-TR]: https://www.w3.org/TR/WCAG21/
[WCAG-WAI]: https://www.w3.org/WAI/WCAG2AA-Conformance
[WCAG-INTRO]: https://www.w3.org/WAI/intro/accessibility.php

[NVDA]: http://www.nvaccess.org/
[JAWS]: http://www.freedomscientific.com/Products/Blindness/JAWS
[VO]: http://www.apple.com/accessibility/osx/voiceover/
[AXE]: https://www.deque.com/axe/

[TPG]: https://www.paciellogroup.com/
[DQ]: https://www.deque.com
[MZ]: https://www.marcozehe.de/

