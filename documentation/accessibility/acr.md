---
title: Accessibility Conformance Report
description: based on Voluntary Product Accessibility Template (VPAT™) International Edition Version 2.3 (December 2018)
---

<style type="text/css">h1:before, h2:before, .h1-based:before, .h2-based:before {  content:"" !important; } .criterion tr td ul li { list-style:none; } .criterion tr td ul li ul li { list-style:disc; } .criterion tr td ul, .table tr td:nth-child(1) span { padding-left: 20px; } .criterion tr td ul ul { padding-left: 40px; } .article .row p { max-width: initial } .table tr td:first-child { width: 30%; } .table tr td:nth-child(2) { min-width: 150px; }</style>

# Product Information #

**Name of Product/Version**: Open-Xchange App Suite UI (Core) 7.10.1

**Product Description:** An easy-to-use email, communication, and collaboration platform, OX App Suite provides access to a wide range of white-labeled applications.

**Date:** Febuary 2018

**Contact information:** <info@open-xchange.com>

**Notes:**
In the scope of this document are the core components of the web user interface (login, mail, portal, addressbook, calendar, settings, drive).

Exempt from the scope is user content e.g. HTML mails, as we can not modify user content and all modifications of core ui code.

**Evaluation Methods Used:**
Testing Open-Xchange App Suite UI (Core) involved extensive use of leading assistive technologies, such as screen readers, screen magnifiers, and speech recognition software, as well exclusive use of the keyboard. Native platform accessibility features were also used to assist with testing. These were supplemented with techniques such as manual inspection of Accessibility API output.


# Applicable Standards/Guidelines #

This report covers the degree of conformance for the following accessibility standard/guidelines:

<table>
    <tr><th style="width:80%">Standard/Guideline</th><th style="min-width: 150px">Included In Report</th></tr>
    <tr><td>Web Content Accessibility Guidelines 2.0, at <a href="https://www.w3.org/TR/2008/REC-WCAG20-20081211" target="_blank">https://www.w3.org/TR/2008/REC-WCAG20-20081211</a></td><td>Level A - Yes<br>Level AA - Yes<br>Level AAA - No</td></tr>
    <tr><td>Web Content Accessibility Guidelines 2.1, at <a href="https://www.w3.org/TR/WCAG21/" target="_blank">https://www.w3.org/TR/WCAG21/</a></td><td>Level A - Yes<br>Level AA - Yes<br>Level AAA - No</td></tr>
    <tr><td><a href="https://www.access-board.gov/guidelines-and-standards/communications-and-it/about-the-ict-refresh/final-rule/text-of-the-standards-and-guidelines" target="_blank">Revised Section 508 standards</a> as published by the U.S. Access Board in the Federal Register on January 18, 2017<br><a href="https://www.access-board.gov/guidelines-and-standards/communications-and-it/about-the-ict-refresh/corrections-to-the-ict-final-rule" target="_blank">Corrections to the ICT Final Rule</a> as published by the US Access Board in the Federal Register on January 22, 2018</td><td>Yes</td></tr>
    <tr><td>EN 301 549  Accessibility requirements suitable for public procurement of ICT products and services in Europe, - V1.1.2 (2015-04) at <a href="https://www.etsi.org/deliver/etsi_en//301500_301599/301549/02.01.02_60/en_301549v020102p.pdf" target="_blank">ETSI</a></td><td>Yes</td></tr>
</table>


# Terms #

The terms used in the Conformance Level information are defined as follows:

*   **Supports**: The functionality of the product has at least one method that meets the criterion without known defects or meets with equivalent facilitation.
*   **Supports with Exceptions**: Some functionality of the product does not meet the criterion.
*   **Does Not Support**: The majority of product functionality does not meet the criterion.
*   **Not Applicable**: The criterion is not relevant to the product.
*   **Not Evaluated**: The product has not been evaluated against the criterion. This can be used only in WCAG 2.0 Level AAA.


# WCAG 2.x Report #

Tables 1 and 2 also document conformance with:

*   EN 301 549:  Chapter 9 - Web, Chapter 10 - Non-Web documents, Section 11.2.1- Non-Web Software (excluding closed functionality), and Section 11.2.2 - Non-Web Software (closed functionality).
*   Revised Section 508: Chapter 5 – 501.1 Scope, 504.2 Content Creation or Editing, and Chapter 6 – 602.3 Electronic Support Documentation.

