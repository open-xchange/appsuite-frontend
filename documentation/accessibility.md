---
title: Accessibility
icon: fa-universal-access
---

# Overview

[Web accessibility][WCAG-INTRO] aims at helping users with disabilities to access the web, i.e. perceiving and interacting with web sites or web-based applications. In order to offer everyone – with or without disabilities – the best possible user experience, we continually strive to meet the [Level AA conformance][WCAG-WAI] as defined by the [Web Content Accessibility Guidelines][WCAG-TR] 2.1.

Accessibility typically covers keyboard support, tab order, focus management, color contrast, semantic markup, WAI-ARIA support, and screen reader support.

We perform screen reader testing with the following typical setups on desktop devices: [NVDA][NVDA] with Firefox, [JAWS][Jaws] with Microsoft Edge and [Voiceover][VO] with Safari (with accessibility option turned on, i.e. tab highlights each item).

Automated testing with [axe-core][AXE] is also part of e2e tests in our build pipeline.

Annual accessibility audits are conducted by [the Paciello Group][TPG] or [DEQUE][DQ].

# History

| Date   | Version | Activity                                                                                                                      |
|--------|---------|-------------------------------------------------------------------------------------------------------------------------------|
| Jun 27 | 7.10.6  | Improved aria labels for calendar appointments and refactored accessibility logic                                             |
| Jun 25 | 7.10.6  | Aria-checked attribute updates in dropdown menus (e.g. sort dropdown)                                                         |
| May 25 | 7.10.6  | Password change link text updated to primary color                                                                            |
| May 25 | 7.10.6  | Add field name to title attribute of “remove” button in contact edit                                                          |
| Nov 24 | 7.10.6  | Clarify input field labels for screen readers to distinguish between katakana and hiragana                                    |
| Aug 24 | 7.10.6  | Add missing labels to the signature edit dialog                                                                               |
| Aug 24 | 7.10.6  | HTML section headings adjusted in address book                                                                                |
| May 21 | 7.10.6  | Fixed various issues in Chat Calendar and updated documentation                                                               |
| May 21 | 7.10.6  | Improved accessibility of Enterprise Picker                                                                                   |
| Oct 20 | 7.10.5  | Fixed various issues in Mail Help and core components                                                                         |
| Oct 20 | 7.10.5  | Reworked Chat to improve keyboard support and fixed various accessibility issues                                              |
| Oct 20 | 7.10.5  | Added fixed and improved accessibility e2e tests                                                                              |
| Jan 20 | 7.10.4  | Fixed many accessibility issues in Contacts Calendar Search Settings Mail and core components raised during [DEQUE][DQ] audit |
| Jan 20 | 7.10.4  | Fixed and improved e2e accessibility tests                                                                                    |
| Jul 19 | 7.10.3  | Fixed various accessibility issues in core App Suite UI components                                                            |
| Jul 19 | 7.10.3  | Fixed accessibility e2e tests                                                                                                 |
| Jul 19 | 7.10.3  | Fixed issues raised in [DEQUE][DQ] audit                                                                                      |
| Feb 19 | 7.10.2  | Added e2e tests for all apps and settings                                                                                     |
| Jan 19 | 7.10.2  | Fixed several issues found by automated testing                                                                               |
| Nov 18 | 7.10.1  | Added axe-core to e2e tests in our pipeline and added first tests                                                             |
| Nov 18 | 7.10.1  | Retest / Validation audit by [DEQUE][DQ]                                                                                      |
| Oct 18 | 7.10.1  | Fixed most issues found in last Audit                                                                                         |
| Sep 18 | 7.10.1  | Accessibility audit by [DEQUE][DQ]                                                                                            |
| Jun 18 | 7.10.1  | Introduced axe-core to developer workflow                                                                                     |
| Jun 18 | 7.10.1  | Fixed several issues found with axe-core                                                                                      |
| May 18 | 7.10.0  | Reworked landmark roles                                                                                                       |
| May 18 | 7.10.0  | Toolbars and menus focus management and roving tabindex                                                                       |
| Mar 18 | 7.10.0  | Added focus management for new windows                                                                                        |
| Mar 18 | 7.10.0  | Attended CSUN 2018                                                                                                            |
| Feb 18 | 7.10.0  | Initial keyboard support for new window management                                                                            |
| Feb 18 | 7.10.0  | Removed obsolete accessibility improvements setting                                                                           |
| Jan 18 | 7.10.0  | Removed obsolete high contrast setting                                                                                        |
| Jan 18 | 7.10.0  | New application launcher accessibility support                                                                                |
| Dec 17 | 7.10.0  | Tabbed inbox accessibility issues resolved                                                                                    |
| Dec 17 | 7.10.0  | Fixed missing labels in Mail                                                                                                  |
| Dec 17 | 7.10.0  | Accessibility audit by [the Paciello Group][TPG]                                                                              |
| Nov 17 | 7.10.0  | Workshop/Review with accessibility expert [Marco Zehe][MZ] in Dortmund                                                        |
| Nov 17 | 7.10.0  | Mail threads expandibles were implemented in an accessible manner                                                             |
| Oct 17 | 7.8.4   | Fixed guided tours accessibility issues (keyboard focus)                                                                      |
| Oct 17 | 7.8.4   | (Help) Landing pages markup improved for users with screen readers                                                            |
| Sep 17 | 7.8.4   | Implicit calendar and address book headings changed to semantically correct headings                                          |
| Sep 17 | 7.8.4   | Replaced combobox component with an accessible implementation                                                                 |
| Sep 17 | 7.8.4   | Signature settings now have proper textual roles and descriptions                                                             |
| Sep 17 | 7.8.4   | Header logo changed to image with alt text                                                                                    |
| Sep 17 | 7.8.4   | Attachment preview list has now appropriate ARIA roles states and properties                                                  |
| Aug 17 | 7.10.0  | Added more contrast to drag and drop helper                                                                                   |
| Aug 17 | 7.8.4   | Fixed invalid labels in dialogs (calendar mail settings)                                                                      |
| Aug 17 | 7.10.0  | Introduced visual line indicator for list view and vgrid                                                                      |
| Aug 17 | 7.10.0  | Improved color

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

