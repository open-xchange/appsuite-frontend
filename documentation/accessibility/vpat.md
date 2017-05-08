---
title: VPAT 1.3
description: Voluntary Product Accessibility Template (VPAT™) Version 1.3 (July 12, 2016)
---

<div class="alert alert-warning" style="max-width: 700px"><p style="color:red">This VPAT is based on release <strong>7.8.3</strong>, the revised document for our newer release <strong>7.8.4</strong> can be found here:<br>
<a href="https://documentation.open-xchange.com/7.8.4/ui/accessibility/vpat.html">https://documentation.open-xchange.com/7.8.4/ui/accessibility/vpat.html</a></p>
</div>
The purpose of the Voluntary Product Accessibility Template, or VPAT™, is to assist Federal contracting officials and other buyers in making preliminary assessments regarding the availability of commercial “Electronic and Information Technology” products and services with features that support accessibility.  It is assumed and recommended that offerers will provide additional contact information to facilitate more detailed inquiries.
The first table of the Template provides a summary view of the Section 508 Standards.  The subsequent tables provide more detailed views of each subsection.  There are three columns in each table.  Column one of the Summary Table describes the subsections of subparts B and C of the Standards.  The second column describes the supporting features of the product or refers you to the corresponding detailed table, e.g., “equivalent facilitation."  The third column contains any additional remarks and explanations regarding the product.  In the subsequent tables, the first column contains the lettered paragraphs of the subsections.  The second column describes the supporting features of the product with regard to that paragraph.  The third column contains any additional remarks and explanations regarding the product.

**Date:** May 5, 2017

**Name of product:** Open-Xchange App Suite UI (Core) 7.8.3

**Contact for more information:** <a href="mailto:info@open-xchange.com">info@open-xchange.com</a>

In the scope of this document are the core components of the web user interface (login, mail, portal, addressbook, calendar, settings, drive).

Exempt from the scope is user content e.g. HTML mails, as we can not modify user content and all modifications of core ui code.


# Summary Table
<table class="table table-striped table-bordered table-condensed accessibility">
    <thead><tr><th>Criteria</th><th>Level of Support</th><th>Remarks and explanations</th></tr></thead>
    <tbody>
        <tr>
            <td class="criterion"><a href="#section-1194-21-software-applications-and-operating-systems">Section 1194.21 Software Applications and Operating Systems</a></td>
            <td class="comments">Applicable</td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
        </tr>
        <tr>
            <td class="criterion"><a href="#section-1194-22-web-based-intranet-and-internet-information-and-applications">Section 1194.22 Web-based Intranet and Internet Information and Applications</a></td>
            <td class="comments">Applicable</td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
        </tr>
        <tr>
            <td class="criterion"><a href="#section-1194-23-telecommunications-products">Section 1194.23 Telecommunications Products</a></td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">-</td>
        </tr>
        <tr>
            <td class="criterion"><a href="#section-1194-24-video-and-multi-media-products">Section 1194.24 Video and Multi-media Products</a></td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">-</td>
        </tr>
        <tr>
            <td class="criterion"><a href="#section-1194-25-self-contained-closed-products">Section 1194.25 Self-Contained, Closed Products</a></td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">-</td>
        </tr>
        <tr>
            <td class="criterion"><a href="#section-1194-26-desktop-and-portable-computers">Section 1194.26 Desktop and Portable Computers</a></td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">-</td>
        </tr>
        <tr>
            <td class="criterion"><a href="#section-1194-31-functional-performance-criterion">Section 1194.31 Functional Performance criterion</a></td>
            <td class="comments">Applicable</td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
        </tr>
        <tr>
            <td class="criterion"><a href="#section-1194-41-information-documentation-and-support">Section 1194.41 Information, Documentation and Support</a></td>
            <td class="comments">Applicable</td>
            <td class="support supports">Supports</td>
        </tr>
    </tbody>
</table>