Note: When reporting on conformance with the WCAG 2.x Success Criteria, they are scoped for full pages, complete processes, and accessibility-supported ways of using technology as documented in the [WCAG 2.0 Conformance Requirements][1].

## Table 1: Success Criteria, Level A ##

<table class="criterion">
    <thead><tr><th>Criteria</th><th>Conformance Level</th><th>Remarks and Explanations</th></tr></thead>
    <tbody>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#text-equiv-all">1.1.1 Non-text Content</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.1.1 (Web)</li>
                            <li>10.1.1.1 (Non-web document)</li>
                            <li>11.1.1.1.1 (Open Functionality Software)</li>
                            <li>11.1.1.1.2 (Closed Functionality Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: Text alternatives are provided for all instances of non-text content.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#media-equiv-av-only-alt">1.2.1 Audio-only and Video-only (Prerecorded)</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.2.1 (Web)</li>
                            <li>10.1.2.1 (Non-web document)</li>
                            <li>11.1.2.1.1 (Open Functionality Software)</li>
                            <li>11.1.2.1.2.1 and 11.1.2.1.2.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not provide prerecorded audio-only or video-only content.<br>However, it allows users to embed the audio/video content.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#media-equiv-captions">1.2.2 Captions (Prerecorded)</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.2.2 (Web)</li>
                            <li>10.1.2.2 (Non-web document)</li>
                            <li>11.1.2.2 (Open Functionality Software)</li>
                            <li>11.1.2.2 (Closed Software) – Does not apply</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not provide prerecorded audio-only or video-only content.<br>However, it allows users to embed the audio/video content.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#media-equiv-audio-desc">1.2.3 Audio Description or Media Alternative (Prerecorded)</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.2.3 (Web)</li>
                            <li>10.1.2.3 (Non-web document)</li>
                            <li>11.1.2.3.1 (Open Functionality Software)</li>
                            <li>11.1.2.3.1 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not provide prerecorded media that requires audio description.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic">1.3.1 Info and Relationships</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.3.1 (Web)</li>
                            <li>10.1.3.1 (Non-web document)</li>
                            <li>11.1.3.1.1 (Open Functionality Software)</li>
                            <li>11.1.3.1.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports with Exceptions</td>
            <td>Web: The product provides programmatic labels to indicate the purpose of form input fields.<br>In very rare cases, such as the search field, the input fields do not provide both visual and programmatic labels and rely on placeholder values for form field labels.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#content-structure-separation-sequence">1.3.2 Meaningful Sequence</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.3.2 (Web)</li>
                            <li>10.1.3.2 (Non-web document)</li>
                            <li>11.1.3.2.1 (Open Functionality Software)</li>
                            <li>11.1.3.2.2 (Closed Software) – Does not apply</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product presents content in a meaningful sequence.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#content-structure-separation-sequence">1.3.3 Sensory Characteristics</a>  (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.3.3 (Web)</li>
                            <li>10.1.3.3 (Non-web document)</li>
                            <li>11.1.3.3 (Open Functionality Software)</li>
                            <li>11.1.3.3 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: Instructions provided for understanding and interacting with the product do not rely solely on sensory characteristics of components, such as shape, size, visual location, orientation or sound.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#visual-audio-contrast-without-color">1.4.1 Use of Color</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.4.1 (Web)</li>
                            <li>10.1.4.1 (Non-web document)</li>
                            <li>11.1.4.1 (Open Functionality Software)</li>
                            <li>11.1.4.1 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports with Exceptions</td>
            <td>Web: The product sometimes uses color as the only visual means of conveying focus or selection.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#visual-audio-contrast-dis-audio">1.4.2 Audio Control</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.4.2 (Web)</li>
                            <li>10.1.4.2 (Non-web document)</li>
                            <li>11.1.4.2 (Open Functionality Software)</li>
                            <li>11.1.4.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not include audio which plays automatically.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#keyboard-operation-keyboard-operable">2.1.1 Keyboard</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.1.1 (Web)</li>
                            <li>10.2.1.1 (Non-web document)</li>
                            <li>11.2.1.1.1 (Open Functionality Software)</li>
                            <li>11.2.1.1.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports with exceptions</td>
            <td>Web: The product also provides features that use drag and drop functionality, which is accessible only using the mouse. For example, adding attachments whilst composing an email, has a drag-and-drop feature that is not accessible from the keyboard. However there are alternative accessible methods to provide users the same functionality.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#keyboard-operation-trapping">2.1.2 No Keyboard Trap</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.1.2 (Web)</li>
                            <li>10.2.1.2 (Non-web document)</li>
                            <li>11.2.1.2 (Open Functionality Software)</li>
                            <li>11.2.1.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not include keyboard traps.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#character-key-shortcuts">2.1.4 Character Key Shortcuts</a> (Level A 2.1 only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.1.4 (Web)</li>
                            <li>10.2.1.4 (Non-web document)</li>
                            <li>11.2.1.4.1 (Open Functionality Software)</li>
                            <li>11.2.1.4.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td></td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#time-limits-required-behaviors">2.2.1 Timing Adjustable</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.2.1 (Web)</li>
                            <li>10.2.2.1 (Non-web document)</li>
                            <li>11.2.2.1 (Open Functionality Software)</li>
                            <li>11.2.2.1 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not include time-based limits, except for a session timeout, that can be adjusted or turned off in the user’s settings.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#time-limits-pause">2.2.2 Pause, Stop, Hide</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.2.2 (Web)</li>
                            <li>10.2.2.2 (Non-web document)</li>
                            <li>11.2.2.2 (Open Functionality Software)</li>
                            <li>11.2.2.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not include elements which automatically move, blink, scroll or auto-update, except e.g. incoming emails update list views. where this is essential for the proper and expected function of the software.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#seizure-does-not-violate">2.3.1 Three Flashes or Below Threshold</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.3.1 (Web)</li>
                            <li>10.2.3.1 (Non-web document)</li>
                            <li>11.2.3.1 (Open Functionality Software)</li>
                            <li>11.2.3.1 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not contain flashing content.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#navigation-mechanisms-skip">2.4.1 Bypass Blocks</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.4.1 (Web)</li>
                            <li>10.2.4.1 (Non-web document) – Does not apply</li>
                            <li>11.2.4.1 (Open Functionality Software) – Does not apply</li>
                            <li>11.2.4.1 (Closed Software) – Does not apply</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software) – Does not apply to non-web software</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs) – Does not apply to non-web docs</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports with exceptions</td>
            <td>Web: The product does not provide skip links for navigation structures, but it provides alternative means to bypass blocks. E.g. CTRL + F6 to cycle through blocks or pressing enter on already selected items like in the quicklauncher skips directly to the launched application's folder tree.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#navigation-mechanisms-title">2.4.2 Page Titled</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.4.2 (Web)</li>
                            <li>10.2.4.2 (Non-web document)</li>
                            <li>11.2.4.2 (Software) – Does not apply</li>
                            <li>11.2.4.2 (Closed Software) – Does not apply</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product provides descriptive page titles.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#navigation-mechanisms-title">2.4.3 Focus Order</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.4.3 (Web)</li>
                            <li>10.2.4.3 (Non-web document)</li>
                            <li>11.2.4.3 (Open Functionality Software)</li>
                            <li>11.2.4.3 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The focus or tab order of elements that receive keyboard focus in the product is logical. Focus is also managed in dialogs and should always return properly to the element that spawned the dialog, when appropriate.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#navigation-mechanisms-refs">2.4.4 Link Purpose (In Context)</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.4.4 (Web)</li>
                            <li>10.2.4.4 (Non-web document)</li>
                            <li>11.2.4.4 (Open Functionality Software)</li>
                            <li>11.2.4.4 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: Links are labeled and meaningful.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#pointer-gestures">2.5.1 Pointer Gestures</a> (Level A 2.1 Only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.5.1 (Web)</li>
                            <li>10.2.5.1 (Non-web document)</li>
                            <li>11.2.5.1 (Open Functionality Software)</li>
                            <li>11.2.5.1 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: Every operation can be completed with a single pointer without a path-based gesture.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#pointer-cancellation">2.5.2 Pointer Cancellation</a> (Level A 2.1 Only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.5.2 (Web)</li>
                            <li>10.2.5.2 (Non-web document)</li>
                            <li>11.2.5.2 (Open Functionality Software)</li>
                            <li>11.2.5.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td></td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#label-in-name">2.5.3 Label in Name</a> (Level A 2.1 Only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.5.3 (Web)</li>
                            <li>10.2.5.3 (Non-web document)</li>
                            <li>11.2.5.3 (Open Functionality Software)</li>
                            <li>11.2.5.3 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports with Exceptions</td>
            <td>Web: User interface components that include text will mostly start with the same accessible name as the label, except in rare cases where more context is provided to the accessible label.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#motion-actuation">2.5.4 Motion Actuation</a> (Level A 2.1 Only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.5.4 (Web)</li>
                            <li>10.2.5.4 (Non-web document)</li>
                            <li>11.2.5.4 (Open Functionality Software)</li>
                            <li>11.2.5.4 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: There are no specific motion activated interface components.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#meaning-doc-lang-id">3.1.1 Language of Page</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.1.1 (Web)</li>
                            <li>10.3.1.1 (Non-web document)</li>
                            <li>11.3.1.1.1 (Open Functionality Software)</li>
                            <li>11.3.1.1.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports with exceptions</td>
            <td>Web: The language attribute for the pages corresponds with the language of the user interface.<br>However, user generated content e.g. an Email does not get its appropriate language attribute as there is no detection for the language of user generated content in the product.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#consistent-behavior-receive-focus">3.2.1 On Focus</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.2.1 (Web)</li>
                            <li>10.3.2.1 (Non-web document)</li>
                            <li>11.3.2.1 (Open Functionality Software)</li>
                            <li>11.3.2.1 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: User interface components do not initiate a change of context when a control or input field receives focus.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#consistent-behavior-unpredictable-change">3.2.2 On Input</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.2.2 (Web)</li>
                            <li>10.3.2.2 (Non-web document)</li>
                            <li>11.3.2.2 (Open Functionality Software)</li>
                            <li>11.3.2.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: User interface components do not initiate a change of context on user input.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#minimize-error-identified">3.3.1 Error Identification</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.3.1 (Web)</li>
                            <li>10.3.3.1 (Non-web document)</li>
                            <li>11.3.3.1.1 (Open Functionality Software)</li>
                            <li>11.3.3.1.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports with Exceptions</td>
            <td>Web: Form errors are identified; however, the errors are in some cases not indicated clearly and explicitly by using the word “Error” or an error icon, and may be identified solely using red color.<br><br>
                Furthermore, errors are not always indicated at the beginning of the form and the field level errors are not explicitly associated with the respective field in error, causing difficulty for users of assistive technology in identifying and correcting the errors.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#minimize-error-cues">3.3.2 Labels or Instructions</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.3.2 (Web)</li>
                            <li>10.3.3.2 (Non-web document)</li>
                            <li>11.3.3.2 (Open Functionality Software)</li>
                            <li>11.3.3.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports with Exceptions</td>
            <td>Web: The product provides programmatic labels to indicate the purpose of form input fields. In very rare cases, such as the search field, the input fields do not provide both visual and programmatic labels and rely on placeholder values for form field labels. Furthermore, form instructions, such as “*”, denoting required fields are not indicated.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#ensure-compat-parses">4.1.1 Parsing</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.4.1.1 (Web)</li>
                            <li>10.4.1.1 (Non-web document)</li>
                            <li>11.4.1.1.1 (Open Functionality Software)</li>
                            <li>11.4.1.1.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td></td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#ensure-compat-parses">4.1.2 Name, Role, Value</a> (Level A)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.4.1.2 (Web)</li>
                            <li>10.4.1.2 (Non-web document)</li>
                            <li>11.4.1.2.1 (Open Functionality Software)</li>
                            <li>11.4.1.2.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td></td>
        </tr>
    </tbody>
