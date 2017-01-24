---
title: Accessibility
icon: fa-universal-access
---

# Overview

[Web accessibility][WCAG-INTRO] aims at helping users with disabilities to access the web, i.e. perceiving and interacting with web sites or web-based applications. In order to offer everyone – with or without disabilities – the best possible user experience, we continually strive to meet the [Level AA conformance][WCAG-WAI] as defined by the [Web Content Accessibility Guidelines][WCAG-TR] 2.0. 

Accessibility typically covers keyboard support, tab order, focus management, color contrast, semantic markup, WAI-ARIA support, and screen reader support.

We perform screen reader testing with the following typical setups: [NVDA][NVDA] with Firefox, [JAWS][Jaws] with Internet Explorer and [Voiceover][VO] with Safari (with accessibility option turned on, i.e. tab highlights each item).

Annual accessibility audits are conducted by [the Paciello Group][TPG].

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

# Roadmap

Date   | Version | Activity
-------| --------| -----------------------------------------------------------------------
Jan 17 | 7.8.4   | Fixing newly identified minor issues from Dec 16 TPG retest
Q1 17  | 7.8.4   | Working on open issues (see below)
Q2 17  | 7.8.4   | New accessibility audit

# Open issues

- (Calendar) Timezone popup cannot be explored by screen reader users
- (General) Tokenfield and autocomplete keyboard interaction and screen reader supports needs improvement
- (General) Folder tree context menu does not respond properly in JAWS (when toggled by button)
- (General) Folder tree aria markup needs improvement for screen readers (is too verbose)
- (Address book) Thumb index is not accessible by keyboard

[WCAG-TR]: https://www.w3.org/TR/WCAG20/
[WCAG-WAI]: https://www.w3.org/WAI/WCAG2AA-Conformance
[WCAG-INTRO]: https://www.w3.org/WAI/intro/accessibility.php

[NVDA]: http://www.nvaccess.org/
[JAWS]: http://www.freedomscientific.com/Products/Blindness/JAWS
[VO]: http://www.apple.com/accessibility/osx/voiceover/

[TPG]: https://www.paciellogroup.com/
[MZ]: https://www.marcozehe.de/