# Section 1194.21 Software Applications and Operating Systems
<table class="table table-striped table-bordered table-condensed accessibility">
    <thead><tr><th>Criteria</th><th>Level of Support</th><th>Remarks and explanations</th></tr></thead>
    <tbody>
        <tr>
            <td class="criterion">
                (a) When software is designed to run on a system that has a
                keyboard, product functions shall be executable from a keyboard
                where the function itself or the result of performing a function
                can be discerned textually.
            </td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
            <td class="comments"><p>
                Most of App Suite UI's core functionality is keyboard accessible, with some exceptions:
                    - Some instances of drag and drop functionality, which have no keyboard equivalents.
                    - Some instances of partial implementation of custom and standard keyboard interaction.
                    - The thumbnail index in addressbook and the cancel search button is not accessible via keyboard
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (b) Applications shall not disrupt or disable activated features
                of other products that are identified as accessibility features,
                where those features are developed and documented according to
                industry standards. Applications also shall not disrupt or
                disable activated features of any operating system that are
                identified as accessibility features where the application
                programming interface for those accessibility features has been
                documented by the manufacturer of the operating system and is
                available to the product developer.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    App Suite UI is built using modern standards and best practices where possible and does not interfere with or deactivate the accessibility features of the operating system.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (c) A well-defined on-screen indication of the current focus
                shall be provided that moves among interactive interface elements
                as the input focus changes. The focus shall be programmatically
                exposed so that Assistive Technology can track focus and focus
                changes.
            </td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
            <td class="comments">App Suite UI provides a visual indication of focus for most interactive elements, but sometimes dependant on color. See also <a href="#section-1194-22-web-based-intranet-and-internet-information-and-applications">1194.22 (c)</a>. Keyboard focus is exposed programmatically to assistive technology.</td>
        </tr>
        <tr>
            <td class="criterion">
                (d) Sufficient information about a user interface element
                including the identity, operation and state of the element shall
                be available to Assistive Technology. When an image represents a
                program element, the information conveyed by the image must also
                be available in text.
            </td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
            <td class="comments"><p>WAI-ARIA is used to expose role and state information on most elements, with some exceptions:<br>
            - In folder tree views the information conveyed to screen readers is overly verbose and sometimes the level of the current active element is misrepresented<br>
            - In some instances tooltips or aria-labels are missing from elements that are displayed as an icon
            </p></td>
        </tr>
        <tr>
            <td class="criterion">
                (e) When bitmap images are used to identify controls, status
                indicators, or other programmatic elements, the meaning assigned
                to those images shall be consistent throughout an application's
                performance.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    All iconography are rendered via the <a href=
                    "https://fontawesome.io/">Font Awesome</a> library.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (f) Textual information shall be provided through operating
                system functions for displaying text. The minimum information
                that shall be made available is text content, text input caret
                location, and text attributes.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments"><p>Textual information is available to assistive technology in App Suite UI.</p></td>
        </tr>
        <tr>
            <td class="criterion">
                (g) Applications shall not override user selected contrast and
                color selections and other individual display attributes.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    System wide contrast, font-size and other accessibility
                    preferences are respected throughout the application.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (h) When animation is displayed, the information shall be
                displayable in at least one non-animated presentation mode at the
                option of the user.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments"><p>App Suite UI has no core features that utilize animation.</p></td>
        </tr>
        <tr>
            <td class="criterion">
                (i) Color coding shall not be used as the only means of conveying
                information, indicating an action, prompting a response, or
                distinguishing a visual element.
            </td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
            <td class="comments"><p>In some cases, App Suite UI uses color to convey information, such as indicating the active app in the application launcher. See also <a href="#section-1194-22-web-based-intranet-and-internet-information-and-applications">1194.22 (c)</a></p></td>
        </tr>
        <tr>
            <td class="criterion">
                (j) When a product permits a user to adjust color and contrast
                settings, a variety of color selections capable of producing a
                range of contrast levels shall be provided.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (k) Software shall not use flashing or blinking text, objects, or
                other elements having a flash or blink frequency greater than 2
                Hz and lower than 55 Hz.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">App Suite UI does not use any flashing or blinking text, objects or other such elements that would cause screen flicker with a frequency greater than 2 Hz and lower than 55 Hz.</td>
        </tr>
        <tr>
            <td class="criterion">
                (l) When electronic forms are used, the form shall allow people
                using Assistive Technology to access the information, field
                elements, and functionality required for completion and
                submission of the form, including all directions and cues.
            </td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
            <td class="comments"><p>Most forms in App Suite UI should always have accessible form controls, with some exceptions:<br>
                - The search form does not have a visible label<br>
                - Autocompletion in tokenfield input fields is not correctly conveyed to assistive technology
            </p></td>
        </tr>
    </tbody>
</table>