</table>

## Table 2: Success Criteria, Level AA ##


<table class="criterion">
    <thead><tr><th>Criteria</th><th>Conformance Level</th><th>Remarks and Explanations</th></tr></thead>
    <tbody>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#media-equiv-real-time-captions">1.2.4 Captions (Live)</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.2.4 (Web)</li>
                            <li>10.1.2.4 (Non-web document)</li>
                            <li>11.1.2.4 (Open Functionality Software)</li>
                            <li>11.1.2.4 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not provide live media that requires captions.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#media-equiv-audio-desc-only">1.2.5 Audio Description (Prerecorded)</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.2.5 (Web)</li>
                            <li>10.1.2.5 (Non-web document)</li>
                            <li>11.1.2.5 (Open Functionality Software)</li>
                            <li>11.1.2.5 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product does not provide prerecorded video content that requires audio description.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#orientation">1.3.4 Orientation</a> (Level AA 2.1 only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.3.4 (Web)</li>
                            <li>10.1.3.4 (Non-web document)</li>
                            <li>11.1.3.4 (Open Functionality Software)</li>
                            <li>11.1.3.4 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: Content is not restricted to a single display orientation.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#identify-input-purpose">1.3.5 Identify Input Purpose</a> (Level AA 2.1 only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.3.5 (Web)</li>
                            <li>10.1.3.5 (Non-web document)</li>
                            <li>11.1.3.5 (Open Functionality Software)</li>
                            <li>11.1.3.5 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Does Not Support</td>
            <td>Web: Currently we do not support this.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast">1.4.3 Contrast (Minimum)</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.4.3 (Web)</li>
                            <li>10.1.4.3 (Non-web document)</li>
                            <li>11.1.4.3 (Open Functionality Software)</li>
                            <li>11.1.4.3 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: All elements should have a sufficient color contrast.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#visual-audio-contrast-scale">1.4.4 Resize text</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.4.4 (Web)</li>
                            <li>10.2.13 (Non-web document)</li>
                            <li>11.2.1.13 (Open Functionality Software)</li>
                            <li>11.2.2.13 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Does Not Support</td>
            <td>Web: The product and published website content can be resized up to 200% without any loss of information of functionality. However text-only zoom is not supported at the moment.<br>Also zoom does not work as expected on mobile devices such as smartphones.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#visual-audio-contrast-text-presentation">1.4.5 Images of Text</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.4.5 (Web)</li>
                            <li>10.1.4.5 (Non-web document)</li>
                            <li>11.1.4.5.1 (Open Functionality Software)</li>
                            <li>11.1.4.5.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product uses text instead of images of text.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#reflow">1.4.10 Reflow</a> (Level AA 2.1 only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.4.10 (Web)</li>
                            <li>10.1.4.10 (Non-web document)</li>
                            <li>11.1.4.10.1 (Open Functionality Software)</li>
                            <li>11.1.4.10.2 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Does Not Support</td>
            <td>Web: See Success Criterion 1.4.4</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#non-text-contrast">1.4.11 Non-text Contrast</a> (Level AA 2.1 only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.4.11 (Web)</li>
                            <li>10.1.4.11 (Non-web document)</li>
                            <li>11.1.4.11 (Open Functionality Software)</li>
                            <li>11.1.4.11 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td></td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#text-spacing">1.4.12 Text Spacing</a> (Level AA 2.1 only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.4.12 (Web)</li>
                            <li>10.1.4.12 (Non-web document)</li>
                            <li>11.1.4.12 (Open Functionality Software)</li>
                            <li>11.1.4.12 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td></td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#content-on-hover-or-focus">1.4.13 Content on Hover or Focus</a> (Level AA 2.1 only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.1.4.13 (Web)</li>
                            <li>10.1.4.13 (Non-web document)</li>
                            <li>11.1.4.13 (Open Functionality Software)</li>
                            <li>11.1.4.13 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td></td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#navigation-mechanisms-mult-loc">2.4.5 Multiple Ways</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.24 (Web)</li>
                            <li>10.2.24 (Non-web document) – Does not apply</li>
                            <li>11.2.1.24 (Software) – Does not apply</li>
                            <li>11.2.2.24 (Closed Software) – Does not apply</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software) – Does not apply to non-web software</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs) – Does not apply to non-web docs</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product allows information to be found through multiple ways.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#navigation-mechanisms-descriptive">2.4.6 Headings and Labels</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.4.6 (Web)</li>
                            <li>10.2.4.6 (Non-web document)</li>
                            <li>11.2.4.6 (Open Functionality Software)</li>
                            <li>11.2.4.6 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product has logical heading structures.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-visible">2.4.7 Focus Visible</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.2.4.7 (Web)</li>
                            <li>10.2.4.7 (Non-web document)</li>
                            <li>11.2.4.7 (Open Functionality Software)</li>
                            <li>11.2.4.7 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports with Exceptions</td>
            <td>Web: Most elements in the product indicate keyboard focus visually.<br>However, sometimes the focus styles are not very distinct or rely on color alone.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#meaning-other-lang-id">3.1.2 Language of Parts</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.1.2 (Web)</li>
                            <li>10.3.1.2 (Non-web document)</li>
                            <li>11.3.1.2 (Software) – Does not apply</li>
                            <li>11.3.1.2 (Closed Software) – Does not apply</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Does Not Support</td>
            <td>Web: The product does not provide a mechanism to indicate a different language for parts of web content it creates.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-locations">3.2.3 Consistent Navigation</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.2.3 (Web)</li>
                            <li>10.3.2.3 (Non-web document) – Does not apply</li>
                            <li>11.3.2.3 (Software) – Does not apply</li>
                            <li>11.3.2.3 (Closed Software) – Does not apply</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software) – Does not apply to non-web software</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs) – Does not apply to non-web docs</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product provides consistent navigation of content.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-functionality">3.2.4 Consistent Identification</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.2.4 (Web)</li>
                            <li>10.3.2.4 (Non-web document) – Does not apply</li>
                            <li>11.3.2.4 (Software) – Does not apply</li>
                            <li>11.3.2.4 (Closed Software) – Does not apply</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software) – Does not apply to non-web software</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs) – Does not apply to non-web docs</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The product provides consistent identification of UI elements.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#minimize-error-suggestions">3.3.3 Error Suggestion</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.3.3 (Web)</li>
                            <li>10.3.3.3 (Non-web document)</li>
                            <li>11.3.3.3 (Open Functionality Software)</li>
                            <li>11.3.3.3 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td>Web: The forms in the product include input fields where error suggestions are available or provide a visible error notification with an additional aria-live region.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG20/#minimize-error-reversible">3.3.4 Error Prevention (Legal, Financial, Data)</a> (Level AA)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.3.3.4 (Web)</li>
                            <li>10.3.3.4 (Non-web document)</li>
                            <li>11.3.3.4 (Open Functionality Software)</li>
                            <li>11.3.3.4 (Closed Software)</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508
                        <ul>
                            <li>501 (Web)(Software)</li>
                            <li>504.2 (Authoring Tool)</li>
                            <li>602.3 (Support Docs)</li>
                        </ul>
                    </li>
                </ul>
            </td>
            <td>Web: Does Not Support</td>
            <td>Web: The product is not intended to process legal or financial data directly, but it has an email component. After sending an email there is no way of reversing that process.</td>
        </tr>
        <tr>
            <td><a href="https://www.w3.org/TR/WCAG21/#status-messages">4.1.3 Status Messages</a> (Level AA 2.1 only)<br>
                <span>Also applies to:</span>
                <ul>
                    <li>EN 301 549 Criteria
                        <ul>
                            <li>9.4.1.3 (Web)</li>
                            <li>10.4.1.3 (Non-web document) - Does not apply</li>
                            <li>11.4.1.3 (Open Functionality Software) - Does not apply</li>
                            <li>11.4.1.3 (Closed Software) - Does not apply</li>
                            <li>11.8.2 (Authoring Tool)</li>
                            <li>12.1.2 (Product Docs)</li>
                            <li>12.2.4 (Support Docs)</li>
                        </ul>
                    </li>
                    <li>Revised Section 508 - Does not apply</li>
                </ul>
            </td>
            <td>Web: Supports</td>
            <td></td>
        </tr>
    </tbody>
