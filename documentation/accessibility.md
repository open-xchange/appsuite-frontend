---
title: Accessibility
icon: fa-universal-access
---

# Overview

Web accessibility aims to help users with disabilities to access information and functions available on the Internet. In order to offer everyone – with or without disabilities – the best possible user experience, we continually strive to meet the [Level AA conformance][WCAG-WAI] as laid out by the World Wide Web Consortium (W3C) in their [Web Content Accessibility Guidelines][WCAG-TR] 2.0.

Accessibility typically covers keyboard support, tab order, focus management, color contrast, semantic markup, WAI-ARIA support, and screen reader support.

We perform screen reader testing with the following typical setups: [NVDA][NVDA] with Firefox, [JAWS][Jaws] with Internet Explorer and [Voiceover][VO] with Safari (with accessibility option turned on, i.e. tab highlights each item).

Annual accessibility audits are conducted by [the paciello group][TPG].

# History

Date          | Version     | Activity
------------- | ------------| -----------------------------------------------------------------------
20.03.12      | 7.0.0       | Started working on general keyboard support
28.06.13      | 7.4.0       | Added support for F6 (jump to main panes)
14.07.13      | 7.4.0       | Started working on screen reader support (Semantic Markup, ARIA Tags)
24.08.13*     | -           | Accessibility Training (UI) with Steve Faulkner in Hamburg
24.09.13      | 7.4.0       | Added support for tabable panes
21.11.13      | 7.4.1       | Added live regions
21.11.13      | 7.4.1       | Added support for accessible drag & drop
21.11.13      | 7.4.1       | Added support for accessible pop-up dialogs
12.02.14      | 7.4.2       | Added support for accessible modal dialogs
12.02.14      | 7.4.2       | Added support for landmark roles
12.02.14      | 7.4.2       | Started working on accessible date picker
25.06.14      | 7.6.0       | Added ARIA markup to improve accessibility
25.06.14      | 7.6.0       | Added high contrast theme
15.10.14      | 7.6.1       | Improved keyboard support for mail compose
??.01.15      | 7.6.2       | Accessibility audit via [The Paciello Group][TPG]
29.05.15      | -           | Workshop with accessibility expert [Marco Zehe][MZ] in Hamburg
22.01.15      | -           | Started working on improving color contrast
12.02.15      | -           | Started rearranging code in source order
24.02.16      | -           | Workshop with accessibility expert [Marco Zehe][MZ] in Hamburg
04.05.16      | 7.8.0       | Accessibility audit via [the Paciello Group][TPG]
09.08.16      | 7.8.3       | Resolved inappropriate use of tabindex
02.09.16      | 7.8.3       | Added new accessible date picker

# Open issues
-


[WCAG-TR]: https://www.w3.org/TR/WCAG20/
[WCAG-WAI]: https://www.w3.org/WAI/WCAG2AA-Conformance

[NVDA]: http://www.nvaccess.org/
[JAWS]: http://www.freedomscientific.com/Products/Blindness/JAWS
[VO]: http://www.apple.com/accessibility/osx/voiceover/

[TPG]: https://www.paciellogroup.com/
[MZ]: https://www.marcozehe.de/