# Section 1194.22 Web-based Intranet and Internet Information and Applications
<table class="table table-striped table-bordered table-condensed accessibility">
    <thead><tr><th>Criteria</th><th>Level of Support</th><th>Remarks and explanations</th></tr></thead>
    <tbody>
        <tr>
            <td class="criterion">
                (a) A text equivalent for every non-text element shall be
                provided (e.g., via 'alt', 'longdesc', or in element content).
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    All non-text navigation and functional elements are
                    accompanied by text descriptions.
                    Alternative text is available for information images and decorative images are given empty alt text.
                    All iconography are rendered via the <a href=
                    "https://fontawesome.io/">Font Awesome</a> library.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (b) Equivalent alternatives for any multimedia presentation shall
                be synchronized with the presentation.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">
                <p>
                    No multimedia presentations (other than user content or users mail content, on which we have no influence) are used.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (c) Web pages shall be designed so that all information conveyed
                with color is also available without color, for example from
                context or markup.
            </td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
            <td class="comments">
                <p>
                The state of an active app in the application launcher (top bar) and the focus of items in action menus, list views, portal tiles and dropdown menus is only indicated via an aria-label other than the change of the background color.
                In list views, list-view actions and dropdown menus the focus on items is also indicated by inverting the text color.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (d) Documents shall be organized so they are readable without
                requiring an associated style sheet.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">
                <p>
                    App Suite UI is a web-based application (not a document), and therefore the product's user interface depends on the availability of associated style sheets.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (e) Redundant text links shall be provided for each active region
                of a server-side image map.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">
                <p>
                    No server-side image maps are used.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (f) Client-side image maps shall be provided instead of
                server-side image maps except where the regions cannot be defined
                with an available geometric shape.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">
                <p>
                    No client-side image maps are used.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (g) Row and column headers shall be identified for data tables.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments"><p>Data tables are sparsly used in App Suite UI and always should have row and column headers.</p></td>
        </tr>
        <tr>
            <td class="criterion">
                (h) Markup shall be used to associate data cells and header cells
                for data tables that have two or more logical levels of row or
                column headers.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments"><p>App Suite UI does not contain data tables that have two or more logical levels of row or column headers.</p></td>
        </tr>
        <tr>
            <td class="criterion">
                (i) Frames shall be titled with text that facilitates frame
                identification and navigation
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">
                <p>No frames are used for navigation.</p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (j) Pages shall be designed to avoid causing the screen to
                flicker with a frequency greater than 2 Hz and lower than 55 Hz.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments"><p>App Suite UI does not use any flashing or blinking text, objects or other such elements that would cause screen flicker with a frequency greater than 2 Hz and lower than 55 Hz.</p></td>
        </tr>
        <tr>
            <td class="criterion">
                (k) A text-only page, with equivalent information or
                functionality, shall be provided to make a web site comply with
                the provisions of this part, when compliance cannot be
                accomplished in any other way. The content of the text-only page
                shall be updated whenever the primary page changes.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">
                <p>Accessibility provisions in App Suite UI can be provided without requiring a separate text-only version.</p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (l) When pages utilize scripting languages to display content, or
                to create interface elements, the information provided by the
                script shall be identified with functional text that can be read
                by Assistive Technology.
            </td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
            <td class="comments"><p>Most elements that utilize scripting should be correctly announced to assistive technologies, in some cases the verbosity of the output in certain screen readers needs some improvement.</p></td>
        </tr>
        <tr>
            <td class="criterion">
                (m) When a web page requires that an applet, plug-in or other
                application be present on the client system to interpret page
                content, the page must provide a link to a plug-in or applet that
                complies with 1194.21(a) through (l).
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"><p>App Suite UI's core functionality does not require that an applet, plug-in, or other application be present.</p></td>
        </tr>
        <tr>
            <td class="criterion">
                (n) When electronic forms are designed to be completed on-line,
                the form shall allow people using Assistive Technology to access
                the information, field elements, and functionality required for
                completion and submission of the form, including all directions
                and cues.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">Forms in App Suite are coded to support users of Assistive Technology.
                The forms are structured so they are read properly in a linear fashion and in a logical tab order.
                Tabbing through form fields is supported.
                Label and id tags are used to associate form elements with field labels.
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (o) A method shall be provided that permits users to skip
                repetitive navigation links.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">Albeit there are no "skip to content" links, there are several shortcuts to skip past navigation (e.g. Press F6 to cycle through regions or pressing enter on launcher sets focus on folder tree), also action menus and the folder tree have a single tab stop, so it can also be quickly skipped with tab. App Suite UI also contains landmark roles to allow for quick navigation when accessed with a screen reader.</td>
        </tr>
        <tr>
            <td class="criterion">
                (p) When a timed response is required, the user shall be alerted
                and given sufficient time to indicate more time is required.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">
                <p>
                    No timed responses are required.
                </p>
            </td>
        </tr>
    </tbody>