</table>

# Revised Section 508 Report #

## Chapter 3: Functional Performance Criteria (FPC) ##

Criteria                                                       | Conformance Level             | Remarks and Explanations
---------------------------------------------------------------|-------------------------------|---------------------------------
302.1 Without Vision                                           | Web: Supports with Exceptions | Web: Users without vision rely on information being communicated in text or programmatically in ways that can be accessed by assistive technology. As noted in 1.3.1 The product provides programmatic labels to indicate the purpose of form input fields, but in very rare cases, such as the search field, the input fields do not provide both visual and programmatic labels and rely on placeholder values for form field labels.; in 2.4.1 Bypass Blocks, we have no skip links and as in 2.1.1 Keyboard we have some drag and drop functionality that is not supported.
302.2 With Limited Vision                                      | Web: Supports with Exceptions | Web: Text can be resized up to 200% on the published websites, but difficulties were noted in resizing text in the product, as described in 1.4.4 Resize text.<br><br>As noted in 1.4.1 Use of Color, color is sometimes solely used to communicate state, selection and errors in the product.
302.3 Without Perception of Color                              | Web: Supports with Exceptions | Web: Color alone is sometimes solely used to communicate state, selection and errors, causing difficulties for users without perception of color to use the product, as noted in 1.4.1 Use of Color.
302.4 Without Hearing                                          | Web: Supports                 | Web: The product does not produce sound or speech, so it is usable by people without hearing.
302.5 With Limited Hearing                                     | Web: Supports                 | Web: The product does not produce sound or speech, so it is usable by people with limited hearing.
302.6 Without Speech                                           | Web: Supports                 | Web: The product does not require speech input or control, so it is usable by people without speech.
302.7 With Limited Manipulation                                | Web: Supports with Exceptions | Web: Most functions are functional for users with limited manipulation who rely on keyboard access, as previously stated in 2.1.1 Keyboard. Some elements do not provide a good visible indication of keyboard focus, as previously stated in 2.4.7 Focus Visible.
302.8 With Limited Reach and Strength                          | Web: Supports                 | Web: The product is functional with limited reach and strength.
302.9 With Limited Language, Cognitive, and Learning Abilities | Web: Supports                 |

