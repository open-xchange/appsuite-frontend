---
title: Accessibility
icon: fa-universal-access
---

# Overview

[Web accessibility][WCAG-INTRO] aims at helping users with disabilities to access the web, i.e. perceiving and interacting with web sites or web-based applications. In order to offer everyone – with or without disabilities – the best possible user experience, we continually strive to meet the [Level AA conformance][WCAG-WAI] as defined by the [Web Content Accessibility Guidelines][WCAG-TR] 2.1. 

Accessibility typically covers keyboard support, tab order, focus management, color contrast, semantic markup, WAI-ARIA support, and screen reader support.

We perform screen reader testing with the following typical setups: [NVDA][NVDA] with Firefox, [JAWS][Jaws] with Internet Explorer and [Voiceover][VO] with Safari (with accessibility option turned on, i.e. tab highlights each item).

Automated testing with [axe-core][AXE] is also part of e2e tests in our build pipeline.

Annual accessibility audits are conducted by [the Paciello Group][TPG] or [DEQUE][DQ].

# History

Date   | Version | Activity
-------| --------| -----------------------------------------------------------------------
Jan 20 | 7.10.4  | Fixed many accessibility issues in Contacts, Calendar, Search, Settings, Mail and core components raised during [DEQUE][DQ] audit
Jan 20 | 7.10.4  | Fixed and improved e2e accessibility tests
Jul 19 | 7.10.3  | Fixed various accessibility issues in core App Suite UI components
Jul 19 | 7.10.3  | Fixed accessibility e2e tests
Jul 19 | 7.10.3  | Fixed issues raised in [DEQUE][DQ] audit
Feb 19 | 7.10.2  | Added e2e tests for all apps and settings
Jan 19 | 7.10.2  | Fixed several issues found by automated testing
Nov 18 | 7.10.1  | Added axe-core to e2e tests in our pipeline and added first tests
Nov 18 | 7.10.1  | Retest / Validation audit by [DEQUE][DQ]
Oct 18 | 7.10.1  | Fixed most issues found in last Audit
Sep 18 | 7.10.1  | Accessibility audit by [DEQUE][DQ]
Jun 18 | 7.10.1  | Introduced axe-core to developer workflow
Jun 18 | 7.10.1  | Fixed several issues found with axe-core
May 18 | 7.10.0  | Reworked landmark roles
May 18 | 7.10.0  | Toolbars and menus focus management and roving tabindex
Mar 18 | 7.10.0  | Added focus management for new windows
Mar 18 | 7.10.0  | Attended CSUN 2018
Feb 18 | 7.10.0  | Initial keyboard support for new window management
Feb 18 | 7.10.0  | Removed obsolete accessibility improvements setting
Jan 18 | 7.10.0  | Removed obsolete high contrast setting
Jan 18 | 7.10.0  | New application launcher accessibility support
Dec 17 | 7.10.0  | Tabbed inbox accessibility issues resolved
Dec 17 | 7.10.0  | Fixed missing labels in Mail
Dec 17 | 7.10.0  | Accessibility audit by [the Paciello Group][TPG]
Nov 17 | 7.10.0  | Workshop/Review with accessibility expert [Marco Zehe][MZ] in Dortmund
Nov 17 | 7.10.0  | Mail threads expandibles were implemented in an accessible manner
Oct 17 | 7.8.4   | Fixed guided tours accessibility issues (keyboard, focus)
Oct 17 | 7.8.4   | (Help) Landing pages markup improved for users with screen readers
Sep 17 | 7.8.4   | Implicit calendar and address book headings changed to semantically correct headings
Sep 17 | 7.8.4   | Replaced combobox component with an accessible implementation
Sep 17 | 7.8.4   | Signature settings now have proper textual roles and descriptions
Sep 17 | 7.8.4   | Header logo changed to image with alt text
Sep 17 | 7.8.4   | Attachment preview list has now appropriate ARIA roles, states and properties
Aug 17 | 7.10.0  | Added more contrast to drag and drop helper
Aug 17 | 7.8.4   | Fixed invalid labels in dialogs (calendar, mail, settings)
Aug 17 | 7.10.0  | Introduced visual line indicator for list view and vgrid
Aug 17 | 7.10.0  | Improved color contrast in Alerts, Settings
Jul 17 | 7.10.0  | Added explicit labels for form fields where they were missing
Jul 17 | 7.8.4   | Added distinguishable focus styles for tabbed inbox
Apr 17 | 7.8.4   | Multiple focus improvements throughout apps
Apr 17 | 7.8.4   | Added document role to dialogs to force screen readers in correct mode
Apr 17 | 7.8.4   | Folder tree improvements for screen readers and keyboard support for home/end
Apr 17 | 7.8.4   | Fixed multiple issues regarding JAWs (labels, verbosity)
Mar 17 | 7.8.4   | Accessibility improvements to search and login
Feb 17 | 7.8.4   | (Address book) Thumb index is now accessible by keyboard
Jan 17 | 7.8.4   | Fixed newly identified minor issues from Dec 16 TPG retest
Dec 16 | 7.8.3   | Retest accessibility audit by [the Paciello Group][TPG]
Oct 16 | 7.8.3   | Resolving remaining issues from recent audit
Sep 16 | 7.8.3   | Added new accessible date picker
Aug 16 | 7.8.3   | Finally fixed remaining tabindex issues
Jun 16 | 7.8.2   | Started to resolve identified issues from recent audit
May 16 | 7.8.1   | Accessibility audit by [the Paciello Group][TPG]
Feb 16 | -       | Workshop/Review with accessibility expert [Marco Zehe][MZ] in Hamburg
Jun 15 | 7.8.0   | Partially rearranged DOM elements to appear in source order
Mar 15 | -       | Workshop/Review with accessibility expert [Marco Zehe][MZ] in Hamburg
Feb 15 | 7.8.0   | Improved color contrast
Feb 15 | 7.8.0   | Started to resolve identified issues from recent audit
Jan 15 | 7.6.2   | Accessibility audit by [the Paciello Group][TPG]
Oct 14 | 7.6.1   | Improved keyboard support for mail compose
Jun 14 | 7.6.0   | Added high contrast theme
Jun 14 | 7.6.0   | Polished ARIA markup to improve accessibility
Feb 14 | 7.4.2   | Added support for landmark roles
Feb 14 | 7.4.2   | Added support for accessible modal dialogs
Nov 13 | 7.4.1   | Added support for accessible popup dialogs
Nov 13 | 7.4.1   | Added live regions
Sep 13 | 7.4.0   | Added support for tabbable panes
Aug 13 | -       | Accessibility training (UI) with Steve Faulkner in Hamburg
Jul 13 | 7.4.0   | Introduced fundamental screen reader support (semantic markup, ARIA tags)
Apr 13 | 7.2.0   | Introduced fundamental keyboard support

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