</table>

<blockquote style="max-width:100%"><strong>Note to Section 1194.22:</strong> The Board interprets paragraphs (a) through (k) of this section as consistent with the following Priority 1 checkpoints of the Web Content Accessibility Guidelines 1.0 (WCAG 1.0) (May 5, 1999) published by the Web Accessibility Initiative of the World Wide Web Consortium: Paragraph (a) – 1.1, (b) – 1.4, (c) – 2.1, (d) – 6.1, (e) – 1.2, (f) – 9.1, (g) – 5.1, (h) – 5.2, (i) – 12.1, (j) – 7.1, (k) – 11.4.</blockquote>

# Section 1194.23 Telecommunications Products
<table class="table table-striped table-bordered table-condensed accessibility">
    <thead><tr><th>Criteria</th><th>Level of Support</th><th>Remarks and explanations</th></tr></thead>
    <tbody>
        <tr>
            <td class="criterion">
                (a) Telecommunications products or systems which provide a
                function allowing voice communication and which do not themselves
                provide a TTY functionality shall provide a standard non-acoustic
                connection point for TTYs. Microphones shall be capable of being
                turned on and off to allow the user to intermix speech with TTY
                use.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (b) Telecommunications products which include voice communication
                functionality shall support all commonly used cross-manufacturer
                non-proprietary standard TTY signal protocols.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (c) Voice mail, auto-attendant, and interactive voice response
                telecommunications systems shall be usable by TTY users with
                their TTYs.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (d) Voice mail, messaging, auto-attendant, and interactive voice
                response telecommunications systems that require a response from
                a user within a time interval, shall give an alert when the time
                interval is about to run out, and shall provide sufficient time
                for the user to indicate more time is required.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (e) Where provided, caller identification and similar
                telecommunications functions shall also be available for users of
                TTYs, and for users who cannot see displays.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (f) For transmitted voice signals, telecommunications products
                shall provide a gain adjustable up to a minimum of 20 dB. For
                incremental volume control, at least one intermediate step of 12
                dB of gain shall be provided.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (g) If the telecommunications product allows a user to adjust the
                receive volume, a function shall be provided to automatically
                reset the volume to the default level after every use.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (h) Where a telecommunications product delivers output by an
                audio transducer which is normally held up to the ear, a means
                for effective magnetic wireless coupling to hearing technologies
                shall be provided.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (i) Interference to hearing technologies (including hearing aids,
                cochlear implants, and assistive listening devices) shall be
                reduced to the lowest possible level that allows a user of
                hearing technologies to utilize the telecommunications product.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (j) Products that transmit or conduct information or
                communication, shall pass through cross-manufacturer,
                non-proprietary, industry-standard codes, translation protocols,
                formats or other information necessary to provide the information
                or communication in a usable format. Technologies which use
                encoding, signal compression, format transformation, or similar
                techniques shall not remove information needed for access or
                shall restore it upon delivery.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (k)(1) Products which have mechanically operated controls or keys
                shall comply with the following: Controls and Keys shall be
                tactilely discernible without activating the controls or keys.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (k)(2) Products which have mechanically operated controls or keys
                shall comply with the following: Controls and Keys shall be
                operable with one hand and shall not require tight grasping,
                pinching, twisting of the wrist. The force required to activate
                controls and keys shall be 5 lbs. (22.2N) maximum.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (k)(3) Products which have mechanically operated controls or keys
                shall comply with the following: If key repeat is supported, the
                delay before repeat shall be adjustable to at least 2 seconds.
                Key repeat rate shall be adjustable to 2 seconds per character.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (k)(4) Products which have mechanically operated controls or keys
                shall comply with the following: The status of all locking or
                toggle controls or keys shall be visually discernible, and
                discernible either through touch or sound.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
    </tbody>
</table>

