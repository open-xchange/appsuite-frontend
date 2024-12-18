## [7.10.6-49]

### Fixed

- Appointments wrongly added to all my public appointments calendar ([`OXUIB-2392`](https://jira.open-xchange.com/browse/OXUIB-2392)) [`82092a5`](https://gitlab.open-xchange.com/frontend/core/commit/82092a57e01a608ae63c4c1d994fcee638515395)
- Implement improved appointment exception check ([`OXUIB-1090`](https://jira.open-xchange.com/browse/OXUIB-1090)) [`a2f90004`](https://gitlab.open-xchange.com/frontend/core/commit/a2f9000492b5f46a0be2b55241f2f8fbbdb7b8b1)
- Quick launchers max count respects specifies custom quick launchers (appsuite/web-apps/ui#643) [`c8034558`](https://gitlab.open-xchange.com/frontend/core/commit/c80345588c7bab6063cda1415ec80b3e77cfa0e1)

## [7.10.6-48]

### Changed

- Enhance support for multi-level colored block quotes in mail detail [`f2924b7`](https://gitlab.open-xchange.com/frontend/core/commit/f2924b7ac82facad3aa8f0e2fedbe0a0f0eb1d98)

### Fixed

- Address Book: Clarify input field labels for screen readers to distinguish between katakana and hiragana (WCAG 2.1 3.3.2) [`c82d25b`](https://gitlab.open-xchange.com/frontend/core/commit/c82d25be5625d5be287bdc0315bb66f9fd3716c7)
- [`OXUIB-1110`](https://jira.open-xchange.com/browse/OXUIB-1110) - With a moderate connection App Suite 8.0 (on ASD) starts a endless loop during boot [`fee6124`](https://gitlab.open-xchange.com/frontend/core/commit/fee612461969e1ccbd56e350dd734e21a275709d)
- Mail quota counts attachments size during upload correctly [`c45e002`](https://gitlab.open-xchange.com/frontend/core/commit/c45e0027bd39ab556a6ef2c196de784d4eda6965)
- a11y: HTML section headings adjusted in address book [`10935a7`](https://gitlab.open-xchange.com/frontend/core/commit/10935a795b462bdcdf824c9c100a5c9ac86c0527)
- Ensure multiline values of imported contacts are retained during edit [`0f839c3`](https://gitlab.open-xchange.com/frontend/core/commit/0f839c377574151d3231d832e5424aa1f19315bb)

## [7.10.6-47]

### Deprecated

- Outdated and unused code from `io.ox/messaging` [`bcc9fcb`](https://gitlab.open-xchange.com/frontend/core/commit/bcc9fcb2a3aab8da5530e52cb5b34a0c541ad4ca)

### Fixed

- Add missing labels to the signature edit dialog [`17ea1b5`](https://gitlab.open-xchange.com/frontend/core/commit/17ea1b57e20d94bd835942c27fa537c1fc1af8b8)

## [7.10.6-46]

### Fixed

- Missing radio to enable default signature on iOS 17. device [`8059745`](https://gitlab.open-xchange.com/frontend/core/commit/8059745170ecb03453d5bdf4e2c226a16c9ae90d)
- drive share can not be removed for all users using 'remove share button' [`ebc53e7`](https://gitlab.open-xchange.com/frontend/core/commit/ebc53e720cc88c34a58527dd20185b8130394791)

## [7.10.6-45]

### Fixed

- Issue 372: xss via pdf [`816397a`](https://gitlab.open-xchange.com/frontend/core/commit/816397a07320de91aa8007d711114b40e9597556)

## [7.10.6-44]

### Fixed

- QR code not generated when using "connecting your device" [`a06ffe0`](https://gitlab.open-xchange.com/frontend/core/commit/a06ffe07b1d460da0103b4c4103300d8320a99f2)
- Bypassing anti-tracking through external images in plain text mails [`f853986`](https://gitlab.open-xchange.com/frontend/core/commit/f853986d3e7cab7a6592ae5a840cfb196d81a384)
- [`OXUIB-2713`](https://jira.open-xchange.com/browse/OXUIB-2713): Appointment details stay open after selecting other calendar week [`1525663`](https://gitlab.open-xchange.com/frontend/core/commit/1525663a7bfdb42aa3787a7968f10fa3b0003ec1)
- Fix unpackaged files error on RHEL7 [`51a5024`](https://gitlab.open-xchange.com/frontend/core/commit/51a50249734c16a3adc96b986a997d312d8e9494)
- Fix unpackaged files error on RHEL7 [`a234836`](https://gitlab.open-xchange.com/frontend/core/commit/a23483676f07f4efdc2e5b68b04033be466520eb)
- Plain text mail with inline image contains broken link in mail content [`05a834e`](https://gitlab.open-xchange.com/frontend/core/commit/05a834e3b5c27e06f304ddbd16b3927495070794)

## [7.10.6-43]

### Added

- [`OXUIB-2635`](https://jira.open-xchange.com/browse/OXUIB-2635): Automatically select top suggestion in to/cc/bcc on enter [`8e4a16d`](https://gitlab.open-xchange.com/frontend/core/commit/8e4a16dfaf8114a1fe5dbc7b6fa9ab740abe3289)

### Removed

- Remove debug infos [`6a4f555`](https://gitlab.open-xchange.com/frontend/core/commit/6a4f555ce20d61c5ffd93efb9bafcc988117ee98)

### Fixed

- [`OXUIB-2741`](https://jira.open-xchange.com/browse/OXUIB-2741): Translation issue Italiaonlinespa [`578dc39`](https://gitlab.open-xchange.com/frontend/core/commit/578dc393a544fccbc27e2169c01751a47a6878bf)
- [`OXUIB-2718`](https://jira.open-xchange.com/browse/OXUIB-2718): XSS using arbitrary relative path to UI module [`fa61fe3`](https://gitlab.open-xchange.com/frontend/core/commit/fa61fe306961488afa96aeb9cae848dc7a952abb)
- [`OXUIB-2756`](https://jira.open-xchange.com/browse/OXUIB-2756): Wrong calendar week when scheduling an appointment (U.S. language setting) [`c88e0a2`](https://gitlab.open-xchange.com/frontend/core/commit/c88e0a24e2e413a94e01b5e09f04289b0ac3df8e)

## [7.10.6-42]

### Fixed

- [`OXUIB-2615`](https://jira.open-xchange.com/browse/OXUIB-2615): Invalid dates allowed for search [`b5c6626`](https://gitlab.open-xchange.com/frontend/core/commit/b5c6626acdf345cb81369f8b23affead5ebef8e0)
- [`OXUIB-2726`](https://jira.open-xchange.com/browse/OXUIB-2726): Checkquota not counting attachments in progress [`2b32649`](https://gitlab.open-xchange.com/frontend/core/commit/2b32649a38b040b94afb32145d775acc0d7a7211)
- [`OXUIB-2720`](https://jira.open-xchange.com/browse/OXUIB-2720): Sometimes images split to multiple pages when printing [`4d850b8`](https://gitlab.open-xchange.com/frontend/core/commit/4d850b8679f7f1b5cf6d1d75f933f86df42042c6)

### Security

- #87: XSS - Filter data attributes when sanitizing [`9b8bd2b`](https://gitlab.open-xchange.com/frontend/core/commit/9b8bd2bffee6a2e02690b87b1e3e048300ee0470)

## [7.10.6-41]

### Fixed

- [`OXUIB-2480`](https://jira.open-xchange.com/browse/OXUIB-2480): Action buttons in contact detail view [`7a93b90`](https://gitlab.open-xchange.com/frontend/core/commit/7a93b90ed6603e6f5cb1ced07304c0bdf76bdc2e)
    - moved action buttons extension points to contact detail view
    - prevent switchboard from initiating a socket without the capability
  (cherry picked from commit 5c11cd8a7a65367d776e12627b959bccebc90d7e)
- [`OXUIB-2663`](https://jira.open-xchange.com/browse/OXUIB-2663): XSS using data- attributes at upsell ads [`374e584`](https://gitlab.open-xchange.com/frontend/core/commit/374e58486785a11a2d05efacc3bb4c6f947a8cc8)
- [`OXUIB-2650`](https://jira.open-xchange.com/browse/OXUIB-2650): Sharing options of personal address book disabled [`2c81bd2`](https://gitlab.open-xchange.com/frontend/core/commit/2c81bd2d34e6769f5f5ac9c958f3e6ff5a37975c)
- [`OXUIB-2693`](https://jira.open-xchange.com/browse/OXUIB-2693): Context/User level logout location config. [`af77423`](https://gitlab.open-xchange.com/frontend/core/commit/af77423a0d5ff04edf78f2158e678166b0f0cbf5)
- [`OXUIB-2704`](https://jira.open-xchange.com/browse/OXUIB-2704): Missing contact in compose auto-complete [`5ea2d45`](https://gitlab.open-xchange.com/frontend/core/commit/5ea2d450db7de5fba47e888ec8e111079c4cbfbf)

### Security

- Update different dependencies [`a6ac16a`](https://gitlab.open-xchange.com/frontend/core/commit/a6ac16ac2c87d5d69f455d4d4bf289801b80282b)
- [`OXUIB-2660`](https://jira.open-xchange.com/browse/OXUIB-2660): XSS for RSS content using `data` attributes [`2cee895`](https://gitlab.open-xchange.com/frontend/core/commit/2cee8955cea98b32a5b953750a8cdd0cbfa9f188)
- [`OXUIB-2688`](https://jira.open-xchange.com/browse/OXUIB-2688): XSS using "data" attributes at upsell shop [`56bae6d`](https://gitlab.open-xchange.com/frontend/core/commit/56bae6da20f14a4e6e5f10d5deb26e8c78e78b54)
- [`OXUIB-2689`](https://jira.open-xchange.com/browse/OXUIB-2689): XSS using tasks "original mail" references [`0a41858`](https://gitlab.open-xchange.com/frontend/core/commit/0a418589f36085e0901f5124aca1993f7e2e579a)

## [7.10.6-40]

### Changed

- increase timeout for upload ci job [`805b238`](https://gitlab.open-xchange.com/frontend/core/commit/805b2389a809d71ab0ce617e46856eb00ed8518a)

### Fixed

- [`OXUIB-2678`](https://jira.open-xchange.com/browse/OXUIB-2678): No tooltip in mail compose toolbar items [`826ba63`](https://gitlab.open-xchange.com/frontend/core/commit/826ba63f4781e1d24c1a2dcc6cb03b86cdb55e06)
- [`OXUIB-2558`](https://jira.open-xchange.com/browse/OXUIB-2558): Selected folder label stays truncated after folder pane enlarged [`92b5c3e`](https://gitlab.open-xchange.com/frontend/core/commit/92b5c3e177a233b49dcc3f4ca54eee8b7bd4af79)
- [`OXUIB-2649`](https://jira.open-xchange.com/browse/OXUIB-2649): L3 Select button active by default in Contact Picker [`5c14d10`](https://gitlab.open-xchange.com/frontend/core/commit/5c14d1023fd816c54da287f968b9fe21098a0c19)
- [`OXUIB-2492`](https://jira.open-xchange.com/browse/OXUIB-2492): Missing list view controls in calendar [`1b14b94`](https://gitlab.open-xchange.com/frontend/core/commit/1b14b94ceef199a806d33835dfd803a9cf13e5e3)

## [7.10.6-39]

### Fixed

- [`OXUIB-2599`](https://jira.open-xchange.com/browse/OXUIB-2599): XSS using script code as module at app loader [`6ede481`](https://gitlab.open-xchange.com/frontend/core/commit/6ede48175c8a1c094e39087ccd144db365404422)

## [7.10.6-38]

### Fixed

- [`OXUIB-2564`](https://jira.open-xchange.com/browse/OXUIB-2564): Contact floating window does not update after move [`c32cb3c`](https://gitlab.open-xchange.com/frontend/core/commit/c32cb3c71b773e56e6cc5cc4308858f7a962c92a)
- [`OXUIB-2552`](https://jira.open-xchange.com/browse/OXUIB-2552): Reply not possible for mails with embedded image/svg+xml images [`e4b0a26`](https://gitlab.open-xchange.com/frontend/core/commit/e4b0a26dba714f9eee6d17aa3942188017b6bcfb)
- Fix empty breadcrumb for contact detail app [`bdee041`](https://gitlab.open-xchange.com/frontend/core/commit/bdee041900addb68868dc8463efc515416eea91d)

## [7.10.6-37]

### Fixed

- [`OXUI-1241`](https://jira.open-xchange.com/browse/OXUI-1241): Defect: Cannot open properties [`8748974`](https://gitlab.open-xchange.com/frontend/core/commit/874897477a7346f138ed66ecaee4c489be643c24)

## [7.10.6-36]

### Added

- Add RHEL8 [`9f19c49`](https://gitlab.open-xchange.com/frontend/core/commit/9f19c4943ecb561a2ec266b261604f0aadf9a8dc)
- Additional commit [`OXUIB-2523`](https://jira.open-xchange.com/browse/OXUIB-2523) [`efe84c3`](https://gitlab.open-xchange.com/frontend/core/commit/efe84c3e5c1d116b8de98b33deada8c4d1b14a28)

### Fixed

- [`OXUIB-2483`](https://jira.open-xchange.com/browse/OXUIB-2483): Disabled account dropdown breaks "Getting started" guided tours [`d04e044`](https://gitlab.open-xchange.com/frontend/core/commit/d04e044ac58da4765ffbcdd61edecafc35712fe5)
- [`OXUIB-2523`](https://jira.open-xchange.com/browse/OXUIB-2523) Text in calendar module cut off [`3abdc66`](https://gitlab.open-xchange.com/frontend/core/commit/3abdc664ccb9c361d583bcc635b093425dd4070a)

## [7.10.6-35]

### Fixed

- [`OXUIB-2533`](https://jira.open-xchange.com/browse/OXUIB-2533): XSS in upsell portal widget (shop URL) [`381e008`](https://gitlab.open-xchange.com/frontend/core/commit/381e0081b76498e903c467da8431ba44363e859c)
- [`OXUIB-2532`](https://jira.open-xchange.com/browse/OXUIB-2532): XSS in upsell portal widget (shop disclaimer) [`cee97aa`](https://gitlab.open-xchange.com/frontend/core/commit/cee97aa8544663baff4c94d38a4234534d00619e)
- [`OXUIB-2489`](https://jira.open-xchange.com/browse/OXUIB-2489): Reopen: XSS in upsell portal widget [`722628c`](https://gitlab.open-xchange.com/frontend/core/commit/722628ce97f9626245edc01f07e7f0b7afb12ae5)

## [7.10.6-34]

### Security

- [`OXUIB-2489`](https://jira.open-xchange.com/browse/OXUIB-2489): XSS in upsell portal widget [`03fc897`](https://gitlab.open-xchange.com/frontend/core/commit/03fc8978e5b6b115af5ff85bf9d4d349e801aa08)

## [7.10.6-33]

### Changed

- [`OXUIB-2366`](https://jira.open-xchange.com/browse/OXUIB-2366): A "Discard draft" within mail compose should bypasses the trash in all cases [`ada225b`](https://gitlab.open-xchange.com/frontend/core/commit/ada225b80f0ac32158ddd9615d43c2465e71b9f6)

### Removed

- [`OXUI-1310`](https://jira.open-xchange.com/browse/OXUI-1310): Twitter integration [`6aa8b58`](https://gitlab.open-xchange.com/frontend/core/commit/6aa8b58e988b7606e6d3cc6a46b4fcf1f0f9c976)

### Fixed

- [`OXUIB-2456`](https://jira.open-xchange.com/browse/OXUIB-2456): Portal plugin provisioning incompatible with older versions [`acab771`](https://gitlab.open-xchange.com/frontend/core/commit/acab771ce5418461363fd1f28fd6523c232cf685)
- [`OXUIB-2460`](https://jira.open-xchange.com/browse/OXUIB-2460): virtual folder "Unread/Unseen" does not show mails [`b7b0263`](https://gitlab.open-xchange.com/frontend/core/commit/b7b0263e664104bbb3cb8e3df577c168cc4b3a93)
- [`OXUIB-2454`](https://jira.open-xchange.com/browse/OXUIB-2454): Mail compose does not handle password option for Drive mails correctly [`6f36126`](https://gitlab.open-xchange.com/frontend/core/commit/6f3612650ebd6cd57fafa62d644bc503c07e05bf)
- Reopen: [`OXUIB-2403`](https://jira.open-xchange.com/browse/OXUIB-2403): Mail content not shown if mail css is not properly commented out [`6cb2674`](https://gitlab.open-xchange.com/frontend/core/commit/6cb2674122511edacac3cc0c9c21069850191043)

### Security

- Update underscore to `1.13.6` [`76c4ba2`](https://gitlab.open-xchange.com/frontend/core/commit/76c4ba2d746439d27d3be2ca9ab8ca023ff309c4)

## [7.10.6-32]

### Fixed

- [`OXUIB-2403`](https://jira.open-xchange.com/browse/OXUIB-2403) Mail content not shown if mail css is not properly commented out [`f78f04d`](https://gitlab.open-xchange.com/frontend/core/commit/f78f04de3565291411e7dfc100c51df3baca8786)

## [7.10.6-31]

### Fixed

- Cannot customize launcher icons [`14bae8c`](https://gitlab.open-xchange.com/frontend/core/commit/14bae8c27e32a6c2f1a6c1c140c4979d2205a226)

## [7.10.6-30]

### Fixed

- [`OXUIB-2375`](https://jira.open-xchange.com/browse/OXUIB-2375): Appointments over multiple days not displayed correctly in mobile month view [`051ccdb`](https://gitlab.open-xchange.com/frontend/core/commit/051ccdb7379faa356cb67c9a16d42a990f1a55cf)

### Security

- [`OXUIB-2285`](https://jira.open-xchange.com/browse/OXUIB-2285): XSS via user-defined login/logout URL [`5c4b128`](https://gitlab.open-xchange.com/frontend/core/commit/5c4b1282b0c830f6520e36b13db08d8e6e4f5770)

## [7.10.6-29]

### Fixed

- [`OXUIB-2065`](https://jira.open-xchange.com/browse/OXUIB-2065): runtime error if vacationDomains configured in vacation rule [`471b5b0`](https://gitlab.open-xchange.com/frontend/core/commit/471b5b033d2ccccb7acc34a8d3b930bacac1cb61)
- [`OXUIB-2322`](https://jira.open-xchange.com/browse/OXUIB-2322): Timezone wrong for Mexico City [`44346ef`](https://gitlab.open-xchange.com/frontend/core/commit/44346efd29f6f2a5bc2880a95ffbe885c86898f2)

### Security

- [`OXUIB-2285`](https://jira.open-xchange.com/browse/OXUIB-2285): XSS via user-defined login/logout URL [`31c26be`](https://gitlab.open-xchange.com/frontend/core/commit/31c26beab22872a14b9ded7908efcae6438be25e)

## [7.10.6-28]

### Fixed

- [`OXUIB-2228`](https://jira.open-xchange.com/browse/OXUIB-2228): Move/Copy dialog in Drive does not scroll horizontally for long folder paths [`70e108a`](https://gitlab.open-xchange.com/frontend/core/commit/70e108aa168adae826984069fbedf1e4df757e9c)
- Fixup: Security: [`OXUIB-2282`](https://jira.open-xchange.com/browse/OXUIB-2282): Themes can be abused to inject script code for persistent XSS [`c8a9514`](https://gitlab.open-xchange.com/frontend/core/commit/c8a9514a5c43f2d3c95debaeef5608c8c7612ab0)
- [`OXUIB-2301`](https://jira.open-xchange.com/browse/OXUIB-2301): No file upload for Firefox browser under Android [`d25077c`](https://gitlab.open-xchange.com/frontend/core/commit/d25077c34689e5d8c4e00810f99b2012850308e6)
- [`OXUIB-2287`](https://jira.open-xchange.com/browse/OXUIB-2287): XSS using malicious Count service resource [`43fab37`](https://gitlab.open-xchange.com/frontend/core/commit/43fab374dbef9a1ae4918708c66e82c0843aab32)

### Security

- [`OXUIB-2285`](https://jira.open-xchange.com/browse/OXUIB-2285): XSS via user-defined login/logout URL [`d4af8fb`](https://gitlab.open-xchange.com/frontend/core/commit/d4af8fb1e6554d3057ddafc37d125f38c8feaf9d)
- [`OXUIB-2282`](https://jira.open-xchange.com/browse/OXUIB-2282): Themes can be abused to inject script code for persistent XSS [`90a7941`](https://gitlab.open-xchange.com/frontend/core/commit/90a794190d70b1ecee4a8f62d7241564f0c4a511)
- [`OXUIB-2284`](https://jira.open-xchange.com/browse/OXUIB-2284): XSS in upsell portal widget [`2de2cf7`](https://gitlab.open-xchange.com/frontend/core/commit/2de2cf775144ef7b2a0a2cdbeb9642f7a697be34)
- [`OXUIB-2286`](https://jira.open-xchange.com/browse/OXUIB-2286): XSS from missing content type check in chat [`a87e9a9`](https://gitlab.open-xchange.com/frontend/core/commit/a87e9a95f70a0e5a57f3d80c7ab9527227e0694d)
- [`OXUIB-2283`](https://jira.open-xchange.com/browse/OXUIB-2283): XSS using app passwords lastDevice property [`dd47cf0`](https://gitlab.open-xchange.com/frontend/core/commit/dd47cf0c94a52e0ebd0fe2378b5cc83a05e9bd4a)

## [7.10.6-27]

### Fixed

- [`OXUIB-2065`](https://jira.open-xchange.com/browse/OXUIB-2065): runtime error if vacationDomains configured in vacation rule [`4952e48`](https://gitlab.open-xchange.com/frontend/core/commit/4952e487347f9b7a66aab46b3da5aaea38faf970)
- OXUIB 2290: Remove OX Mail App entry from Connect your device wizard [`4152f5d`](https://gitlab.open-xchange.com/frontend/core/commit/4152f5da242042ff78caf47f2ac71b3b4318d8c5)
- [`OXUIB-2181`](https://jira.open-xchange.com/browse/OXUIB-2181): Moving files or folders for guests users not possible [`a2a420a`](https://gitlab.open-xchange.com/frontend/core/commit/a2a420a63cbe37c09feb66fdf2b189bf845b2f5d)

## [7.10.6-26]

### Fixed

- [`OXUIB-2166`](https://jira.open-xchange.com/browse/OXUIB-2166): Calendar event becomes grey after it is edited by someone else [`ff86f2a`](https://gitlab.open-xchange.com/frontend/core/commit/ff86f2a07a03d28e6118905a93126ed49ced4710)
- [`OXUIB-1525`](https://jira.open-xchange.com/browse/OXUIB-1525): Dav sync button clickable for subscribed shared task folder [`d39b5f2`](https://gitlab.open-xchange.com/frontend/core/commit/d39b5f21c363ae222436e01e675a6e4aef6c69a2)
- [`OXUIB-2176`](https://jira.open-xchange.com/browse/OXUIB-2176): Mobile. Changing app from Mail to Drive breaks toolbar in Drive [`ee31898`](https://gitlab.open-xchange.com/frontend/core/commit/ee318983f7785280b2642ebae8db25bf23625f5a)
- [`OXUIB-2233`](https://jira.open-xchange.com/browse/OXUIB-2233): Remote resources are loaded in print view on multi selection [`b8eec54`](https://gitlab.open-xchange.com/frontend/core/commit/b8eec5458543b2e39e7dd6b4a97129e07db659d1)
- [`OXUIB-2157`](https://jira.open-xchange.com/browse/OXUIB-2157): Email body not fully shown sometimes [`4d9d74d`](https://gitlab.open-xchange.com/frontend/core/commit/4d9d74d51caffe23677ba6db42303ffdab32476a)

## [7.10.6-25]

### Removed

- removed codecept and puppeteer from package.json [`5ca2b7d`](https://gitlab.open-xchange.com/frontend/core/commit/5ca2b7d9a9a015ee39d15c904cec17847ee2975e)

### Fixed

- Fix eslint [`bcc357c`](https://gitlab.open-xchange.com/frontend/core/commit/bcc357cad84646880e9d9e7d97856642f47ff857)
- [`OXUIB-2145`](https://jira.open-xchange.com/browse/OXUIB-2145): Tokenfield length and offset get wrong calculated [`8812d22`](https://gitlab.open-xchange.com/frontend/core/commit/8812d22a3cf1d7865f5e7a73151c0da12094393a)
- [`OXUIB-2164`](https://jira.open-xchange.com/browse/OXUIB-2164): Irregular sorting display within Drive folders [`414203c`](https://gitlab.open-xchange.com/frontend/core/commit/414203cf1ef9d1a9ecd5e521e5448a660c0ae391)
- Fix [`OXUIB-2033`](https://jira.open-xchange.com/browse/OXUIB-2033): XSS at Tumblr portal widget due to missing content sanitization [`26b9f42`](https://gitlab.open-xchange.com/frontend/core/commit/26b9f421ce109fdc1b0d62eea79ad394e4f46087)
- fixed [`OXUIB-1278`](https://jira.open-xchange.com/browse/OXUIB-1278) Events from different timezones displayed on wrong day [`086ed20`](https://gitlab.open-xchange.com/frontend/core/commit/086ed20c6214b7b10ad72d2f83444398f77d4cec)
- [`OXUIB-2109`](https://jira.open-xchange.com/browse/OXUIB-2109): Display error when focussing mail color flag in Chrome [`b04c0ee`](https://gitlab.open-xchange.com/frontend/core/commit/b04c0ee3e72636aa6d378fb08619f0cb6f4171b9)
- [`OXUIB-2167`](https://jira.open-xchange.com/browse/OXUIB-2167) - Guard mails can not be printed [`579a130`](https://gitlab.open-xchange.com/frontend/core/commit/579a1308ed8b7e54d3d445440c593bbdb77c1f47)
- [`OXUIB-1337`](https://jira.open-xchange.com/browse/OXUIB-1337) - Multiple attempts for Mailto registration [`95d28ed`](https://gitlab.open-xchange.com/frontend/core/commit/95d28ed7f7a349a45cd9ebda29133339607088c5)
- [`OXUIB-2148`](https://jira.open-xchange.com/browse/OXUIB-2148): Printing a short mail always creates two pages in print preview [`115e335`](https://gitlab.open-xchange.com/frontend/core/commit/115e3356e51d41af96c90778738365723654dd31)
- fixed e2e tests according to bug fix [`OXUIB-1666`](https://jira.open-xchange.com/browse/OXUIB-1666) [`2f6b667`](https://gitlab.open-xchange.com/frontend/core/commit/2f6b6673c10c130dcb593094625aeeefdd980e1f)
- [`OXUIB-2130`](https://jira.open-xchange.com/browse/OXUIB-2130) - Remote resources are loaded in print view [`26c9f1f`](https://gitlab.open-xchange.com/frontend/core/commit/26c9f1f1d578f09d28499123ea1cd533754dc51c)

### Security

- [`OXUIB-2033`](https://jira.open-xchange.com/browse/OXUIB-2033) XSS at Tumblr portal widget due to missing content sanitization [`729d7dc`](https://gitlab.open-xchange.com/frontend/core/commit/729d7dcf39d8933d47d04f182a0902de180d5853)

## [7.10.6-24]

### Fixed

- Translations updated for: [`OXUIB-2098`](https://jira.open-xchange.com/browse/OXUIB-2098) [`55e032e`](https://gitlab.open-xchange.com/frontend/core/commit/55e032ea1edc0df03e627f9415cab4d9523064ae)
- Translations updated for: [`OXUIB-2098`](https://jira.open-xchange.com/browse/OXUIB-2098) [`50a0696`](https://gitlab.open-xchange.com/frontend/core/commit/50a0696def9d08d28d72ff87754aded1e51ca5d0)
- [`OXUI-1106`](https://jira.open-xchange.com/browse/OXUI-1106): Mailfilter apply action must use the enqueuable parameter [`50ca3af`](https://gitlab.open-xchange.com/frontend/core/commit/50ca3afccfe16febe1afb7e5eabd7d4052aa4b79)
- [`OXUIB-1568`](https://jira.open-xchange.com/browse/OXUIB-1568): Autocomplete sometimes not showing desired contacts [`8306d8b`](https://gitlab.open-xchange.com/frontend/core/commit/8306d8bb56a0cfe41b6d5e0ae002243a9a6a4b71)
- [`OXUIB-2115`](https://jira.open-xchange.com/browse/OXUIB-2115): Selecting text from mail not working as expected [`7813096`](https://gitlab.open-xchange.com/frontend/core/commit/7813096fd363fd56c67f0c247acfdcc6b4db5b9f)
- [`OXUIB-2098`](https://jira.open-xchange.com/browse/OXUIB-2098): Connect your device - calendar and address book missing for windows [`11d3f6a`](https://gitlab.open-xchange.com/frontend/core/commit/11d3f6a57c59d66db93198a94a2752602ef7ceaa)
- [`OXUIB-1235`](https://jira.open-xchange.com/browse/OXUIB-1235): Repeatedly adding same attachments from current compose dialog (all attachments) throws error [`e2498fd`](https://gitlab.open-xchange.com/frontend/core/commit/e2498fd4d5c3c08ed549c0d6faf550a4e2c0ac73)
- [`OXUIB-2126`](https://jira.open-xchange.com/browse/OXUIB-2126): Sorting by folder name in Drive not working in public files [`1bd736a`](https://gitlab.open-xchange.com/frontend/core/commit/1bd736aa32445018f8a5f69294d1fa823ac2c91b)
- Fixed [`OXUIB-2121`](https://jira.open-xchange.com/browse/OXUIB-2121) Incorrect calendar week displayed when selecting specific day in mini calendar [`995b27d`](https://gitlab.open-xchange.com/frontend/core/commit/995b27d80f76892176203c3a6e2f1551bec581f9)
- [`OXUIB-2135`](https://jira.open-xchange.com/browse/OXUIB-2135): Appointment disappears after removing recurrence rule of series [`dd3d096`](https://gitlab.open-xchange.com/frontend/core/commit/dd3d0968d014f595cfdd905fe34a4cbef78aee76)
- [`OXUIB-2140`](https://jira.open-xchange.com/browse/OXUIB-2140): Missing actions in multi-selected mails on mobile [`af996af`](https://gitlab.open-xchange.com/frontend/core/commit/af996afcadf11dbf260178ebf5af8ac45a0c8f4a)
- Improve detection of suspicious dependencies when loading via `ox.load` [`bab7cec`](https://gitlab.open-xchange.com/frontend/core/commit/bab7cecd69f45db8c4da698ca5eb3de86ab139ba)

## [7.10.6-23]

### Fixed

- [`OXUIB-2043`](https://jira.open-xchange.com/browse/OXUIB-2043): Pagination broken in share/permission dialog [`f6442a5`](https://gitlab.open-xchange.com/frontend/core/commit/f6442a5c5efc7610131806771f56f4c8ebb955f2)
- [`OXUIB-2096`](https://jira.open-xchange.com/browse/OXUIB-2096): Connection security shows 'None' in UI for internal account even if connection is secure [`078474e`](https://gitlab.open-xchange.com/frontend/core/commit/078474e123f85e56842a855dbb17132dcc297f28)
- [`OXUIB-2066`](https://jira.open-xchange.com/browse/OXUIB-2066): E-Mail statistics sometimes empty [`c36e590`](https://gitlab.open-xchange.com/frontend/core/commit/c36e5906a56325a6964f9c4f69caef1f2fea40e0)
- [`OXUIB-2069`](https://jira.open-xchange.com/browse/OXUIB-2069): Editing personal data has no immediate effect [`a3e1ed1`](https://gitlab.open-xchange.com/frontend/core/commit/a3e1ed1082469d606ab267117c54ba7bb58636b4)
- [`DOCS-4598`](https://jira.open-xchange.com/browse/DOCS-4598) Print as PDF does not work in OX Documents [`021e33a`](https://gitlab.open-xchange.com/frontend/core/commit/021e33ad79d579d1aafd21fde5da27ab133bdfd1)
- Fixed [`OXUIB-1306`](https://jira.open-xchange.com/browse/OXUIB-1306) Scheduling: Participants and time slot lines are not aligned [`0643d17`](https://gitlab.open-xchange.com/frontend/core/commit/0643d17342632bad055d6ae164a58b9bf04c1f60)

## [7.10.6-22]

### Fixed

- [`OXUIB-1975`](https://jira.open-xchange.com/browse/OXUIB-1975): not-localized error message when trying to add an already existing contact to a distribution list [`36d2d51`](https://gitlab.open-xchange.com/frontend/core/commit/36d2d514948c8c2e62488318b56f6955e87b58d9)
- [`OXUIB-1926`](https://jira.open-xchange.com/browse/OXUIB-1926): Different typos in Dutch guided tours - Multifactor Authentication [`34b71c2`](https://gitlab.open-xchange.com/frontend/core/commit/34b71c2da232a5b39ff3562d130c80b7649e1da6)
- [`OXUIB-2064`](https://jira.open-xchange.com/browse/OXUIB-2064):Original image size not reduced to small/medium/large in Firefox [`ea2365c`](https://gitlab.open-xchange.com/frontend/core/commit/ea2365c9bde278334ffb54d6b34a1f7ef0a0c884)

## [7.10.6-21]

### Fixed

- [`OXUIB-2028`](https://jira.open-xchange.com/browse/OXUIB-2028): English error message in German, French, etc. country settings [`747da63`](https://gitlab.open-xchange.com/frontend/core/commit/747da63307b25d96b2b53c88189d01f067ee27a9)
- [`OXUIB-1966`](https://jira.open-xchange.com/browse/OXUIB-1966): Permissions dialog is available for external and secondary accounts but does nothing [`fd0566f`](https://gitlab.open-xchange.com/frontend/core/commit/fd0566f044446aad2a53b69f4793baf83e7c83eb)
- [`OXUIB-2026`](https://jira.open-xchange.com/browse/OXUIB-2026): Message `Server unreachable` caused by http status code 500 [`14be2ef`](https://gitlab.open-xchange.com/frontend/core/commit/14be2ef33890114fe5b93a39f06934e4f5d0b3a1)
- [`OXUIB-2009`](https://jira.open-xchange.com/browse/OXUIB-2009): Some mail columns possibly slow down mail requests [`7478627`](https://gitlab.open-xchange.com/frontend/core/commit/7478627b8aa3e8da77d9ac54788ebb6e163ebbf0)
- [`OXUIB-1955`](https://jira.open-xchange.com/browse/OXUIB-1955): Time zone change request for Europe/Kyiv [`f5a09d7`](https://gitlab.open-xchange.com/frontend/core/commit/f5a09d7f8cee4b1657eade83bf9bc108aff1172a)
- Fixed: [`981753d`](https://gitlab.open-xchange.com/frontend/core/commit/981753db49b17867c746f02795e887b5f6d21fd6)
- [`OXUIB-2002`](https://jira.open-xchange.com/browse/OXUIB-2002): 2Factor Authentication dialog not fully localized [`af2d864`](https://gitlab.open-xchange.com/frontend/core/commit/af2d8640467352e7c74df11924f17c30f4265293)

## [7.10.6-20]

### Fixed

- [`OXUIB-1089`](https://jira.open-xchange.com/browse/OXUIB-1089): Drivemail: missing autoswitch when coming from drive 'send by email' [`279ece3`](https://gitlab.open-xchange.com/frontend/core/commit/279ece3163618ddc6ff01370438ecc8e69060e48)
- [`OXUIB-1923`](https://jira.open-xchange.com/browse/OXUIB-1923): Check for possible missing attachments too greedy [`1d99292`](https://gitlab.open-xchange.com/frontend/core/commit/1d992926e9ff0ef0cca53afcc182876d311d7e02)
- Fixed [`OXUIB-1089`](https://jira.open-xchange.com/browse/OXUIB-1089): drivemail: missing autoswitch when coming from drive -send by email- [`96842dd`](https://gitlab.open-xchange.com/frontend/core/commit/96842dd0e78dcc261db90f1feec78f0d0b958a2e)
- [`OXUIB-1879`](https://jira.open-xchange.com/browse/OXUIB-1879): Calendar entry not in selected color as created [`110bc28`](https://gitlab.open-xchange.com/frontend/core/commit/110bc28a3859c3e3d4b01934af12a8bcdf3fcaa6)
- [`OXUIB-1933`](https://jira.open-xchange.com/browse/OXUIB-1933): XSS using "upsell ads" [`feee62c`](https://gitlab.open-xchange.com/frontend/core/commit/feee62c0d160c72919d541402586fe252c860392)
- [`OXUIB-1827`](https://jira.open-xchange.com/browse/OXUIB-1827): Mail not displayed - content is only visible via view source or as forwarded mail (2) [`e606746`](https://gitlab.open-xchange.com/frontend/core/commit/e60674686d07633975b20419e733c2b332a86fda)
- [`OXUIB-1849`](https://jira.open-xchange.com/browse/OXUIB-1849): Removing outdated conference links [`a488b72`](https://gitlab.open-xchange.com/frontend/core/commit/a488b7275307b458523570d70263072cb8a9960a)
- [`OXUIB-449`](https://jira.open-xchange.com/browse/OXUIB-449): Language drop-up in footer of login page broke with 7.10.4 [`1a8b2d6`](https://gitlab.open-xchange.com/frontend/core/commit/1a8b2d6bb7a30d2be7e2f4bab5f245cbf04331b7)
- fixed [`OXUIB-1795`](https://jira.open-xchange.com/browse/OXUIB-1795) - XSS using "upsell" triggers [`3e8727d`](https://gitlab.open-xchange.com/frontend/core/commit/3e8727d4155bd7aa6c1c45fc73e7bae75d6c7792)
- [`OXUIB-1851`](https://jira.open-xchange.com/browse/OXUIB-1851): Jitsi integration creates new URL on appointment edit [`1b3729b`](https://gitlab.open-xchange.com/frontend/core/commit/1b3729b5b1cae67470ee55d3b6fa406ab38b8032)
- [`OXUIB-1917`](https://jira.open-xchange.com/browse/OXUIB-1917): Browser Not Supported Page Stays in the Cache because of permanent redirec [`037b2b0`](https://gitlab.open-xchange.com/frontend/core/commit/037b2b0863723becc67e1b3a497d5f996ef059a0)
- [`OXUIB-1885`](https://jira.open-xchange.com/browse/OXUIB-1885): Folder 'confirmed_spam' not listed in folder tree [`d245f6f`](https://gitlab.open-xchange.com/frontend/core/commit/d245f6f1521a4af020b258a93caeb6e926425bf8)
- Fixup: [`OXUIB-1714`](https://jira.open-xchange.com/browse/OXUIB-1714): Unexpected and inconsistent success message shown when updating external account [`d5eaae0`](https://gitlab.open-xchange.com/frontend/core/commit/d5eaae0961b2e3e8464c72c8739fed06ad9084c3)

## [7.10.6-19]

### Added

- Greek frontend file: [`ASP-119`](https://jira.open-xchange.com/browse/ASP-119): Add Greek language support [`bdb2f28`](https://gitlab.open-xchange.com/frontend/core/commit/bdb2f280fa54db787e45708c01fa89c019bcd60b)
- Greek guided tours file: [`ASP-119`](https://jira.open-xchange.com/browse/ASP-119): Add Greek language support [`89e9c87`](https://gitlab.open-xchange.com/frontend/core/commit/89e9c8755c8959179e651b4c5c9778b945813d70)

### Fixed

- [`OXUIB-1807`](https://jira.open-xchange.com/browse/OXUIB-1807) deduplication of email address when adding a contact to a distribution list does not work (sometimes) [`47a192d`](https://gitlab.open-xchange.com/frontend/core/commit/47a192d1ea8e686d036ea4fcae27a43d3227b75a)
- Fix freebusy states in scheduling view [`1d93c2a`](https://gitlab.open-xchange.com/frontend/core/commit/1d93c2a54ef1e7ab15e95d375e6e721c0fa2f857)
- [`OXUIB-1924`](https://jira.open-xchange.com/browse/OXUIB-1924): Form header textColor gets not applied from as-config.yml [`51fb810`](https://gitlab.open-xchange.com/frontend/core/commit/51fb81015c16c8f85d2662c867e49926f4836850)
- [`OXUIB-1890`](https://jira.open-xchange.com/browse/OXUIB-1890): Inserting text into mail body using copy/paste does not work all the time [`4703ef3`](https://gitlab.open-xchange.com/frontend/core/commit/4703ef3de5fb9e5c9187a33edfba8867561f2fe2)

## [7.10.6-18]

### Fixed

- [`OXUIB-1830`](https://jira.open-xchange.com/browse/OXUIB-1830): Sharing options are present for users without "Share Links" and "Invite Guests" capabilities [`ca4fae9`](https://gitlab.open-xchange.com/frontend/core/commit/ca4fae93e675a5cfd3a01a7b729f61ba575cee74)
- Fixed [`OXUIB-1717`](https://jira.open-xchange.com/browse/OXUIB-1717): mail from sent mail folder are also archived when archiving from INBOX while in conversation view [`41eee98`](https://gitlab.open-xchange.com/frontend/core/commit/41eee98c698de20700aa45222fdefebc86fee3db)
- [`OXUIB-1815`](https://jira.open-xchange.com/browse/OXUIB-1815) Setting io.ox/core//logoAction doesn't work for internal Apps [`cbd0722`](https://gitlab.open-xchange.com/frontend/core/commit/cbd07222d5de45120b1469a6b3d493fb62f051c4)
- Fixed [`OXUIB-1825`](https://jira.open-xchange.com/browse/OXUIB-1825): Delete-Key in mail module doesn't work anymore after installing Patch #6156 [`9e99830`](https://gitlab.open-xchange.com/frontend/core/commit/9e998302a36f22624dd6e5f270fa60dcd5b0c9bf)
- [`OXUIB-1827`](https://jira.open-xchange.com/browse/OXUIB-1827): Mail not displayed - content is only visible via view source or as forwarded mail [`f31ef85`](https://gitlab.open-xchange.com/frontend/core/commit/f31ef85f0650998c76564032eafc94dc1acd57e9)

## [7.10.6-17]

### Removed

- remove build for Debian Stretch [`065be86`](https://gitlab.open-xchange.com/frontend/core/commit/065be8690dd07bd17ab711961085b4350dcbd7e2)

### Fixed

- Fixed [`OXUIB-1081`](https://jira.open-xchange.com/browse/OXUIB-1081): Search tokens overflow the input field [`59bcb14`](https://gitlab.open-xchange.com/frontend/core/commit/59bcb14bc84245abcaba76908c4ddeb8bf6a819a)
- [`OXUIB-1341`](https://jira.open-xchange.com/browse/OXUIB-1341): Translation suggestion for Swedish in UI [`06118c3`](https://gitlab.open-xchange.com/frontend/core/commit/06118c3d74452df387c0ea35e75f01987ed510b1)
- [`OXUIB-1703`](https://jira.open-xchange.com/browse/OXUIB-1703) - mail compose jumps when insert link [`de72b46`](https://gitlab.open-xchange.com/frontend/core/commit/de72b467a9178549a4b845d4a04b81c3083fefa4)
- [`OXUIB-1729`](https://jira.open-xchange.com/browse/OXUIB-1729) GDPR Export in 1GB packages not possible directly after an export with 512MB package size [`fdf116f`](https://gitlab.open-xchange.com/frontend/core/commit/fdf116faf3d9a48d3110372147153c76dc784259)
- Fixed [`OXUIB-1811`](https://jira.open-xchange.com/browse/OXUIB-1811): CSS prefer-color-scheme gets ignored on body tag [`e7b5fab`](https://gitlab.open-xchange.com/frontend/core/commit/e7b5fab5b6a8639e5e73bce13bc1001d1c3d177a)
- [`OXUIB-1778`](https://jira.open-xchange.com/browse/OXUIB-1778) Dragging an attachment to a Task triggers Expand form or Collapse form [`b5ab528`](https://gitlab.open-xchange.com/frontend/core/commit/b5ab528cb891dfa2165d7a833e0a9d39e5561034)
- Fixed [`OXUIB-1714`](https://jira.open-xchange.com/browse/OXUIB-1714) Unexpected and inconsistent success message shown when updating external account [`844f6c9`](https://gitlab.open-xchange.com/frontend/core/commit/844f6c900d0129d8e4da717ebdd956b06fea9af2)
- [`OXUIB-1755`](https://jira.open-xchange.com/browse/OXUIB-1755) Cannot copy manual configuration from -Connect your device-Safari only [`ee13683`](https://gitlab.open-xchange.com/frontend/core/commit/ee136834177d9624bba9b9586224c4e5da807c9f)
- Fixed [`OXUIB-1790`](https://jira.open-xchange.com/browse/OXUIB-1790): "Back" in E-Mail List view is draggable [`27aadf2`](https://gitlab.open-xchange.com/frontend/core/commit/27aadf28a1110448c080a1fed962141f1ef18ff3)
- [`OXUIB-1764`](https://jira.open-xchange.com/browse/OXUIB-1764) Overflow of color picker in calendar on mobile devices [`9644728`](https://gitlab.open-xchange.com/frontend/core/commit/9644728c79736451de7065bcce8bc8b37aa7cb50)

## [7.10.6-16]

### Added

- Additional commit for [`OXUIB-1733`](https://jira.open-xchange.com/browse/OXUIB-1733) [`9169104`](https://gitlab.open-xchange.com/frontend/core/commit/9169104e0a8e2c9de2eeb2f167fba14e4e739507)
- Additional commit for [`OXUIB-1678`](https://jira.open-xchange.com/browse/OXUIB-1678) [`81b349f`](https://gitlab.open-xchange.com/frontend/core/commit/81b349f3a2f60f33377323348293322d4a397e61)

### Fixed

- [`OXUIB-1768`](https://jira.open-xchange.com/browse/OXUIB-1768) Save a sent mail as distribution list - nothing happens [`e4dae98`](https://gitlab.open-xchange.com/frontend/core/commit/e4dae98fba64508611c6f17d8902492ee27cdd11)
- [`OXUIB-1678`](https://jira.open-xchange.com/browse/OXUIB-1678) XSS sanitization bypass for HTML snippets [`cf4d252`](https://gitlab.open-xchange.com/frontend/core/commit/cf4d25219f0d7e02cbf083b4fe84d02cd28bd6be)
- Fixed [`OXUIB-1290`](https://jira.open-xchange.com/browse/OXUIB-1290) Getting started tour does not show the focus red dot [`c82040a`](https://gitlab.open-xchange.com/frontend/core/commit/c82040a1611539851e80829a0972fd06545df773)
- [`OXUIB-1733`](https://jira.open-xchange.com/browse/OXUIB-1733) Initials in dropdown menu do not update [`21fef66`](https://gitlab.open-xchange.com/frontend/core/commit/21fef6658cfd3b096b8104a06f6b4d14ffc87586)
- Fixed [`DOCS-4377`](https://jira.open-xchange.com/browse/DOCS-4377): guest users should have Drive settings [`85aecff`](https://gitlab.open-xchange.com/frontend/core/commit/85aecff310b677e5c64b6c938607af3f1fceb0c8)
- fix [`OXUIB-1785`](https://jira.open-xchange.com/browse/OXUIB-1785) XSS using "capabilities" evaluation and checks [`1c51d5e`](https://gitlab.open-xchange.com/frontend/core/commit/1c51d5e1db4870ab3bf6bd03a166bfb4b4d59726)
- Fixed [`OXUIB-1676`](https://jira.open-xchange.com/browse/OXUIB-1676): Calendar actions are not always rendered in list view [`638f0cc`](https://gitlab.open-xchange.com/frontend/core/commit/638f0cc6bd09095f88a5e1f5cb25db07bc97c242)
- Fixed [`OXUIB-1721`](https://jira.open-xchange.com/browse/OXUIB-1721): too wide mobile account editing modal [`0209514`](https://gitlab.open-xchange.com/frontend/core/commit/020951458e7befaf7a1f0135eb7a651439a6abb8)
- Fixed [`OXUIB-843`](https://jira.open-xchange.com/browse/OXUIB-843): Improve focus switch after onclick action [`6378072`](https://gitlab.open-xchange.com/frontend/core/commit/6378072354950205b5ae02788b0173c34e83e0f3)

### Security

- [`OXUIB-1732`](https://jira.open-xchange.com/browse/OXUIB-1732): XSS at address picker when not using "fullname" [`3cfe787`](https://gitlab.open-xchange.com/frontend/core/commit/3cfe7870661f0ea3a76c50bf9a3ddcf8babccb58)
- [`OXUIB-1731`](https://jira.open-xchange.com/browse/OXUIB-1731) XSS with print templates when using plain-text mail [`7129a0e`](https://gitlab.open-xchange.com/frontend/core/commit/7129a0e935e39677f0f72379ab6cc8434c0b1b93)

## [7.10.6-15]

### Fixed

- fixes: [`OXUIB-1101`](https://jira.open-xchange.com/browse/OXUIB-1101) - password reset error message on wrong password always in english [`a4f029b`](https://gitlab.open-xchange.com/frontend/core/commit/a4f029b763db46fe083bb31ae0741339f3504640)
- [`OXUIB-1727`](https://jira.open-xchange.com/browse/OXUIB-1727): Misleading tooltip on mail compose window [`19be4f9`](https://gitlab.open-xchange.com/frontend/core/commit/19be4f99ef21a241e8cffcfec55a5ddd1d8c5ba7)
- Fixed [`OXUIB-1723`](https://jira.open-xchange.com/browse/OXUIB-1723): Inconsistent usage of colors on login page when moving header and footer elements [`281ea2f`](https://gitlab.open-xchange.com/frontend/core/commit/281ea2f50a7c2c686d66b51e4c8782f6fa5ce75f)

## [7.10.6-14]

### Fixed

- Fixed [`OXUIB-1753`](https://jira.open-xchange.com/browse/OXUIB-1753): Missing buttons in calendar [`3390ea1`](https://gitlab.open-xchange.com/frontend/core/commit/3390ea1e54eab7c269d5e5f2e6791f36cf1ebff8)
- Fix [`OXUIB-1638`](https://jira.open-xchange.com/browse/OXUIB-1638): address book: fix svg initials in safari [`22378bd`](https://gitlab.open-xchange.com/frontend/core/commit/22378bdb996bcf376a5122b6f001c7c7c7b7088b)

## [7.10.6-13]

### Fixed

- [`OXUIB-1593`](https://jira.open-xchange.com/browse/OXUIB-1593) Color issue on mobile login page if explicitely configured [`5d3dbfd`](https://gitlab.open-xchange.com/frontend/core/commit/5d3dbfddacff88aa10c2182eb1605793b9bdd276)
- [`OXUIB-1212`](https://jira.open-xchange.com/browse/OXUIB-1212) Calendar list view is missing actions [`e5e4e75`](https://gitlab.open-xchange.com/frontend/core/commit/e5e4e75f2e74d78f22192969a5c4ea6121fbdef1)
- Fixed [`OXUIB-1474`](https://jira.open-xchange.com/browse/OXUIB-1474)L3 Race condition when toggling mail filter rules [`d32204b`](https://gitlab.open-xchange.com/frontend/core/commit/d32204b4ee0d0e97a82df14c2cc54a7cb4b7d1fb)
- Fixes [`OXUIB-1665`](https://jira.open-xchange.com/browse/OXUIB-1665): Mobile UI. "re:" and "fwd:" removed from Subject in the mail view [`b583ab9`](https://gitlab.open-xchange.com/frontend/core/commit/b583ab9763e0a159c111d57e349d3cfbb4c5d9de)
- [`OXUIB-1642`](https://jira.open-xchange.com/browse/OXUIB-1642) Edit calendar folders not working on mobiles [`67667e6`](https://gitlab.open-xchange.com/frontend/core/commit/67667e657eeb503249013a53cce95bbf3b83a30d)
- Reopen of [`OXUIB-1384`](https://jira.open-xchange.com/browse/OXUIB-1384) Drive Mail: Download Button flashing up while browsing through the folder tree [`27a72a0`](https://gitlab.open-xchange.com/frontend/core/commit/27a72a0ab3709590aabc52754b85f34aaf5ebfad)
- [`OXUIB-1659`](https://jira.open-xchange.com/browse/OXUIB-1659) no avatar pictures in distribution lists displayed after editing [`1c9bc47`](https://gitlab.open-xchange.com/frontend/core/commit/1c9bc473c812a55e9c7a23c99cba4e9c39a0e1fe)

## [7.10.6-12]

### Added

- Additional commit for [`OXUIB-1379`](https://jira.open-xchange.com/browse/OXUIB-1379): Forwarding an email drops the timezone information in "Date" identifier [`dcb2859`](https://gitlab.open-xchange.com/frontend/core/commit/dcb2859970a7808cd4a56b8896dc5d7561b605d3)

### Fixed

- Fixed [`OXUIB-1654`](https://jira.open-xchange.com/browse/OXUIB-1654) Bypass for E-Mail "deep links" [`cec445c`](https://gitlab.open-xchange.com/frontend/core/commit/cec445c2ef10bc36e8ddb343df089e66cbb27d57)
- Fixed [`OXUIB-1609`](https://jira.open-xchange.com/browse/OXUIB-1609) Drive Mail: -using password- can be choosen and mail can be sent even without giving a password at all [`88f152a`](https://gitlab.open-xchange.com/frontend/core/commit/88f152aa4455fba02e2124fadf7989408937d66f)
- [`OXUIB-1266`](https://jira.open-xchange.com/browse/OXUIB-1266) Mail compose is not opened in case of an over quota mailbox [`1175b47`](https://gitlab.open-xchange.com/frontend/core/commit/1175b47c73f413b06b8aef762df2404bf3b46dc7)
- [`OXUIB-1296`](https://jira.open-xchange.com/browse/OXUIB-1296) High resolution images are deleted when trying to add them to the email body [`616913f`](https://gitlab.open-xchange.com/frontend/core/commit/616913f0da3a095f1e22d02ee07f697c64f0a967)
- [`OXUIB-1379`](https://jira.open-xchange.com/browse/OXUIB-1379) Forwarding an email drops the timezone notification in "Date" identifier [`2757b36`](https://gitlab.open-xchange.com/frontend/core/commit/2757b3618569cfcf813459050c8a6e8e8b1a7759)
- Fixed [`OXUIB-1384`](https://jira.open-xchange.com/browse/OXUIB-1384) Drive Mail: Download Button flashing up while browsing through the folder tree [`1ee6961`](https://gitlab.open-xchange.com/frontend/core/commit/1ee6961ca976ab9301948ce969480382ae8b7f12)

## [7.10.6-11]

### Fixed

- bug [`OXUIB-1241`](https://jira.open-xchange.com/browse/OXUIB-1241) - Initials are not visible in topbar-account-dropdown [`c0b84fb`](https://gitlab.open-xchange.com/frontend/core/commit/c0b84fb5cc7ebbfd3080a0a136fe98998d8ad10f)
- Fixed [`OXUIB-1326`](https://jira.open-xchange.com/browse/OXUIB-1326) Wrong Appointment Color in Dialog [`dcce96a`](https://gitlab.open-xchange.com/frontend/core/commit/dcce96af3e1e2de0d277d645560f050c71192e1f)

## [7.10.6-10]

### Fixed

- Fixed [`OXUIB-1148`](https://jira.open-xchange.com/browse/OXUIB-1148) User popup opens behind popup "Conflicts detected" and cannot be used [`3bf6758`](https://gitlab.open-xchange.com/frontend/core/commit/3bf675812dfb666d3dc1bacfc72ed6ba4f19643f)

## [7.10.6-9]

### Added

- add resource requests and limits for e2e jobs [`8d99fb5`](https://gitlab.open-xchange.com/frontend/core/commit/8d99fb50d74157149e4d74b6f5c6a182b051db8b)
- add resource requests and limits for build jobs [`bb27e2e`](https://gitlab.open-xchange.com/frontend/core/commit/bb27e2ed6ffae4d24505d911d8f69158dec23e1b)

### Fixed

- bug [`OXUIB-1095`](https://jira.open-xchange.com/browse/OXUIB-1095) - File attachment multiplies after send [`7d2ac59`](https://gitlab.open-xchange.com/frontend/core/commit/7d2ac59ca917389ef5797f50b3e7d24358719e16)
- bug [`OXUIB-1382`](https://jira.open-xchange.com/browse/OXUIB-1382) Drive Mail: Password can be set even when not enabled and vice versa [`a38a44b`](https://gitlab.open-xchange.com/frontend/core/commit/a38a44b1af108c1c4e576d519ac6c992b1413eeb)

## [7.10.6-8]

### Added

- Additional commit for [`OXUIB-1042`](https://jira.open-xchange.com/browse/OXUIB-1042) calendar entry can not be modified (empty popup, UI hangs) [`98a3690`](https://gitlab.open-xchange.com/frontend/core/commit/98a3690f77e524d8b982cc7cdb85cac163f8216b)
- Additional commit for [`OXUIB-654`](https://jira.open-xchange.com/browse/OXUIB-654) Blocked external images are loaded anyways when replying/forwarding mail [`5bf6224`](https://gitlab.open-xchange.com/frontend/core/commit/5bf6224ebfe851e36dbe84086c1a87fac9b64c6e)

### Removed

- Remove U2F code for Chrome.  Add basic webauthn support for U2F authentication [`5429819`](https://gitlab.open-xchange.com/frontend/core/commit/542981910bfc2104b9d43cc94e07b6e344c06df8)

### Fixed

- Fixed [`OXUIB-1355`](https://jira.open-xchange.com/browse/OXUIB-1355) Logo of welcome mail broken [`a04c41a`](https://gitlab.open-xchange.com/frontend/core/commit/a04c41aec02d7900bfd9ce25d8082073c90ccc0a)
- [`OXUIB-706`](https://jira.open-xchange.com/browse/OXUIB-706): Backgroundcolor of customized signinTheme is always blue [`a56b540`](https://gitlab.open-xchange.com/frontend/core/commit/a56b5408885924970d0c28055f29f6846b435829)
- Fixed [`OXUIB-654`](https://jira.open-xchange.com/browse/OXUIB-654) Blocked external images are loaded anyways when replying/forwarding mail [`1355a38`](https://gitlab.open-xchange.com/frontend/core/commit/1355a381f4ddd68c15a4da6f083b90a050e6f117)
- Fixed [`OXUIB-1347`](https://jira.open-xchange.com/browse/OXUIB-1347) enterprise / public sector address picker visible also when not configured [`0a7232d`](https://gitlab.open-xchange.com/frontend/core/commit/0a7232dc3fe0a0ec29f520b69b7a5300fccf8b3a)
- Fixed [`OXUIB-1346`](https://jira.open-xchange.com/browse/OXUIB-1346) eMail address get wrapped at '-' character [`b5184f8`](https://gitlab.open-xchange.com/frontend/core/commit/b5184f8b16d2407e7b46a7324c929330d3e6a506)

## [7.10.6-7]

### Fixed

- Fixed [`OXUIB-1260`](https://jira.open-xchange.com/browse/OXUIB-1260): Update App Store URL for new iOS app [`38459bf`](https://gitlab.open-xchange.com/frontend/core/commit/38459bfff065fce0fee35d44449a2f912c0e7953)
- bug [`OXUIB-1273`](https://jira.open-xchange.com/browse/OXUIB-1273) - [L3] OXAppsuite-Frontend iframe app doesn't send the token in the proper format [`d0b6d1f`](https://gitlab.open-xchange.com/frontend/core/commit/d0b6d1f2d73719e6acbe0d6d46381df0df06cd61)

## [7.10.6-6]

## [7.10.6-5]

### Added

- Add mail send test for light pipelines [`4ba9748`](https://gitlab.open-xchange.com/frontend/core/commit/4ba9748b40113abeb7ad84574d29a8c7b29333f5)
- additional commit for [`OXUIB-1108`](https://jira.open-xchange.com/browse/OXUIB-1108) [`f08b2f2`](https://gitlab.open-xchange.com/frontend/core/commit/f08b2f26689e94b35e76685bbe66b3efa2db0d0e)

### Fixed

- Fix license header [`f70e16a`](https://gitlab.open-xchange.com/frontend/core/commit/f70e16adbdad5f75982cc6752c0e08e6b6990856)
- bug [`OXUIB-1024`](https://jira.open-xchange.com/browse/OXUIB-1024) Skewed Images After attaching them during mail compose [`75273a2`](https://gitlab.open-xchange.com/frontend/core/commit/75273a293f84d823b3d2ecaab0e224eb8f39d293)
- Fixed [`OXUIB-1075`](https://jira.open-xchange.com/browse/OXUIB-1075) quick start menu bar configuration for external users incorrec [`39dc6eb`](https://gitlab.open-xchange.com/frontend/core/commit/39dc6ebcf042c48c9789896208b90da1a290baf9)
- Fixed [`OXUIB-1042`](https://jira.open-xchange.com/browse/OXUIB-1042) calendar entry can not be modified (empty popup, UI hangs) [`3170f13`](https://gitlab.open-xchange.com/frontend/core/commit/3170f133e2c774f1b5f1337d881a7c68c72107de)
- Fix logo alignment for dynamic themes [`45352d3`](https://gitlab.open-xchange.com/frontend/core/commit/45352d30a5a250af9b07a8f2ee95b4979633327a)
- [`OXUIB-1184`](https://jira.open-xchange.com/browse/OXUIB-1184) - Connect Your Device says "MacOS" (should be macOS) [`282066a`](https://gitlab.open-xchange.com/frontend/core/commit/282066a0e60a3195cdcb66705cf8c615a5b34b36)
- Fix unit tests and e2e actors [`d266dfe`](https://gitlab.open-xchange.com/frontend/core/commit/d266dfeaa0c32f86a029cdf18d2fd6041a3d063b)
- Fix Unit tests [`05d92c8`](https://gitlab.open-xchange.com/frontend/core/commit/05d92c83e77805f6a2773a3502bb4f4f8cb27634)
- Fixed [`OXUIB-1213`](https://jira.open-xchange.com/browse/OXUIB-1213) Dynamic theme logo overlaps launcher in Firefox [`1bcc552`](https://gitlab.open-xchange.com/frontend/core/commit/1bcc5522a7e1e4886978b39f625c53e2efd72703)
- bug [`OXUIB-1146`](https://jira.open-xchange.com/browse/OXUIB-1146) Filter rules list not updated correctly on refresh^event after a rule is deleted [`a9b11a4`](https://gitlab.open-xchange.com/frontend/core/commit/a9b11a4e5c202cff1ca7363ccfdfa790084fe50c)

## [7.10.6-4]

### Added

- additional fix for bug [`OXUIB-444`](https://jira.open-xchange.com/browse/OXUIB-444) [`dbcbc0a`](https://gitlab.open-xchange.com/frontend/core/commit/dbcbc0a12aeec80f5ba3179dd9c410d0647b71b3)
- Added E2E test for [`OXUIB-401`](https://jira.open-xchange.com/browse/OXUIB-401) [`29c6d59`](https://gitlab.open-xchange.com/frontend/core/commit/29c6d59f594597a467f43c6b862812e47ba8e21a)
- add clearFolders helper [`a048f73`](https://gitlab.open-xchange.com/frontend/core/commit/a048f730e13cd689c136bcc5e0dcddf44f919483)
- additional commit for [`OXUIB-535`](https://jira.open-xchange.com/browse/OXUIB-535) [`525414b`](https://gitlab.open-xchange.com/frontend/core/commit/525414ba08e760b2fff55e1337246fc45889319a)
- Added customization extension point for Bug 58481 - Custom drive storages will never be identified as external [`2c9bb34`](https://gitlab.open-xchange.com/frontend/core/commit/2c9bb34183343795190c5475e0c3d3091de970c9)

### Changed

- change file locations for e2e tests to use global.codecept_dir [`0452f5f`](https://gitlab.open-xchange.com/frontend/core/commit/0452f5f8dadbb0fa2c512326c23f055fd2fe714b)

### Removed

- Remove Keycloak integration [`dd6134f`](https://gitlab.open-xchange.com/frontend/core/commit/dd6134f97bf4f5b782fb41fa7045ae69b771338f)
- remove grunt-modernizr as devDependency [`f7ed8fd`](https://gitlab.open-xchange.com/frontend/core/commit/f7ed8fd8c6fcc21d4e25ebf16afac8fe3845fba5)

### Fixed

- fixes for guided tours in all languages: [`OXUIB-873`](https://jira.open-xchange.com/browse/OXUIB-873), fixes for Dutch guided tours: [`OXUIB-859`](https://jira.open-xchange.com/browse/OXUIB-859), [`OXUIB-860`](https://jira.open-xchange.com/browse/OXUIB-860), [`OXUIB-861`](https://jira.open-xchange.com/browse/OXUIB-861), [`OXUIB-862`](https://jira.open-xchange.com/browse/OXUIB-862) [`46ec123`](https://gitlab.open-xchange.com/frontend/core/commit/46ec1235fa9ed10a947a5839bf7db4e9bfd25d9f)
- Fixed [`OXUIB-452`](https://jira.open-xchange.com/browse/OXUIB-452): Zoom view is not extensible [`f3cdf18`](https://gitlab.open-xchange.com/frontend/core/commit/f3cdf186c40b73dc9bb12cd93a43446ff07279ba)
- Fixed [`OXUIB-473`](https://jira.open-xchange.com/browse/OXUIB-473) recurring event in calendar cannot be deleted [`a16f3cd`](https://gitlab.open-xchange.com/frontend/core/commit/a16f3cdc4f0d1544f73ca0b7db55e569ea1f2635)
- Fixed [`OXUIB-477`](https://jira.open-xchange.com/browse/OXUIB-477): Impossible to dial-in to Zoom meeting if password is set [`e25913a`](https://gitlab.open-xchange.com/frontend/core/commit/e25913ae53f37a7a3c6c283f870188ac60a4e12a)
- Fixed [`OXUIB-491`](https://jira.open-xchange.com/browse/OXUIB-491) XSS using undocumented "OX Notes" app [`d6ea6f7`](https://gitlab.open-xchange.com/frontend/core/commit/d6ea6f7b4dc835b44a9c90ad8576be8ed6f1d934)
- [`OXUIB-535`](https://jira.open-xchange.com/browse/OXUIB-535) Print view for imported entries does not adjust calendar dates by Time Zone [`77dcf0c`](https://gitlab.open-xchange.com/frontend/core/commit/77dcf0cda8aaa20493e773cf603d91f2c73d4c93)
- [`OXUIB-411`](https://jira.open-xchange.com/browse/OXUIB-411) - Stored XSS with mobile search app for contacts (2) [`e0658c1`](https://gitlab.open-xchange.com/frontend/core/commit/e0658c128a2e4ae82c8e3987848699bc140de289)
- Fixed [`OXUIB-525`](https://jira.open-xchange.com/browse/OXUIB-525): login fails completely if login?action=acquireToken fails [`d4051c3`](https://gitlab.open-xchange.com/frontend/core/commit/d4051c32c81e97e6225b9b8032e69e3825dd22d6)
- Fixed [`OXUIB-443`](https://jira.open-xchange.com/browse/OXUIB-443) Zoom settings section is shown even if disabled (and only Jitsi configured) [`d296ffd`](https://gitlab.open-xchange.com/frontend/core/commit/d296ffdca5055ea280c43fdc23a67afa06b98a24)
- fix for [`OXUIB-471`](https://jira.open-xchange.com/browse/OXUIB-471): Multi-tab session bootstrapping must consider token login [`4b3e314`](https://gitlab.open-xchange.com/frontend/core/commit/4b3e314575258be160c74157e72cec249dbfb4f1)
- fix calendar color test [`93ac018`](https://gitlab.open-xchange.com/frontend/core/commit/93ac018f20c8dd7de7a64527782b8cf5097813b7)
- Fixed [`OXUIB-532`](https://jira.open-xchange.com/browse/OXUIB-532) Recurrence rule is not displayed correctly [`8b68d14`](https://gitlab.open-xchange.com/frontend/core/commit/8b68d14fbcd184a52c7b780f5a3cb1c287281120)
- [`OXUIB-507`](https://jira.open-xchange.com/browse/OXUIB-507) Automatic opening of notification area setting needs a refresh or login/logout in order to work [`14516f2`](https://gitlab.open-xchange.com/frontend/core/commit/14516f24a7d195d7abd3481bf993133391333be0)
- [`OXUIB-377`](https://jira.open-xchange.com/browse/OXUIB-377) Overlapping text of SessionItemView on smaller screens [`9a957be`](https://gitlab.open-xchange.com/frontend/core/commit/9a957bebb19b846c6bcd0263da839cb8298601d3)
- [`OXUIB-526`](https://jira.open-xchange.com/browse/OXUIB-526) Missing -Public Folder- in -subscribe shared calendar- Dialog [`a3a6841`](https://gitlab.open-xchange.com/frontend/core/commit/a3a68411fc6acfbfc2c47c3b6a25b1a969d93575)
- Fixed [`OXUIB-401`](https://jira.open-xchange.com/browse/OXUIB-401) XSS with task body "mail" links [`aa146a5`](https://gitlab.open-xchange.com/frontend/core/commit/aa146a5a75423e7d75bbf08d40dbe74301f79d21)
- [`OXUIB-463`](https://jira.open-xchange.com/browse/OXUIB-463) - signature selector in compose window not scrolling [`87fa0c6`](https://gitlab.open-xchange.com/frontend/core/commit/87fa0c61340ef748a6af5b85d1f6d623d549e7b3)
- bug [`OXUIB-444`](https://jira.open-xchange.com/browse/OXUIB-444) Address book: the number of contacts is wrong [`e431743`](https://gitlab.open-xchange.com/frontend/core/commit/e431743f96c48270b85355cbec3ed8e87c867ce5)
- Fixed [`OXUIB-438`](https://jira.open-xchange.com/browse/OXUIB-438) Request for correct setting [`22f0189`](https://gitlab.open-xchange.com/frontend/core/commit/22f0189a08a6cab002cf275a290fed181655f6cc)
- [`OXUIB-467`](https://jira.open-xchange.com/browse/OXUIB-467) mail print: recent chrome browsers (tested on 85) do split small mail in multiple pages [`ba27651`](https://gitlab.open-xchange.com/frontend/core/commit/ba276518fd64162146bdc4ae7c04fa279bc8ac03)
- [`OXUIB-413`](https://jira.open-xchange.com/browse/OXUIB-413) - [7.10.x] Not possible to enter comma in search field [`bbccbd8`](https://gitlab.open-xchange.com/frontend/core/commit/bbccbd8e188bfe7c7c57ae3b43c330bde6d3671c)
- Fixed [`OXUIB-428`](https://jira.open-xchange.com/browse/OXUIB-428) "Unbekannt" in call history is not translated [`8373812`](https://gitlab.open-xchange.com/frontend/core/commit/8373812827e2243ce34c98034a63345899550c73)
- Fixed [`OXUIB-442`](https://jira.open-xchange.com/browse/OXUIB-442) Calling contact via Jitsi makes UI stuck [`d1bdfd2`](https://gitlab.open-xchange.com/frontend/core/commit/d1bdfd255e9286ca0de3029335f82424ef5ffa36)
- Fixed [`OXUIB-481`](https://jira.open-xchange.com/browse/OXUIB-481) XSS at contacts in mobile mode [`4ea80d2`](https://gitlab.open-xchange.com/frontend/core/commit/4ea80d2523e690c616fcbd2d5cd709336d96f39d)
- Fixed [`OXUIB-448`](https://jira.open-xchange.com/browse/OXUIB-448) Floating events are not shown correctly in the list view [`95c59b4`](https://gitlab.open-xchange.com/frontend/core/commit/95c59b45114a6df078d6cd02ee453d9d7bb0ec16)
- [`OXUIB-515`](https://jira.open-xchange.com/browse/OXUIB-515) Unable to Create Filter Rule using a Condition [`5768fbb`](https://gitlab.open-xchange.com/frontend/core/commit/5768fbb8c98e5aac5ebf339fc3234385123f23e2)
- [`OXUIB-472`](https://jira.open-xchange.com/browse/OXUIB-472) - Format-Error for some RSS Feeds on Portal page [`acc2318`](https://gitlab.open-xchange.com/frontend/core/commit/acc2318da347778ec767e2a95fdaf6a07836c80a)
- Fixed [`OXUIB-404`](https://jira.open-xchange.com/browse/OXUIB-404) Incomplete attachment dropdown in the contact detail view [`5fd7cb9`](https://gitlab.open-xchange.com/frontend/core/commit/5fd7cb99d7eaa88282e2414df313094f94b777ca)
- Fixed [`OXUIB-376`](https://jira.open-xchange.com/browse/OXUIB-376) tasks mobile: Unable to edit Tasks starting from notifications area [`7a29e22`](https://gitlab.open-xchange.com/frontend/core/commit/7a29e229ff9fd68d87d9d9b52340abc0331202c4)
- Fixed [`OXUIB-391`](https://jira.open-xchange.com/browse/OXUIB-391) Button "New appointment" for Calendars opened by sharing link from guests available [`f163a0f`](https://gitlab.open-xchange.com/frontend/core/commit/f163a0ff44c85b2f530fb886fcfb024b7b589a7e)
- [`OXUIB-485`](https://jira.open-xchange.com/browse/OXUIB-485) Context menu on folders are missing -delete all messages- after marking/unmarking spam [`00b4dd1`](https://gitlab.open-xchange.com/frontend/core/commit/00b4dd19263f1ab16097dcafb757a7128dbbf7d3)
- fixes bug 64841 [`c861d59`](https://gitlab.open-xchange.com/frontend/core/commit/c861d59de7f38eb834f93af1d1fc26fc7eb1ae95)
- fixes bug 61427 [`071ea0e`](https://gitlab.open-xchange.com/frontend/core/commit/071ea0e54d9eff7f4326bae33cce4d1737430736)
- fixes bug 65958 - replaced Beeld with Overzicht to be consistent with the ui [`e56073c`](https://gitlab.open-xchange.com/frontend/core/commit/e56073cf6445fcadef48ca8bee2cb54ce3211ae3)
- fixes for bugs 55699, 56939, 58609, 55937, 55940, 55998, 55939 [`6e7872d`](https://gitlab.open-xchange.com/frontend/core/commit/6e7872d3646e5bfb4637307c23d439e9367ee9a1)
- Bug 57582 - deleting inline image does not delete the associated attachment [`aecd538`](https://gitlab.open-xchange.com/frontend/core/commit/aecd53841d3534162235333f4a1b1bafa7397cb4)
- Bug 58494 - different menu by "right click" and "click on fa-bars" on "My folders" [`afd2b61`](https://gitlab.open-xchange.com/frontend/core/commit/afd2b61dcaa5b69be37ab190d66a106b4cda2851)
- Bug 58910 - [L3] Session hand-over via URL parameter sometimes fails and UI freezes [`370ad7d`](https://gitlab.open-xchange.com/frontend/core/commit/370ad7d69a306a180170a466aaeeebd308edfba5)
- Bug 55398 - Text in angle brackets gets lost when forwarding emails [`ede4501`](https://gitlab.open-xchange.com/frontend/core/commit/ede45012de7f3805fed7488dd397bf7671d681d6)
- Bug 56170 - Autologout leads to a blank page [`cbdf4f9`](https://gitlab.open-xchange.com/frontend/core/commit/cbdf4f9d993f74c8ab346a5e9fb78a926bd8f04b)
- Bug 55708 - "My Folders" can be added to "Favorites" from mobile [`81de4c0`](https://gitlab.open-xchange.com/frontend/core/commit/81de4c0c3010798512509f4f406b0aaeb69e56fd)
- Bug 58226 - XSS through "theme" property injection [`08aa695`](https://gitlab.open-xchange.com/frontend/core/commit/08aa69518edc0d6efabd567551fd36028eab85a1)
- Bug 58511 - default font is not set in mail compose view until textarea is clicked #2 [`c4d1666`](https://gitlab.open-xchange.com/frontend/core/commit/c4d166680cd39637a4ea13d3328e6283bf23f587)
- Bug 58767 - [L3] Calendar workweek view not considered in recurring appointments [`708a999`](https://gitlab.open-xchange.com/frontend/core/commit/708a9999c00cd061a00002c9af0c98857bf59ffc)
- bug 58079 - [L3] unclear and not translated error message when validation failed for anyof sieve rule [`852d125`](https://gitlab.open-xchange.com/frontend/core/commit/852d12590811abd4e5ada937034061d6217f3dee)
- Bug 53209 - upsell in contacts folderview does not appear [`8c25a00`](https://gitlab.open-xchange.com/frontend/core/commit/8c25a0056a1adf2b772645c1bd75a6586a0e7fa2)
- Bug 58591 - First (saml) auto-login attempt after login hangs infinitely [`9f29fad`](https://gitlab.open-xchange.com/frontend/core/commit/9f29fadaf930ccdfcacc1af0a98e28b92f44db62)
- Bug 58158 - [L3] "Cox Production" screen [`0e9edee`](https://gitlab.open-xchange.com/frontend/core/commit/0e9edee90ff508d9e15483debd369e27bb37dfd6)
- Bug 58511 - default font is not set in mail compose view until textarea is clicked [`72509c3`](https://gitlab.open-xchange.com/frontend/core/commit/72509c32b22c0c8a4e34fcabd4d3d937f99c8018)
- bug 57740 - [L3] Autoforward filter rule causes other rules -file into- actions to act as -copy into- [`f7dd1e0`](https://gitlab.open-xchange.com/frontend/core/commit/f7dd1e0b179925e4774f54f4f7c33acab1d16b92)
- bug 57826 - After having an errordialog when trying to move a folder the -OK- button is always enabled - 7.8.4 backport [`51086b9`](https://gitlab.open-xchange.com/frontend/core/commit/51086b9327ad6b1c89d3fabe69b3320c57ba9df6)

## [7.10.6-3]

### Changed

- Change titel in user mode [`047fc6e`](https://gitlab.open-xchange.com/frontend/core/commit/047fc6ef2dbc270d08e22914e4402aae7094636a)

### Fixed

- [`OXUIB-1172`](https://jira.open-xchange.com/browse/OXUIB-1172) - Allowlist bypass using E-Mail "deep links" [`793f68d`](https://gitlab.open-xchange.com/frontend/core/commit/793f68d82691882e184f86145790a1b79beb07ce)
- Fix upsell css [`8e4c7e1`](https://gitlab.open-xchange.com/frontend/core/commit/8e4c7e14659737c208a58ea408f7f50ef0ca3bbf)
- Fixed [`OXUIB-1177`](https://jira.open-xchange.com/browse/OXUIB-1177) Logo doesn't fit header in mobile view [`6653c43`](https://gitlab.open-xchange.com/frontend/core/commit/6653c43e382cab0837d9a70cdf183ef781dee417)
- Fix issues with external participants and sharing dialog [`69077dc`](https://gitlab.open-xchange.com/frontend/core/commit/69077dc1ad7b83f3a897eb39655a101afdd9e418)
- Fix contact edit readonly and user mode [`38e89f7`](https://gitlab.open-xchange.com/frontend/core/commit/38e89f727a32ecf6e51bae03f8e1ee76b9e8eabc)
- Fix user mode of autocomplete [`69b5fcd`](https://gitlab.open-xchange.com/frontend/core/commit/69b5fcd252d9e5f4fb8f2416db304047fff02766)
- [`OXUIB-1136`](https://jira.open-xchange.com/browse/OXUIB-1136) - Help not shown [`e778c99`](https://gitlab.open-xchange.com/frontend/core/commit/e778c99c23a780766d8fd5d75753a49723761e54)

## [7.10.6-2]

### Added

- Add enterprise picker tests [`3d386ad`](https://gitlab.open-xchange.com/frontend/core/commit/3d386ad7a57e6ddb36cd9ee143a5a8e196aedbc7)
- Add tests for deputy management [`f9c5521`](https://gitlab.open-xchange.com/frontend/core/commit/f9c5521a2dc974bd692f99dc92d58a25550d52e1)
- Add simple caching for deputy reverse requests [`11d3886`](https://gitlab.open-xchange.com/frontend/core/commit/11d388686b7f09f31ebb31bcb1dbcd99ac08bcff)
- Add Enterprise Picker settings to documentation [`6ddf6df`](https://gitlab.open-xchange.com/frontend/core/commit/6ddf6dff7a598540d4bdf6b8e26356c901434b47)

### Removed

- removed no longer used files [`1853a1e`](https://gitlab.open-xchange.com/frontend/core/commit/1853a1ede0dc27ae33d5a022ffb6e5255419e488)

### Fixed

- [`OXUIB-1045`](https://jira.open-xchange.com/browse/OXUIB-1045) - Reset password inputs are inconsistent and untranslated [`b821fe3`](https://gitlab.open-xchange.com/frontend/core/commit/b821fe3ed2f72e131b5d17442b2bcc66ea1e931a)
- fixes swiper 6.8.4 [`a4fe8ca`](https://gitlab.open-xchange.com/frontend/core/commit/a4fe8caf09d958e53cf3fe9551a6c97cae86738c)
- Fixed [`OXUIB-1128`](https://jira.open-xchange.com/browse/OXUIB-1128) Enterprise picker does not show empty search results [`5f697cb`](https://gitlab.open-xchange.com/frontend/core/commit/5f697cb709f7144973957402fdf96922f3e2e5be)
- Fixed [`OXUIB-1050`](https://jira.open-xchange.com/browse/OXUIB-1050) Invalid fully-qualifying mail folder identifier on mail search using mail main folder [`6d3bbe3`](https://gitlab.open-xchange.com/frontend/core/commit/6d3bbe3a8da3e2ee34111d5458e6239c26ac4c33)
- Fixed [`OXUIB-840`](https://jira.open-xchange.com/browse/OXUIB-840) Android Sync App missing in client onboarding [`358cbe5`](https://gitlab.open-xchange.com/frontend/core/commit/358cbe5128e053b975087f71d09a366e37742656)
- Fixing some glichtes in deputy dialog [`a85f515`](https://gitlab.open-xchange.com/frontend/core/commit/a85f5154dfcc28d3c58856a18dd7799aca90bb72)
- Fix race condition that made it impossible to add participants [`a503d70`](https://gitlab.open-xchange.com/frontend/core/commit/a503d70cc77e11a9715a4016ca26ca9e80296a37)
- [`OXUIB-1069`](https://jira.open-xchange.com/browse/OXUIB-1069) - useless sharing options still available [`6bceb07`](https://gitlab.open-xchange.com/frontend/core/commit/6bceb078b68abc274ecf13bad79a9623d11311fd)
- [`OXUIB-932`](https://jira.open-xchange.com/browse/OXUIB-932) - draft autoload on mobile causes huge amount of "draft changed in another tab" messages [`cf9f2b9`](https://gitlab.open-xchange.com/frontend/core/commit/cf9f2b97b54a9270f0d7cde31c74bf88a87a527f)
- Fixed [`OXUIB-1105`](https://jira.open-xchange.com/browse/OXUIB-1105) Onboarding wizard on iPad will be handled like desktop [`d8a2d79`](https://gitlab.open-xchange.com/frontend/core/commit/d8a2d79e421f25b029769c857f15c54b4dc2695d)
- Fixed [`OXUIB-1119`](https://jira.open-xchange.com/browse/OXUIB-1119) Option "Unshare" has no effect for deputy shares only [`0640493`](https://gitlab.open-xchange.com/frontend/core/commit/0640493f9840bf4babd01642a79dc783add0ae6a)
- bug [`OXUIB-1066`](https://jira.open-xchange.com/browse/OXUIB-1066) WebUI on Mobile (iOS): creating mail results in error messages [`5299e43`](https://gitlab.open-xchange.com/frontend/core/commit/5299e439cbed4d84b489c62bcd954394f96d67fc)
- [`OXUIB-1045`](https://jira.open-xchange.com/browse/OXUIB-1045) - Reset password inputs are inconsistent and untranslated (2/2) [`e84a183`](https://gitlab.open-xchange.com/frontend/core/commit/e84a183a78fa19a47f4688fb2ceae3aad0070a2c)
- Fix Enterprisepicker overflow [`9c6b997`](https://gitlab.open-xchange.com/frontend/core/commit/9c6b997ddbe817be6ef578538196b8a07bf45032)
- Fix deputy picker style [`84ac75c`](https://gitlab.open-xchange.com/frontend/core/commit/84ac75c6a67ff7c7873aaea742a253cad9892306)
- Fixed [`OXUIB-1059`](https://jira.open-xchange.com/browse/OXUIB-1059) Viewing an attached file in address book fails [`5ba2a22`](https://gitlab.open-xchange.com/frontend/core/commit/5ba2a2208afd1a01bc4ed4b8d3beb10af72ec34d)

## [7.10.6-1]

### Added

- Add super simple launcher and detailview [`5093ab8`](https://gitlab.open-xchange.com/frontend/core/commit/5093ab8f0a5b62173dba916c6e352e0016d7178c)
- Add edit deputy permisssion dialog [`e3bd785`](https://gitlab.open-xchange.com/frontend/core/commit/e3bd785d81ad18e060cebb5935e4028929ade915)
- Add token list [`a2f0f04`](https://gitlab.open-xchange.com/frontend/core/commit/a2f0f0456cc1d71abf9c37f6757eafad1bbe3568)
- Add proper api file with dummy functions and make dialog use it [`5b4ed0b`](https://gitlab.open-xchange.com/frontend/core/commit/5b4ed0b7b47a9095988cc84641f09be61dcedf7b)
- Add simple search function [`1620de3`](https://gitlab.open-xchange.com/frontend/core/commit/1620de35d7c13997e19828d83bf913f434d47fd5)
- Add list view, create mock data from gab [`fc17e68`](https://gitlab.open-xchange.com/frontend/core/commit/fc17e688af755d92f4f6e0a585f812fd878edc45)
- Add roles [`1211bb5`](https://gitlab.open-xchange.com/frontend/core/commit/1211bb5791fe524f63535ece81dbbe652978e23a)
- Add inputs [`57dac42`](https://gitlab.open-xchange.com/frontend/core/commit/57dac42d46122f3eb682aeb4838a94cea9b578a8)
- Add list and contact selection [`5a38f66`](https://gitlab.open-xchange.com/frontend/core/commit/5a38f6697fc92f2b145e53ae8f0a32ecf0cf53af)
- Add gabonly option to enterprisepicker [`e26b261`](https://gitlab.open-xchange.com/frontend/core/commit/e26b261a6580a9690655f92f68a03b2d5d62c128)
- Add contextmenu entry [`2097dce`](https://gitlab.open-xchange.com/frontend/core/commit/2097dce41078c60b58bd0ea5e5accd67c25eea92)
- Add missing aria attributes to enterprise picker [`e516d7b`](https://gitlab.open-xchange.com/frontend/core/commit/e516d7b9b1e7ac5d312183e6f7ad15b0e639e646)
- Add input [`fbcce3e`](https://gitlab.open-xchange.com/frontend/core/commit/fbcce3e8e1e04f83ed7749e3e4273c0237f7bcb7)

### Fixed

- fixes license header format [`4a6e1d9`](https://gitlab.open-xchange.com/frontend/core/commit/4a6e1d986559ee12fa3fc15440a68e2c65f756cf)
- fixes for bugs: [`OXUIB-873`](https://jira.open-xchange.com/browse/OXUIB-873), [`OXUIB-859`](https://jira.open-xchange.com/browse/OXUIB-859), [`OXUIB-860`](https://jira.open-xchange.com/browse/OXUIB-860), [`OXUIB-861`](https://jira.open-xchange.com/browse/OXUIB-861)[`OXUIB-862`](https://jira.open-xchange.com/browse/OXUIB-862) [`50d9604`](https://gitlab.open-xchange.com/frontend/core/commit/50d96041a8f8209f3599aeb7353beccb03a8944e)
- Fixed [`OXUIB-971`](https://jira.open-xchange.com/browse/OXUIB-971) Empty folder properties dialog [`eaac4d2`](https://gitlab.open-xchange.com/frontend/core/commit/eaac4d2058faea0348e2c4913812cc28f00e0949)
- [`OXUIB-939`](https://jira.open-xchange.com/browse/OXUIB-939) - Unable to "sign out from all clients" feature in settings. [`ad2433f`](https://gitlab.open-xchange.com/frontend/core/commit/ad2433f6af4edabf3cc30af01fec08abda06d5a6)
- fixes: [`OXUIB-894`](https://jira.open-xchange.com/browse/OXUIB-894): Typo in Dutch online help for AppSuite [`8673c92`](https://gitlab.open-xchange.com/frontend/core/commit/8673c9256aa0100614e8a8c5965b4f227a60ab5c)
- Fixed [`OXUIB-903`](https://jira.open-xchange.com/browse/OXUIB-903) Getting started tour does not terminate correctly when custom items are present in setting menu [`9852c32`](https://gitlab.open-xchange.com/frontend/core/commit/9852c32412a7bccec42f1c38e5b4a9f2e44b74eb)
- [`OXUIB-570`](https://jira.open-xchange.com/browse/OXUIB-570) - Race condition when revoking access to a shared folders [`8fd8af8`](https://gitlab.open-xchange.com/frontend/core/commit/8fd8af820a01b31d019ddc66edd360551c7355f5)
- Fixes: [`OXUIB-1023`](https://jira.open-xchange.com/browse/OXUIB-1023) - permissions dialog does not support link-only case anymore [`a72dc1e`](https://gitlab.open-xchange.com/frontend/core/commit/a72dc1ed76401cd104258aeaa44ddbeb0ebb61d6)
- Fix layout, add initials, remove autocomplete [`11d3a34`](https://gitlab.open-xchange.com/frontend/core/commit/11d3a340c2dc17e9691ee3ed96896b1ada62d3ac)
- Fixed [`OXUIB-956`](https://jira.open-xchange.com/browse/OXUIB-956) Dynamic Theme: No option for topbar icon color [`1af6e3a`](https://gitlab.open-xchange.com/frontend/core/commit/1af6e3a705e8c70d3b35df7a3745bd2e25c2bcd3)
- Fixed [`OXUIB-957`](https://jira.open-xchange.com/browse/OXUIB-957) notifications for mails from external accounts? [`5ed637a`](https://gitlab.open-xchange.com/frontend/core/commit/5ed637a76ce1d3beb5603dcb4ff6cccb383058f3)
- Fixed [`OXUIB-959`](https://jira.open-xchange.com/browse/OXUIB-959) Problems with syncing appointments via CaldDAV and status "Canceled" [`5c22219`](https://gitlab.open-xchange.com/frontend/core/commit/5c22219c221dff0d43ecd427ec96d04cba2c590f)
- [`OXUIB-818`](https://jira.open-xchange.com/browse/OXUIB-818)L3 - Appointments in public folders can not be edited -&gt; resulting in endless loading [`b34e7fb`](https://gitlab.open-xchange.com/frontend/core/commit/b34e7fb22af199afd0dfd91cd544c9a48129ea59)
- fix more a11y issues in enterprise picker [`573e02b`](https://gitlab.open-xchange.com/frontend/core/commit/573e02b063ac4fdad6677674e9ed7efcf1142424)
- Fixed [`OXUIB-956`](https://jira.open-xchange.com/browse/OXUIB-956) Dynamic Theme: No option for topbar icon color [`51083c5`](https://gitlab.open-xchange.com/frontend/core/commit/51083c56de9e956b4b27f32dd6e58f2b653fc54d)
- [`OXUIB-906`](https://jira.open-xchange.com/browse/OXUIB-906) - dav sync option shown in address book settings, without dav installed [`46feb97`](https://gitlab.open-xchange.com/frontend/core/commit/46feb97e38b2388929a81e55d81416117fdb2bde)
- Fixed [`OXUIB-940`](https://jira.open-xchange.com/browse/OXUIB-940) UI window formating glitch after opening connect your device [`e433f84`](https://gitlab.open-xchange.com/frontend/core/commit/e433f84230ee42c5a8546ff178af2a0c19d2b8ac)
- bug [`OXUIB-899`](https://jira.open-xchange.com/browse/OXUIB-899) L3 drivemail: autoswitch is done too late to prevent overquota issues [`21cad19`](https://gitlab.open-xchange.com/frontend/core/commit/21cad19163b84587cdc7626e4fef0757ec2359cc)
- Fixed [`OXUIB-853`](https://jira.open-xchange.com/browse/OXUIB-853) Thread View gets lost when switching folders [`5956eb4`](https://gitlab.open-xchange.com/frontend/core/commit/5956eb489879af85189229b7da32722724b3d5ab)
- Fixed [`OXUIB-711`](https://jira.open-xchange.com/browse/OXUIB-711) Unhandled connection issue in Chat [`9d84ebb`](https://gitlab.open-xchange.com/frontend/core/commit/9d84ebbd3fecdb76778185f4c7d535560989a35e)
- Fixed [`OXUIB-857`](https://jira.open-xchange.com/browse/OXUIB-857) mail tour fails when settings cog is not a menu [`7bbc2fa`](https://gitlab.open-xchange.com/frontend/core/commit/7bbc2fa82990a7a37e2c68334c0c413d2c8598a5)
- Fix enterprise picker style [`fc77265`](https://gitlab.open-xchange.com/frontend/core/commit/fc7726595e20079b9872a1ea56839c386cde43c0)
- fix more tests [`917c9b3`](https://gitlab.open-xchange.com/frontend/core/commit/917c9b3d7db0c84f67196797cfe93a69126fc62c)
- [`OXUIB-976`](https://jira.open-xchange.com/browse/OXUIB-976) upsell only available for EAS CalDAV/CardDAV missing [`35b7736`](https://gitlab.open-xchange.com/frontend/core/commit/35b77365538b5ae64b9fe0604fcd7f5433f00eed)
- [`OXUIB-952`](https://jira.open-xchange.com/browse/OXUIB-952) -  Account recover dialog can be opened manually [`f02de13`](https://gitlab.open-xchange.com/frontend/core/commit/f02de13071299f773c468a1d10bba6224b51c7df)
- fix for [`DOCS-2709`](https://jira.open-xchange.com/browse/DOCS-2709): document preview loading slow if via direct link [`43a78c2`](https://gitlab.open-xchange.com/frontend/core/commit/43a78c2ed5cf957a5ee720796b7c5219ec1cfad6)
- [[`OXUIB-872`](https://jira.open-xchange.com/browse/OXUIB-872)] module app loader missing allow list [`9c9ef67`](https://gitlab.open-xchange.com/frontend/core/commit/9c9ef6784ee76c530812658dc718516f8abd33c9)
- [`OXUIB-1030`](https://jira.open-xchange.com/browse/OXUIB-1030) - Sharing dialog misses link settings options when opened via folder tree icon [`fcfe3e3`](https://gitlab.open-xchange.com/frontend/core/commit/fcfe3e313c8dba480914b2180a2b5c023eab9eca)
- Fixed [`OXUIB-722`](https://jira.open-xchange.com/browse/OXUIB-722)m removing Drive subscription throws error popup [`5efaa38`](https://gitlab.open-xchange.com/frontend/core/commit/5efaa38f93334e281ce6f0c9d58fe2c1f5a62c83)
- fix for [`DOCS-3686`](https://jira.open-xchange.com/browse/DOCS-3686): Removing/Adding sharing URLs in Drive highly unreliable [`42be3dd`](https://gitlab.open-xchange.com/frontend/core/commit/42be3dd679d51485b3950e8bee1d073c56e4b6ad)
- [`OXUIB-942`](https://jira.open-xchange.com/browse/OXUIB-942) - Impossible to narrow down auto-complete results [`9c77b4c`](https://gitlab.open-xchange.com/frontend/core/commit/9c77b4c815b97b5a5e5e6ba00f59b169ce1fd2c0)
- [[`OXUIB-963`](https://jira.open-xchange.com/browse/OXUIB-963)] 2fa not working with form/token login anymore [`901832f`](https://gitlab.open-xchange.com/frontend/core/commit/901832f7831f09173f17c5b8476681032da1f7da)
- Fixed [`OXUIB-900`](https://jira.open-xchange.com/browse/OXUIB-900) drivemail: user can switch off 'use drivemail' even if attachments are above threshold [`da4fe33`](https://gitlab.open-xchange.com/frontend/core/commit/da4fe331bd1e9add36d990109535738efb3ac7c2)
- Fix linting issues [`f52395b`](https://gitlab.open-xchange.com/frontend/core/commit/f52395b2fefb216cefafcf1e73bbb72a5bb6f83f)
- Fixed [`OXUIB-863`](https://jira.open-xchange.com/browse/OXUIB-863) Icon allignment seems off [`74ab950`](https://gitlab.open-xchange.com/frontend/core/commit/74ab950e5bc1b6a195defd1d77b0815141c40afa)
- Fixes: [`OXUIB-908`](https://jira.open-xchange.com/browse/OXUIB-908) - mail aliases not fully supported when sending read receipts [`9eb352d`](https://gitlab.open-xchange.com/frontend/core/commit/9eb352ddb85c24fde3933378755691d49f6da688)
- Fix itip tests [`9cca176`](https://gitlab.open-xchange.com/frontend/core/commit/9cca176597d85c4a8d141b2b1149ecfffb687e5e)
- Fixed [`OXUIB-927`](https://jira.open-xchange.com/browse/OXUIB-927) cant copy content from Connect Your Device Wizard [`d3cb650`](https://gitlab.open-xchange.com/frontend/core/commit/d3cb650e53258a8c56729c0960ea5576c61e57ca)

## [7.10.6-0]

### Added

- Add various fixes, add more icons [`299c784`](https://gitlab.open-xchange.com/frontend/core/commit/299c78456916df6a4f1ce9ba67d1617b049b2f16)
- Add all found icons, custom aliases still to do [`1da9b5d`](https://gitlab.open-xchange.com/frontend/core/commit/1da9b5d825970146c4d2e9bf195978de1509cb1b)
- Add settings for whats new dialog to documentation [`b836003`](https://gitlab.open-xchange.com/frontend/core/commit/b836003478c21c3de18008cf190140abc1db241b)
- Additional commit for [`OXUIB-830`](https://jira.open-xchange.com/browse/OXUIB-830) [`489e7d0`](https://gitlab.open-xchange.com/frontend/core/commit/489e7d0bf2bb0dc4c984860c4ce6f4d772086875)
- Additional commit for [`OXUIB-838`](https://jira.open-xchange.com/browse/OXUIB-838) XSS at OX Chat for "system" messages [`b7a4386`](https://gitlab.open-xchange.com/frontend/core/commit/b7a4386baccd73b19d6ee676f0b07cb7ade0464c)
- Add svg icons to portal widgets [`de0726b`](https://gitlab.open-xchange.com/frontend/core/commit/de0726b06b0386de373086e71d8ce4582a24c5a5)
- additional commit for [`OXUIB-816`](https://jira.open-xchange.com/browse/OXUIB-816) Planning view in calendar ignores daylight saving time [`4d3910c`](https://gitlab.open-xchange.com/frontend/core/commit/4d3910cc22d406c5044d93cc8890ed51d1fc6398)
- Additional commit for [`OXUIB-770`](https://jira.open-xchange.com/browse/OXUIB-770) Users can be lured to rogue OX Chat servers [`06f6e74`](https://gitlab.open-xchange.com/frontend/core/commit/06f6e74f61f71b6e6936fbf88136ae17163aad5f)

### Changed

- change sharing phrasing for the different apps [`cc6687f`](https://gitlab.open-xchange.com/frontend/core/commit/cc6687f098fba133f0381ad6755f6d423221ef4d)

### Fixed

- [[`OXUIB-470`](https://jira.open-xchange.com/browse/OXUIB-470)] Token login must not perform autologin call [`9d4ba4f`](https://gitlab.open-xchange.com/frontend/core/commit/9d4ba4f53a87fffbabd0b9ecf636b27ec235f6fd)
- Fixed [`OXUIB-546`](https://jira.open-xchange.com/browse/OXUIB-546): Fix and consolidate limit and quota checks for Mail Compose [`1190f82`](https://gitlab.open-xchange.com/frontend/core/commit/1190f829b376af97156bede19b14c0e8a08d9185)
- Fixed [`OXUIB-697`](https://jira.open-xchange.com/browse/OXUIB-697) setting the mail product name in onboarding does not work properly [`0db1b80`](https://gitlab.open-xchange.com/frontend/core/commit/0db1b80aa7420dca299090416e50d133f7e3ddff)
- Fixed [`OXUIB-698`](https://jira.open-xchange.com/browse/OXUIB-698) order of login data in the onboarding wizard is not correct [`a12ff3e`](https://gitlab.open-xchange.com/frontend/core/commit/a12ff3e374b05758fa2db4514c1b5d198bc5bbb3)
- Fixed [`OXUIB-665`](https://jira.open-xchange.com/browse/OXUIB-665) Guided tour displays over What's new dialog [`b0bbea1`](https://gitlab.open-xchange.com/frontend/core/commit/b0bbea1dfc748f44dd872191f09cdc5e034e1b51)
- Fix missing icons in drive Toolbar, also fix more e2e tests [`7ee0d0c`](https://gitlab.open-xchange.com/frontend/core/commit/7ee0d0c9431c29288c46cc8066b419b83b80f99a)
- [`OXUIB-514`](https://jira.open-xchange.com/browse/OXUIB-514) Attachments deleted from draft return after saving draft [`2573ba4`](https://gitlab.open-xchange.com/frontend/core/commit/2573ba4c7731b97c6af4eaad99bade85060e4817)
- [`OXUIB-733`](https://jira.open-xchange.com/browse/OXUIB-733) OX Webmail - After some Onclick action focus does not move [`71c503e`](https://gitlab.open-xchange.com/frontend/core/commit/71c503e82b01927dc14ff944f541449a282a6654)
- Fix mobile toolbar icons in contacts, drive and tasks [`7d65684`](https://gitlab.open-xchange.com/frontend/core/commit/7d65684510bc8826c86ab44cc7b72706d01142c0)
- [`OXUIB-679`](https://jira.open-xchange.com/browse/OXUIB-679) - Missing folder when guest user tries to invite shared contact to an appointment [`0be63c9`](https://gitlab.open-xchange.com/frontend/core/commit/0be63c93a85b90fb702c9e2072782db6f207f46d)
- Fix launcher e2e tests [`10efb80`](https://gitlab.open-xchange.com/frontend/core/commit/10efb8045aebed42f0760f20cabb776c55329ba8)
- Fixed [`OXUIB-766`](https://jira.open-xchange.com/browse/OXUIB-766) No conflict check when accepting appointments via inline action [`a6e6c52`](https://gitlab.open-xchange.com/frontend/core/commit/a6e6c5208031ddd757a300bc7052a4962ca25359)
- Fixed [`OXUIB-749`](https://jira.open-xchange.com/browse/OXUIB-749) drive guided tour pauses if sharing is disabled [`0f09776`](https://gitlab.open-xchange.com/frontend/core/commit/0f09776fd4d99356e078008ae84ccfacc789ee48)
- [`OXUIB-799`](https://jira.open-xchange.com/browse/OXUIB-799) - Upsell default icon not used for action Save in Drive [`8f448c3`](https://gitlab.open-xchange.com/frontend/core/commit/8f448c30084e325662a33ff4f5365bbd643c4c52)
- Fixed [`OXUIB-714`](https://jira.open-xchange.com/browse/OXUIB-714) Distribution list created from appointments uses wrong display names [`5afe8ee`](https://gitlab.open-xchange.com/frontend/core/commit/5afe8eede9e1ec61451253f73b042f4943992dd4)
- Fix more e2e tests waiting for refresh icon [`5705520`](https://gitlab.open-xchange.com/frontend/core/commit/5705520c52a5a6d1f750abf0791eb44904d611c3)
- [`OXUIB-787`](https://jira.open-xchange.com/browse/OXUIB-787) - Documentation about OX Drive Client Widget is wrong [`d89d37d`](https://gitlab.open-xchange.com/frontend/core/commit/d89d37d89cae5684362d486174636faa277e016e)
- Fix [`OXUIB-815`](https://jira.open-xchange.com/browse/OXUIB-815) CSS broken in bottom toolbar of folder tree [`b20bf93`](https://gitlab.open-xchange.com/frontend/core/commit/b20bf931e1b0cede8a6bc014e51ce0b2965d7775)
- Fixed [`OXUIB-783`](https://jira.open-xchange.com/browse/OXUIB-783) Race condition when loading translations [`babb336`](https://gitlab.open-xchange.com/frontend/core/commit/babb33674ebfa9780c7e8a36ea82120fb4ebf125)
- Fixed [`OXUIB-830`](https://jira.open-xchange.com/browse/OXUIB-830) connect your device functions missing/changed/inconsistent [`7040d77`](https://gitlab.open-xchange.com/frontend/core/commit/7040d772971324138b514e71dd54c3ae643544f4)
- Fixed [`OXUIB-721`](https://jira.open-xchange.com/browse/OXUIB-721) Guided tour for this app breaks in Settings [`4f6984b`](https://gitlab.open-xchange.com/frontend/core/commit/4f6984b3859d7f94ac5d43e0b028f342e4ed160e)
- Fixed [`OXUIB-759`](https://jira.open-xchange.com/browse/OXUIB-759) and [`OXUIB-760`](https://jira.open-xchange.com/browse/OXUIB-760) [`97abc9d`](https://gitlab.open-xchange.com/frontend/core/commit/97abc9ddfe3f9711fcdf6cb3cc6a054d0b1288f6)
- Fixed [`OXUIB-514`](https://jira.open-xchange.com/browse/OXUIB-514): Attachments deleted from draft return after saving draft [`14e664d`](https://gitlab.open-xchange.com/frontend/core/commit/14e664df0e31ccc38146a7885a419caa222d27dd)
- Fixed [`OXUIB-777`](https://jira.open-xchange.com/browse/OXUIB-777): Improve "Apply mail filter" action on folders [`3c94e91`](https://gitlab.open-xchange.com/frontend/core/commit/3c94e91a81704c0dbeea4c5e6e1766f33020c686)
- Fix mobile calendar icons [`97da40c`](https://gitlab.open-xchange.com/frontend/core/commit/97da40c05a1085a8732576d34312465304d107cd)
- Fixed [`OXUIB-719`](https://jira.open-xchange.com/browse/OXUIB-719) Getting started tour breaks if there's no onboarding [`ebd8c20`](https://gitlab.open-xchange.com/frontend/core/commit/ebd8c20ec3b60abe663b0a0c6e7eb765dadc8586)
- Fixed [`OXUIB-671`](https://jira.open-xchange.com/browse/OXUIB-671) Connect your Device called from Portal widget displays in old styled dialog [`71a45db`](https://gitlab.open-xchange.com/frontend/core/commit/71a45db7589de9874e22b9c0b1e246176e1df252)
- Fixed [`OXUIB-677`](https://jira.open-xchange.com/browse/OXUIB-677) mail folder not visible after creation [`5037531`](https://gitlab.open-xchange.com/frontend/core/commit/50375311abe7a264c87d98103df7a3bd113c8a03)
- [`OXUIB-839`](https://jira.open-xchange.com/browse/OXUIB-839) - "Setup wizard" partially covered by "Whats New" [`74f032c`](https://gitlab.open-xchange.com/frontend/core/commit/74f032c4e91a775ce2149c3fd7d3838393369962)
- Fixed [`OXUIB-688`](https://jira.open-xchange.com/browse/OXUIB-688) Sender name not updated in webmail [`baf7fe8`](https://gitlab.open-xchange.com/frontend/core/commit/baf7fe8fbe32b7e8551784fe5c514503a085ba6b)
- [`OXUIB-825`](https://jira.open-xchange.com/browse/OXUIB-825) mobile Drive list view selection box looks wrong [`3cac74f`](https://gitlab.open-xchange.com/frontend/core/commit/3cac74f55d16586ade16768b6f4bfbf69dc11e10)
- [`OXUIB-823`](https://jira.open-xchange.com/browse/OXUIB-823) - Signature in Settings not visible [`74d2f76`](https://gitlab.open-xchange.com/frontend/core/commit/74d2f760908f38fed7931220bf5440c85461fd67)
- Fix unit tests and e2e actors [`531a086`](https://gitlab.open-xchange.com/frontend/core/commit/531a086790d18db70d92308290d6184ba0d31ab2)
- Fixed [`CAS-378`](https://jira.open-xchange.com/browse/CAS-378): Own user not listed when creating a group chat [`27373d3`](https://gitlab.open-xchange.com/frontend/core/commit/27373d3c168923408f6bb8eba4ebb3f3f86725bd)
- Fix styles when chat is disabled [`41fd373`](https://gitlab.open-xchange.com/frontend/core/commit/41fd373e633bc1ddaec2719d0f73c34900825902)
- [`OXUIB-724`](https://jira.open-xchange.com/browse/OXUIB-724) Action links in Halo view not working for external users [`cf1e21e`](https://gitlab.open-xchange.com/frontend/core/commit/cf1e21e0623ad23240dfccff35b57275e858debf)
- Fixed [`CAS-351`](https://jira.open-xchange.com/browse/CAS-351): Chat jumps to beginning of conversation after window detach [`a7f164a`](https://gitlab.open-xchange.com/frontend/core/commit/a7f164a8b376c36f86b776f03a040b39119eb644)
- Fixed [`OXUIB-816`](https://jira.open-xchange.com/browse/OXUIB-816) Planning view in calendar ignores daylight saving time [`e927409`](https://gitlab.open-xchange.com/frontend/core/commit/e927409a79996b1027ca5641552d5d7e603866b2)
- Fixed [`OXUIB-770`](https://jira.open-xchange.com/browse/OXUIB-770) Users can be lured to rogue OX Chat servers [`8ca1967`](https://gitlab.open-xchange.com/frontend/core/commit/8ca196760f5a8cc683e84157047024508f9c5ee5)
- Fixed [`OXUIB-758`](https://jira.open-xchange.com/browse/OXUIB-758) Global Address Book still available through Favorites after unsubscribe [`924aa5d`](https://gitlab.open-xchange.com/frontend/core/commit/924aa5d4dc4923fa44b8b44e023c89b97eea5fb0)
- [`OXUIB-812`](https://jira.open-xchange.com/browse/OXUIB-812)- Missing alert when mail not saved due to exceeded quota [`8cb0ba2`](https://gitlab.open-xchange.com/frontend/core/commit/8cb0ba2d8348e40151a51b184585d9f733096443)
- Fixed [`OXUIB-828`](https://jira.open-xchange.com/browse/OXUIB-828) connect your device - OX Drive entry not removeable [`c224747`](https://gitlab.open-xchange.com/frontend/core/commit/c22474768c3b8a77408f7fad277acc345c6184ec)
- [`OXUIB-809`](https://jira.open-xchange.com/browse/OXUIB-809) - XSS vulnerability in blankshield [`2efc845`](https://gitlab.open-xchange.com/frontend/core/commit/2efc845a54a1341a2e7cd2753126e64717d2eb03)
- bug [`OXUIB-741`](https://jira.open-xchange.com/browse/OXUIB-741)L3 wrong date in filter rule, previous day [`8fa8fb1`](https://gitlab.open-xchange.com/frontend/core/commit/8fa8fb11b61d88fde6727f60b1d089960eb83841)
- Fix e2e tests that don't use clicktoolbar [`2d8130f`](https://gitlab.open-xchange.com/frontend/core/commit/2d8130fe275f3bc8b55ed2e9c0904b7441f0bf12)
- bug [`OXUIB-675`](https://jira.open-xchange.com/browse/OXUIB-675) Unread mails folder shows all mails [`0439c7a`](https://gitlab.open-xchange.com/frontend/core/commit/0439c7a2b6ffe634361b5f7f75cf9877fb8c71a9)
- [`OXUIB-839`](https://jira.open-xchange.com/browse/OXUIB-839) - "Setup wizard" partially covered by "Whats New" [`a101f38`](https://gitlab.open-xchange.com/frontend/core/commit/a101f3826e6d4ab334da81e0ec2351713c06b932)
- Fixed [`OXUIB-782`](https://jira.open-xchange.com/browse/OXUIB-782) Unexpected control order in login screen if "forgotPassword" is enabled [`4b1c9d3`](https://gitlab.open-xchange.com/frontend/core/commit/4b1c9d3bcb4570fcb17694b0e514abce38b22756)
- [`OXUIB-753`](https://jira.open-xchange.com/browse/OXUIB-753) Call history styles broken [`eb6625e`](https://gitlab.open-xchange.com/frontend/core/commit/eb6625e92bf151d25b7189577a5786fea90e7ac7)
- Fixed overlapping initials and background images [`c574399`](https://gitlab.open-xchange.com/frontend/core/commit/c57439943d7271553d6e6c44905613057640ec78)
- Fixed [`OXUIB-681`](https://jira.open-xchange.com/browse/OXUIB-681) Appointment with a second user=&gt;z-index is wrong [`d6991d9`](https://gitlab.open-xchange.com/frontend/core/commit/d6991d9268c18a94a6bd2eaa46830ae909221b50)
- Fixed [`OXUIB-847`](https://jira.open-xchange.com/browse/OXUIB-847) wrong format for onboarding rampup data [`ff29457`](https://gitlab.open-xchange.com/frontend/core/commit/ff294574b24330acb9daae0847734d055e750e64)
- Fix custom name e2e test [`e70f836`](https://gitlab.open-xchange.com/frontend/core/commit/e70f83662ff2894b17b2cbda998b8a4a827cfb21)
- Fix caret in planning view [`3e15eba`](https://gitlab.open-xchange.com/frontend/core/commit/3e15eba9f9907247f112561ed9284792b5048a15)
- Fixed [`OXUIB-703`](https://jira.open-xchange.com/browse/OXUIB-703) Untranslated strings to rotate avatar [`3f4d3bb`](https://gitlab.open-xchange.com/frontend/core/commit/3f4d3bb75a9a5b2d4ce88365b5fdf51bb1e839ef)
- Fixed [`OXUIB-689`](https://jira.open-xchange.com/browse/OXUIB-689). Chat - while searching for an appointment you are not able to send no chat messages [`08f9e03`](https://gitlab.open-xchange.com/frontend/core/commit/08f9e03eb1da0e1e4dbf20c0b98596bc93c863e5)
- Fixed [`OXUIB-685`](https://jira.open-xchange.com/browse/OXUIB-685) Unable to remove 'Connect your Device' from settings menu via capability client-onboarding [`fca90fa`](https://gitlab.open-xchange.com/frontend/core/commit/fca90fa5a048ab59d15287e84e5f192c0fffab08)
- Fixed [`OXUIB-670`](https://jira.open-xchange.com/browse/OXUIB-670) Unable to enter phone number for SMS reminder [`9a425ff`](https://gitlab.open-xchange.com/frontend/core/commit/9a425ffc7ac61e882cef8ebc53a2a01fb8246307)
- Fixed [`OXUIB-807`](https://jira.open-xchange.com/browse/OXUIB-807) Changing appointment color hard to find, UX/A11y issue [`b63816e`](https://gitlab.open-xchange.com/frontend/core/commit/b63816e6ab4329688dc7079be385902c1ff21c21)