## Chapter 4: Hardware ##

Notes: Not Applicable

## Chapter 5: Software ##

Notes: Not Applicable

## Chapter 6: Support Documentation and Services ##
Notes:

Criteria                                                         | Conformance Level                        | Remarks and Explanations
-----------------------------------------------------------------|------------------------------------------|---------------------------------
**601.1 Scope**                                                  |                                          |
**602 Support Documentation**                                    |                                          |
602.2 Accessibility and Compatibility Features                   | TBD                                      |
602.3 Electronic Support Documentation                           | See [WCAG 2.x](#wcag-2-0-report) section | See information in WCAG section
602.4 Alternate Formats for Non-Electronic Support Documentation | Not Applicable                           | There is not Non-Electronic Support Documentation available
**603 Support Services**                                         |                                          |
603.2 Information on Accessibility and Compatibility Features    | TBD                                      |
603.3 Accommodation of Communication Needs                       | Supports                                 | Support provided via [web](https://www.open-xchange.com/company/contact-ox/?no_cache=1) and [email](mailto:info@open-xchange.com).


# EN 301 549 Report #

## Chapter 4: [4.2 Functional Performance Statements](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=22) (FPS) ##

Criteria                                                        | Conformance Level             | Remarks and Explanations
----------------------------------------------------------------|-------------------------------|---------------------------------
4.2.1 Usage without vision                                      |                               |
4.2.2 Usage with limited vision Web:                            | Web: Supports with Exceptions | Web: The product and published website content can be resized up to 200% without any loss of information of functionality.<br>However this does not apply to mobile devices such as smartphones as the user.
4.2.3 Usage without perception of colour                        | Web: Supports with Exceptions | Web: Most functions of the product are functional without perception of color. As previously stated in 1.4.1 Use of Color, color alone is used to indicate selection, distinguish inline links from paragraph text, and provide visible indication of focus on some controls.
4.2.4 Usage without hearing                                     | Web: Supports                 | Web: The product does not produce sound or speech, so it is usable by people without hearing.
4.2.5 Usage with limited hearing                                | Web: Supports                 | Web: The product does not produce sound or speech, so it is usable by people with limited hearing.
4.2.6 Usage without vocal capability                            | Web: Supports                 | Web: The product does not require vocal input.
4.2.7 Usage with limited manipulation or strength               | Web: Supports with Exceptions | Web: Most functions are functional for users with limited manipulation who rely on keyboard access, as previously stated in 2.1.1 Keyboard. Some elements do not provide a good visible indication of keyboard focus, as previously stated in 2.4.7 Focus Visible.
4.2.8 Usage with limited reach                                  | Web: Supports                 | Web: The product is functional with limited reach.
4.2.9 Minimize photosensitive seizure triggers                  | Web: Supports                 | Web: The product does not contain elements which flash or other features likely to trigger photosensitive seizures.
4.2.10 Usage with limited cognition                             | Web: Supports                 | Web: Users with cognitive disabilities have varying needs for features that allow them to adapt content and work with assistive technology or accessibility features of the platform. The product provides a text description in simple language if only an icon is provided.
4.2.11 Privacy                                                  | Web: Supports                 | Web: The product itself does not ask for legal, financial, or personal data. However, it has email sending capabilities and the editor relies on platform software to provide e.g. masking of user input.


## Chapter [5: Generic Requirements](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=23) ##

Criteria                                                        | Conformance Level | Remarks and Explanations
----------------------------------------------------------------|-------------------|---------------------------------
5.1 Closed functionality                                        | Not Applicable    | 5.1.2.2-5.1.6.2 are not applicable for this product.
5.2 Activation of accessibility features                        | Not Applicable    | The product does not provide any accessibility features to be activated.
5.3 Biometrics                                                  | Not Applicable    | The product does not rely on biological characteristics.
5.4 Preservation of accessibility information during conversion | Supports          | Content generated by using the product, preserves the information required or added for accessibility.
**5.5 Operable parts**                                          |                   |
5.5.1 Means of operation                                        | Not Applicable    | The product does not have operable parts.
5.5.2 Operable parts discernibility                             | Not Applicable    | The product does not have operable parts.
**5.6 Locking or toggle controls**                              |                   |
5.6.1 Tactile or auditory status                                | Not Applicable    | The product does not have locking or toggle controls.
5.6.2 Visual status                                             | Not Applicable    | The product does not have locking or toggle controls.
5.7 Key repeat                                                  | Not Applicable    | The product relies on platform software to supply key repeat functionality.
5.8 Double-strike key acceptance                                | Not Applicable    | The product does not, by itself, supply a keyboard or keypad.
5.9 Simultaneous user actions                                   | Supports          | The product relies on platform software features, such as Sticky Keys, to ensure simultaneous user actions are not required.

## Chapter [6: ICT with Two-Way Voice Communication](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=28) ##
Notes: Not Applicable

## Chapter [7: ICT with Video Capabilities](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=31) ##
Notes: Not Applicable

## Chapter [8: Hardware](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=32) ##
Notes: Not Applicable

## Chapter [9: Web](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=39) ##
Notes: See [WCAG 2.0](#wcag-2-0-report) section

## Chapter [10: Non-web Documents](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=43) ##
Notes: Not Applicable

## Chapter [11: Software](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=53) ##
Notes: Not Applicable

## Chapter [12: Documentation and Support Services](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=73) ##
Notes:


Criteria                                                       | Conformance Level                        | Remarks and Explanations
---------------------------------------------------------------|------------------------------------------|---------------------------------
**12.1 Product documentation**                                 |                                          |
12.1.1 Accessibility and compatibility features                | TBD                                      | TBD
12.1.2 Accessible documentation                                | See [WCAG 2.x](#wcag-2-0-report) section | See information in WCAG section
**12.2 Support Services**                                      |                                          |
12.2.2 Information on accessibility and compatibility features | TBD                                      |
12.2.3 Effective communication                                 | Supports                                 | Support provided via [web](https://www.open-xchange.com/company/contact-ox/?no_cache=1) and [email](mailto:info@open-xchange.com).
12.2.4 Accessible documentation                                | See [WCAG 2.x](#wcag-2-0-report) section | See information in WCAG section


## Chapter [13: ICT Providing Relay or Emergency Service Access](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/01.01.02_60/en_301549v010102p.pdf#page=74) ##
Notes: Not Applicable

# Legal Disclaimer (Open-Xchange) #
© 2018 Open-Xchange. All rights reserved. The names of actual companies and products mentioned herein may be the trademarks of their respective owners. The information contained in this document represents the current view of Open-Xchange on the issues discussed as of the date of publication. Open-Xchange cannot guarantee the accuracy of any information presented after the date of publication. Open-Xchange regularly updates its websites with new information about the accessibility of products as that information becomes available.
Customization of the product voids this conformance statement from Open-Xchange. Customers may make independent conformance statements if they have conducted due diligence to meet all relevant requirements for their customization.
Please consult with Assistive Technology (AT) vendors for compatibility specifications of specific AT products.

Voluntary Product Accessibility Template® and VPAT® are registered trademarks of the Information Technology Industry Council (ITIC).

[1]: https://www.w3.org/TR/WCAG20/#conformance-reqs