# Section 1194.24 Video and Multi-media Products
<table class="table table-striped table-bordered table-condensed accessibility">
    <thead><tr><th>Criteria</th><th>Level of Support</th><th>Remarks and explanations</th></tr></thead>
    <tbody>
        <tr>
            <td class="criterion">
                (a) All analog television displays 13 inches and larger, and
                computer equipment that includes analog television receiver or
                display circuitry, shall be equipped with caption decoder
                circuitry which appropriately receives, decodes, and displays
                closed captions from broadcast, cable, videotape, and DVD
                signals. As soon as practicable, but not later than July 1, 2002,
                widescreen digital television (DTV) displays measuring at least
                7.8 inches vertically, DTV sets with conventional displays
                measuring at least 13 inches vertically, and stand-alone DTV
                tuners, whether or not they are marketed with display screens,
                and computer equipment that includes DTV receiver or display
                circuitry, shall be equipped with caption decoder circuitry which
                appropriately receives, decodes, and displays closed captions
                from broadcast, cable, videotape, and DVD signals.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (b) Television tuners, including tuner cards for use in
                computers, shall be equipped with secondary audio program
                playback circuitry.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (c) All training and informational video and multimedia
                productions which support the agency's mission, regardless of
                format, that contain speech or other audio information necessary
                for the comprehension of the content, shall be open or closed
                captioned.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">Any video content created by Open-Xchange is not part of the product.</td>
        </tr>
        <tr>
            <td class="criterion">
                (d) All training and informational video and multimedia
                productions which support the agency's mission, regardless of
                format, that contain visual information necessary for the
                comprehension of the content, shall be audio described.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments">Currently, training and tutorial content does not have additional visual information necessary for comprehension.</td>
        </tr>
        <tr>
            <td class="criterion">
                (e) Display or presentation of alternate text presentation or
                audio descriptions shall be user-selectable unless permanent.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
    </tbody>
</table>

# Section 1194.25 Self-Contained, Closed Products
<table class="table table-striped table-bordered table-condensed accessibility">
    <thead><tr><th>Criteria</th><th>Level of Support</th><th>Remarks and explanations</th></tr></thead>
    <tbody>
        <tr>
            <td class="criterion">
                (a) Self contained products shall be usable by people with
                disabilities without requiring an end-user to attach Assistive
                Technology to the product. Personal headsets for private
                listening are not Assistive Technology.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (b) When a timed response is required, the user shall be alerted
                and given sufficient time to indicate more time is required.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (c) Where a product utilizes touch screens or contact-sensitive
                controls, an input method shall be provided that complies with
                1194.23 (k) (1) through (4).
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (d) When biometric forms of user identification or control are
                used, an alternative form of identification or activation, which
                does not require the user to possess particular biological
                characteristics, shall also be provided.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (e) When products provide auditory output, the audio signal shall
                be provided at a standard signal level through an industry
                standard connector that will allow for private listening. The
                product must provide the ability to interrupt, pause, and restart
                the audio at anytime.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (f) When products deliver voice output in a public area,
                incremental volume control shall be provided with output
                amplification up to a level of at least 65 dB. Where the ambient
                noise level of the environment is above 45 dB, a volume gain of
                at least 20 dB above the ambient level shall be user selectable.
                A function shall be provided to automatically reset the volume to
                the default level after every use.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (g) Color coding shall not be used as the only means of conveying
                information, indicating an action, prompting a response, or
                distinguishing a visual element.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (h) When a product permits a user to adjust color and contrast
                settings, a range of color selections capable of producing a
                variety of contrast levels shall be provided.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (i) Products shall be designed to avoid causing the screen to
                flicker with a frequency greater than 2 Hz and lower than 55 Hz.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (j)(1) Products which are freestanding, non-portable, and
                intended to be used in one location and which have operable
                controls shall comply with the following: The position of any
                operable control shall be determined with respect to a vertical
                plane, which is 48 inches in length, centered on the operable
                control, and at the maximum protrusion of the product within the
                48 inch length on products which are freestanding, non-portable,
                and intended to be used in one location and which have operable
                controls.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (j)(2) Products which are freestanding, non-portable, and
                intended to be used in one location and which have operable
                controls shall comply with the following: Where any operable
                control is 10 inches or less behind the reference plane, the
                height shall be 54 inches maximum and 15 inches minimum above the
                floor.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (j)(3) Products which are freestanding, non-portable, and
                intended to be used in one location and which have operable
                controls shall comply with the following: Where any operable
                control is more than 10 inches and not more than 24 inches behind
                the reference plane, the height shall be 46 inches maximum and 15
                inches minimum above the floor.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (j)(4) Products which are freestanding, non-portable, and
                intended to be used in one location and which have operable
                controls shall comply with the following: Operable controls shall
                not be more than 24 inches behind the reference plane.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
    </tbody>
</table>

# Section 1194.26 Desktop and Portable Computers
<table class="table table-striped table-bordered table-condensed accessibility">
    <thead><tr><th>Criteria</th><th>Level of Support</th><th>Remarks and explanations</th></tr></thead>
    <tbody>
        <tr>
            <td class="criterion">
                (a) All mechanically operated controls and keys shall comply with
                1194.23 (k) (1) through (4).
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (b) If a product utilizes touchscreens or touch-operated
                controls, an input method shall be provided that complies with
                1194.23 (k) (1) through (4).
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (c) When biometric forms of user identification or control are
                used, an alternative form of identification or activation, which
                does not require the user to possess particular biological
                characteristics, shall also be provided.
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
        <tr>
            <td class="criterion">
                (d) Where provided, at least one of each type of expansion slots,
                ports and connectors shall comply with publicly available
                industry standards
            </td>
            <td class="support not-applicable">Not applicable</td>
            <td class="comments"></td>
        </tr>
    </tbody>
</table>

# Section 1194.31 Functional Performance criterion
<table class="table table-striped table-bordered table-condensed accessibility">
    <thead><tr><th>Criteria</th><th>Level of Support</th><th>Remarks and explanations</th></tr></thead>
    <tbody>
        <tr>
            <td class="criterion">
                (a) At least one mode of operation and information retrieval that
                does not require user vision shall be provided, or support for
                Assistive Technology used by people who are blind or visually
                impaired shall be provided.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">App Suite allows the use of assistive technology (e.g. screen readers) by people who are blind or visually impaired.</td>
        </tr>
        <tr>
            <td class="criterion">
                (b) At least one mode of operation and information retrieval that
                does not require visual acuity greater than 20/70 shall be
                provided in audio and enlarged print output working together or
                independently, or support for Assistive Technology used by people
                who are visually impaired shall be provided.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    App Suite UI supports the use of assistive technology
                    and provide the ability, through the user&rsquo;s web browser
                    or operating system to increase the font size or the use of screen magnifiers.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (c) At least one mode of operation and information retrieval that
                does not require user hearing shall be provided, or support for
                Assistive Technology used by people who are deaf or hard of
                hearing shall be provided
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    App Suite UI does not use auditory feedback.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (d) Where audio information is important for the use of a
                product, at least one mode of operation and information retrieval
                shall be provided in an enhanced auditory fashion, or support for
                assistive hearing devices shall be provided.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    App Suite UI does not rely on audio to present information.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (e) At least one mode of operation and information retrieval that
                does not require user speech shall be provided, or support for
                Assistive Technology used by people with disabilities shall be
                provided.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    App Suite UI does not require user speech.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (f) At least one mode of operation and information retrieval that
                does not require fine motor control or simultaneous actions and
                that is operable with limited reach and strength shall be
                provided.
            </td>
            <td class="support supports-with-exceptions">Supports with exceptions</td>
            <td class="comments">
                <p>
                    No interactions require simultaneous user actions or depend
                    solely on fine motor controls. A few elements, such as dialog close (x) buttons, may have smaller
                    targets that are suboptimal for users with mobility impairments.
                </p>
            </td>
        </tr>
    </tbody>
</table>

# Section 1194.41 Information, Documentation and Support
<table class="table table-striped table-bordered table-condensed accessibility">
    <thead><tr><th>Criteria</th><th>Level of Support</th><th>Remarks and explanations</th></tr></thead>
    <tbody>
        <tr>
            <td class="criterion">
                (a) Product support documentation provided to end-users shall be
                made available in alternate formats upon request, at no
                additional charge
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    Please contact <a href=
                    "mailto:info@open-xchange.com">info@open-xchange.com</a> with any
                    such requests.
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (b) End-users shall have access to a description of the
                accessibility and compatibility features of products in alternate
                formats or alternate methods upon request, at no additional
                charge.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    Documentation available at <a href=
                    "https://documentation.open-xchange.com/">documentation.open-xchange.com</a>
                </p>
            </td>
        </tr>
        <tr>
            <td class="criterion">
                (c) Support services for products shall accommodate the
                communication needs of end-users with disabilities.
            </td>
            <td class="support supports">Supports</td>
            <td class="comments">
                <p>
                    Support provided via <a href=
                    "https://www.open-xchange.com/company/contact-ox/?no_cache=1">web</a> and <a href=
                    "mailto:info@open-xchange.com">email</a>
                </p>
            </td>
        </tr>
    </tbody>
</table>
