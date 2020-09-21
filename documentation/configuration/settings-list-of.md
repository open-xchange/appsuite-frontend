---
title: Settings list
---
# Introduction
This page shows a list of useful config option to customize App Suite UI. We recommend to read the [main article](../configuration.html) on how to configure App Suite UI first.

## Namespaces
Settings are logically divided via namespaces for each module. The namespace itself is divided by a doube slash `//` from the setting's name when written down to a config file.
Ensure to always use the double slash in your settings string, otherwise this will lead to errors and your setting will
not work.

For example `io.ox/core//someSetting` or `io.ox/mail//anotherMailSetting`.

In this case we have two different namespaces, `io.ox/core` and `io.ox/mail`. The setting `someSetting` only exists in the core namespace, `anotherMailSetting` only in mail accordingly.

# Data types
Ensure to always use the expected data type for a setting. This table lists some examples when they are set in a 'settings property file' (sometimes referenced as 'ui property file').

| Data type  | Example                                         |
|------------|-------------------------------------------------|
| `<bool>`   | io.ox/core//features/dedicatedLogoutButton=true |
| `<string>` | io.ox/core//features/windowHeaderPosition="top" |
| `<number>` | io.ox/core//apps/quickLaunchCount=5             |
| `<array>`  | io.ox/tasks//currencies=["CAD","CHF","EUR"]     |

# Feature toggles

App Suite UI offers different feature toggles. These toggles control the appearance (or flavor) of different features in the UI.

<config>io.ox/core//features/dedicatedLogoutButton=`<bool>`</config>
Show a logout button at the topbar. Default is `false`.

<config>io.ox/core//features/folderIcons=`<bool>`</config>
Show icons in the folder tree next to folder labels. Default is `false`.

<config>io.ox/core//features/logoutButtonHint=`<bool>`</config>
Shows a reminder tooltip if the user has not logged during the last page visit. Default is `false`.

<config>io.ox/core//features/reloginPopup=`<bool>`</config>
Show a modal dialog to enable an inline relogin without showing the login page. Default is `true` (for non-oidc and non-saml environments)

<config>io.ox/core//features/storeSavePoints=`<bool>`</config>
Enable/disable restorepoints for edit dialogs. Default is `true`.

<config>io.ox/core//features/validateMailAddresses=`<bool>`</config>
Enable validiation for email addresses in mail compose dialog. Default is `true`.

<config>io.ox/core//features/validatePhoneNumbers=`<bool>`</config>
Enable validiation for phone numbers. Default is `false`.

<config>io.ox/core//features/windowHeaderPosition=`<string>`</config>
Placement of buttons in new/edit dialogs. Default is 'bottom' (`'top', 'bottom'`)

<config>io.ox/core//disabledSettingsPanes=`<string>`</config>
Comma-separated list of extension point ids of _io.ox/settings/pane_. Disable one or more settings panes and it's subgroup extension points (easily identifiable as "&folder=virtual/settings/<id>" in adress bar). Default is unset;

<config>io.ox/core//pdf/enablePreconversionOnUpload=`<bool>`</config>
Enable/disable PDF preconversion of office documents on file upload and when a new file version is added. Default is `true`.

<config>io.ox/core//pdf/enablePreconversionOnMailFetch=`<bool>`</config>
Enable/disable PDF preconversion of office documents for mail attachments. Default is `true`.

<config>io.ox/core//pdf/enableRangeRequests=`<bool>`</config>
Enable/disable range requests support to fetch PDF rendering data in chunks. Default is `true`.

## Topbar / Apps

<config>io.ox/core//apps/quickLaunch=`<string>`</config>
Default Apps for quick launcher. Comma-separated string of App IDs
Default: `'io.ox/mail/main,io.ox/calendar/main,io.ox/files/main'`

<config>io.ox/core//apps/quickLaunchCount=`<number>`</config>
How many quick launch icons should appear in the Topbar by default (default: `3`)

<config>io.ox/core//logoFileName=`<string>`</config>
Change the default file name for the logo in the topbar. Default (`logo.png`)

<config>io.ox/core//logoAction=`<string>`</config>
Change the action when clicking on the topbar logo. Either a URI to open in a new tab
or an App ID. I.e. `https://sample.com` or `io.ox/mail/main`. Default is unset.

## Notifications

<config>io.ox/core//autoOpenNotification=`<bool>`</config>
Open notification area automatically on new notification. Default is `true`.

<config>io.ox/core//notificationsHidingTimer=`<number>`</config>
Hide notifications for n milliseconds after the user clicks on 'Notify me again later' (default is `1800000` (30 minutes)).

<config>io.ox/core//showDesktopNotifications=`<bool>`</config>
Show native desktop notifications. Default `true`.
Important: Depends also on browser settings.

<config>io.ox/core//properties/contactImageMaxWidth=`<number>`</config>
Maximum target image width when croping contact/user images in pixels (default: `500`).

## Feedback dialog

<config>io.ox/core//feedback/show=`<string>`</config>
Show one or more feedback buttons. Default value is `both` which shows a dropdown entry in the settings menu and a button in the main content window (topbar/side/both).

<config>io.ox/core//feedback/supportlink`<string>`</config>
Hyperlink to a support site referenced in the feedback dialog. Default is unset.

<config>io.ox/core//feedback/position`<string>`</config>
Set position of the feedback button. Default value is `right`. (`left|right`).

<config>io.ox/core//feedback/showHover=`<bool>`</config>
Show rating string on mouse hover in feedback dialog. Default `true`.

<config>io.ox/core//feedback/showModuleSelect=`<bool>`</config>
Defines if the feedback dialog is aware of it's current App and the rating is based on this. If set to "true" every App can be rated regardless which App is currently running. Default `true`.

## Misc

<config>io.ox/core//groups/limit=`<number>`</config>
Fetch limit for groups plugin when requesting details of members. Default `1000`

<config>io.ox/core//refreshInterval=`<number>`</config>
Automatic UI refresh interval in milliseconds. Default is `300000` (5 minutes).

<config>io.ox/core//settings/downloadsDisabled=`<bool>`</config>
Enables/disables download pane for additional software components in settings. Default `false`.

<config>io.ox/core//theme=`<string>`</config>
Current user theme. Default is `default`


## Mail compose: tinyMCE text editor

<config>io.ox/core//maxUploadIdleTimeout=`<number>`</config> 200000
Timeout in miliseconds for contenteditable-editor in milliseconds when adding inline images. Default is `200000`.

<config>io.ox/core//tinyMCE/theme_advanced_buttons1=`<string>`</config>
List of tinyMCE toolbar actions separated by space - targets toolbar1<br>
Default: `'*undo *redo | bold italic underline | bullist numlist outdent indent'`

<config>io.ox/core//tinyMCE/theme_advanced_buttons2=`<string>`</config>
List of tinyMCE toolbar actions separated by space - targets toolbar2)
Default: empty

<config>io.ox/core//tinyMCE/theme_advanced_buttons3=`<string>`</config>
List of tinyMCE toolbar actions separated by space - targets toolbar3
Default: empty

<config>io.ox/core//tinyMCE/font_format=`<string>`</config>
List of availabe fonts (also used for settings pane).
Default:

    "System=-apple-system,BlinkMacSystemFont,helvetica,sans-serif;Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats"


## Metrics

<config>io.ox/core//tracking/enabled=`<bool>`</config>
Enable tracking in App Suite UI

<config>io.ox/core//tracking/donottrack=`<bool>`</config>
Respect "do not track" browser setting


### Matomo, formerly known as Piwik

<config>io.ox/core//tracking/piwik/enabled=`<bool>`</config>
Enable Matomo adapter for tracking

<config>io.ox/core//tracking/piwik/lib=`<string>`</config>
Matomo js library url

<config>io.ox/core//tracking/piwik/api=`<string>`</config>
Matomo url of server endpoint

<config>io.ox/core//tracking/piwik/id=`<string>`</config>
Matomo id


### Piwik Pro

<config>io.ox/core//tracking/piwikpro/enabled=`<bool>`</config>
Enable Piwik Pro adapter for tracking

<config>io.ox/core//tracking/piwikpro/lib=`<string>`</config>
Piwik Pro js library url


### Google Analytics

<config>io.ox/core//tracking/analytics/enabled=`<bool>`</config>
Enable Google Analytics adapter

<config>io.ox/core//tracking/analytics/id=`<string>`</config>
Google analytics id

<config>io.ox/core//tracking/analytics/url=`<string>`</config>
Analytics URL, usually `https://www.google-analytics.com/analytics.js`

<config>io.ox/core//tracking/analytics/mapping=`<string>`</config>
Optional mappings for custom dimensions


### Misc

<config>io.ox/core//tracking/console/enabled=`<bool>`</config>
Enables debugging console adapter that logs events to browser console.

<config>io.ox/core//tracking/context/enabled=`<bool>`</config>
Enabled context tracker that provides last 10 tracked events via `window.ox.metrics`


## Upsell

<config>io.ox/core//upsell/enabled=`<bool>`</config>
List of capabilities that are available for upsell.

<config>io.ox/core//upsell/defaultIcon=`<string>`</config>
Default icon used for upsell 'decoration'.

<config>io.ox/core//upsell/premium/folderView/visible=`<bool>`</config>
Show premium link in folder tree.

<config>io.ox/core//upsell/premium/folderView/closedByUser=`<bool>`</config>
Is the user allowed to hide the premium link permanently.

<config>io.ox/core//features/upsell/[feature-id]/enabled=`<bool>`</config>
Upsell enabled for feature.

<config>io.ox/core//features/upsell/[feature-id]/color=`<string>`</config>
Customize upsell 'decoration' appearance.

<config>io.ox/core//features/upsell/[custom-id]/icon=`<string>`</config>
Customize upsell 'decoration' appearance.


## Password
If the capability `'edit_password'` is set, a user can change his own password in App Suite UI.

<config>io.ox/core//password/showStrength=`<bool>`</config>
Show password strength

<config>io.ox/core//password/minLength=`<number>`</config>
Passwort minimum length

<config>io.ox/core//password/maxLength=`<number>`</config>
Password max length

<config>io.ox/core//password/regexp=`<string>`</config>
Check new password against a regular expression (i.e. "is there at least one upper case letter")

<config>io.ox/core//password/special=`<string>`</config>
Required special characters for new passwords


### Client Onboarding
<config>io.ox/core//features/clientOnboardingHint/enabled=`<bool>`</config>
Enables a hint on mobiles to inform about the onboarding Wizard (true/false)

<config>io.ox/core//features/clientOnboardingHint/remaining=`<number>`</config>
Number of times hint is beeing shown. The protection of this setting needs to be disabled in any case.

### Onboarding

**Capablities needed for different apps**
To disable or enable different apps for client onboarding, the onboarding wizard checks enabled capabilities.
The corresponding capabilites for the different apps are:
- Mail App: `webmail mobile_mail_app`
- Drive App: `infostore`
- Calendar/ CalDav: `calendar caldav`
- Address Book/ CardDav: `contacts carddav`
- Exchange Active Sync: `active_sync`

<config>io.ox/core//onboardingWizard=`<bool>`</config>
Enabled new onboarding wizard and disables the old one

<config>io.ox/onboarding//productNames/mail=`<string>`</config>
Name of the webmail product. Defaults to `OX Mail`

<config>io.ox/onboarding//productNames/drive=`<string>`</config>
Name of the drive product. Defaults to `OX Drive`

<config>io.ox/onboarding//android/storeIcon=`<string>`</config>
Path to Google Play Store icon

<config>io.ox/onboarding//android/mailapp/url=`<string>`</config>
Link to mail app in Google Play Store

<config>io.ox/onboarding//android/mailapp/icon=`<string>`</config>
Path to mail app icon for Android

<config>io.ox/onboarding//android/driveapp/url=`<string>`</config>
Link to drive app in Google Play Store

<config>io.ox/onboarding//android/driveapp/icon=`<string>`</config>
Path to drive app icon for Android

<config>io.ox/onboarding//ios/storeIcon=`<string>`</config>
Path to iOS App Store icon

<config>io.ox/onboarding//ios/mailapp/url=`<string>`</config>
Link to mail app in iOS App Store

<config>io.ox/onboarding//ios/mailapp/icon=`<string>`</config>
Path to mail app icon for iOS

<config>io.ox/onboarding//ios/driveapp/url=`<string>`</config>
Link to drive app in iOS App Store

<config>io.ox/onboarding//ios/driveapp/icon=`<string>`</config>
Path to drive app icon for iOS

<config>io.ox/onboarding//macos/storeIcon=`<string>`</config>
Path to Mac App Store icon

<config>io.ox/onboarding//macos/driveapp/url=`<string>`</config>
Link to drive app in Mac App Store

<config>io.ox/onboarding//macos/driveapp/icon=`<string>`</config>
Path to drive app icon for MacOS

<config>io.ox/onboarding//windows/driveapp/url=`<string>`</config>
Link to installation file of drive client for Windows

## Misc

<config>io.ox/core//autoLogout=`<bool>`</config>
Timeout until a user is logged out automatically if inactive

<config>io.ox/core//autoStart=`<string>`</config>
First App to start after login, Default: `io.ox/mail/main`

<config>io.ox/core//autoStartMobile=`<string>`</config>
First App to start after login on mobile devices. Default: `io.ox/mail/main`

<config>io.ox/core//selectionMode=`<string>`</config>
Specifies behavior when selecting items in mail listview. Default: `normal` ('normal'|'alternative'|'simple')

# Portal

Please read http://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins for detailed
information and expamples how to customize the App Suite UI Portal and pre configure widgets for users.

## First Start Widget

<config>io.ox/portal//settings/getStartedLink=`<string>`</config>
Target of 'get started' labled link in 'getting started' widget

## Widget properties

<config>io.ox/portal//widgets/user/\[widgetid\]/color=`<string>`</config>
Color of title and highligting within widget preview/content

<config>io.ox/portal//widgets/user/\[widgetid\]/enabled=`<bool>`</config>
Enabled state

<config>io.ox/portal//widgets/user/\[widgetid\]/index=`<string>`</config>
Specifies order of widgets. I.e. `first` or numeric value

<config>io.ox/portal//widgets/user/\[widgetid\]/inverse=`<bool>`</config>
Use color for background instead of title

<config>io.ox/portal//widgets/user/\[widgetid\]/plugin=`<string>`</config>
Reference to tht plugin id/path. I.e `"plugins/portal/birthdays/register"`

<config>io.ox/portal//widgets/user/\[widgetid\]/props=`<string>`</config>
Additional data like custom description or related configuration

<config>io.ox/portal//widgets/user/\[widgetid\]/type=`<string>`</config>
Widget type like `rss` or `stickyfile`


## Misc

<config>io.ox/portal//mobile/summaryView=`<bool>`</config>
User setting, show only a small summary view of each widget on smartphones


# Mail

<config>io.ox/mail//allowHtmlImages=`<bool>`</config>
Allow pre-loading of externally linked images.

<config>io.ox/mail//allowHtmlMessages=`<bool>`</config>
Allow HTML formatted emails.

<config>io.ox/mail//displayEmoticons=`<bool>`</config>
Display emoticons as graphics in text emails.

<config>io.ox/mail//isColorQuoted=`<bool>`</config>
Colored quotes in emails.

<config>io.ox/mail//useFixedWidthFont=`<bool>`</config>
Use fixed-width font for text emails.

<config>io.ox/mail//beautifyPlainText=`<bool>`</config>
Prettify plain text emails.

<config>io.ox/mail//sendDispositionNotification=`<bool>`</config>
Show requests for read receipts.

<config>io.ox/mail//autoselectMailOnStart=`<bool>`</config>
Automatically select first read mail on mail app start. (Default `true`)

<config>io.ox/mail//features/textPreview=`<bool>`</config>
Fetch mail teaser texts if available, only supported by Dovecot for primary accounts. Also needs MW config. (Default `true`)

## User Preferences:

<config>io.ox/mail//removeDeletedPermanently=`<bool>`</config>
Permanently remove deleted emails instead of moving them to the trash folder first (`true|false`)

<config>io.ox/mail//contactCollectOnMailTransport=`<bool>`</config>
Automatically collect contacts in the folder "Collected addresses" while sending - depends on capability `'collect_email_addresses'` (`true|false`)

<config>io.ox/mail//contactCollectOnMailAccess=`<bool>`</config>
Automatically collect contacts in the folder "Collected addresses" while reading - depends on capability `'collect_email_addresses'` (`true|false`)

<config>io.ox/mail//features/registerProtocolHandler=`<bool>`</config>
Ask for mailto link registration (`true|false`)

<config>io.ox/mail//features/trusted/user=`<string>`</config>
User-defined, comma-separated list of mail adresses or specific domains
which will be whitlisted for loading external images in HTML mails.

<config>io.ox/mail//features/trusted/admin=`<string>`</config>
Admin-defined, comma-separated list of mail adresses or specific domains
which will be whitlisted for loading external images in HTML mails. I.e. useful for
customer care email addresses or domains.

<config>io.ox/mail//unseenMessagesFolder=`<bool>`</config>
Show folder with all unseen messages (`true|false`)

<config>io.ox/mail//playSound=`<bool>`</config>
Play sound on incoming push email - depends on capability `'websocket'` otherwise
the option will not be shown.

<config>io.ox/mail//notificationSoundName=`<string>`</config>
Default sound to play on incoming push mail. Default `bell`, can be one of
`bell, marimba, wood, chimes`

### Compose

<config>io.ox/mail//appendVcard=`<bool>`</config>
Append vCard to email.

<config>io.ox/mail//appendMailTextOnReply=`<bool>`</config>
Insert the original email text to a reply.

<config>io.ox/mail//confirmReplyToMailingLists=`<bool>`</config>
Confirm recipients when replying to a mailing list. Useful to avoid
flooding mailing lists with unwanted replies to the list.

<config>io.ox/mail//forwardMessageAs=`<string>`</config>
Value `Inline` (default) or `Attachment`.

<config>io.ox/mail//messageFormat=`<string>`</config>
Value `html` (default), `text` or `alternative`.

<config>io.ox/mail//defaultSendAddress=`<string>`</config>
Default sender address from available accounts. Default not set.

<config>io.ox/mail//autoSaveAfter=`<number>`</config>
Interval to update composition space during compose in milliseconds. Default: `15000` (15 seconds)

<config>io.ox/mail//autobcc=`<bool>`</config>
Always add the following recipient to BCC.

<config>io.ox/mail//defaultFontStyle/family=`<string>`</config>
Value `browser-default`, `Andale Mono` or one of `io.ox/core//tinyMCE/font_format`. Desktop only.

<config>io.ox/mail//defaultFontStyle/size=`<string>`</config>
Value `browser-default` or i.e. `8pt`. Desktop only.

<config>io.ox/mail//defaultFontStyle/color=`<string>`</config>
Default font color as CSS color string. I.e. `#334455`

<config>io.ox/mail//showReplyTo/configurable=`<bool>`</config>
Show 'reply to' field

<config>io.ox/mail//maxSize/compose=`<number>`</config>
Max size of returned characters for mail reply/forward in bytes (API parameter) Default: `524288` (512 kB)

<config>io.ox/mail//maxSize/view=`<number>`</config>
Max size of returned characters for mail viewing in bytes. Default: `102400` (100 kB)

<config>io.ox/mail//features/instantAttachmentUpload=`<bool>`</config>
Feature toggle to enable/disable instant attachment upload. Default is `true`

### Mail compose: Image resize

<config>io.ox/mail//features/imageResize/enabled=`<bool>`</config>
Feature toggle to enable resizing of images

<config>io.ox/mail//features/imageResize/default=`<string>`</config>
Feature toggle to enable resizing of images (default `320`)

<config>io.ox/mail//features/imageResize/small=`<number>`</config>
Size of the target image (longest edge) for a small image as integer (default `320`)

<config>io.ox/mail//features/imageResize/medium=`<number>`</config>
Size of the target image (longest edge) for a medium image as integer (default `640`)

<config>io.ox/mail//features/imageResize/large=`<number>`</config>
Size of the target image (longest edge) for a large image as integer (default `1280`)

<config>io.ox/mail//features/imageResize/quality=`<number>`</config>
Quality for the compression while resizing as float (default `0.75`)

<config>io.ox/mail//features/imageResize/imageSizeThreshold=`<number>`</config>
Threshold for the size in pixel of the longest edge after which a resize is recommended as integer (default `1024`)

<config>io.ox/mail//features/imageResize/fileSizeMax=`<number>`</config>
Maximum size in bytes that will be resized as integer, if one image exceeds this threshold the resize dropdown will not be displayed (default `10485760`)


## Signatures

<config>io.ox/mail//defaultSignature=`<number>`</config>
ID of default signature. Signatures are stored as Snippets on MW (DB)

<config>io.ox/mail//defaultReplyForwardSignature=`<number>`</config>
ID of default forward and reply signature. Fallback is value of 'defaultSignature'

<config>io.ox/mail//defaultSignaturePosition=`<string>`</config>
value is `above` or `below` (default `below`)

<config>io.ox/mail//mobileSignatureType=`<string>`</config>
Value is `custom` or `none`. If `custom` is set, signature from `io.ox/mail//mobileSignature`is taken.

<config>io.ox/mail//mobileSignature=`<string>`</config>
Mobile signature as plain text string.

<config>io.ox/mail//compose/signatureLimit=`<number>`</config>
Number of signatures listed in options dropdown of mail compose (default 2).

## Misc

<config>io.ox/mail//attachOriginalMessage=`<bool>`</config>
Attach original message on touch devices

<config>io.ox/mail//features/accounts/configureUnifiedInboxOnCreate=`<bool>`</config>
Allow enabling unified inbox for an account at the "Add Mail account" dialog

<config>io.ox/mail//features/authenticity=`<bool>`</config>
Enables the authenticity feature. Please note that `com.openexchange.mail.authenticity.enabled` on MW has to be turned on as well. (default: false)

<-- currently hardcoded as 'fail_neutral_trusted' and 'protected' by MW and not adjustable by any property file change or user interaction.
<config>io.ox/mail//authenticity/level=`<string>`</config>
If authenticity is enabled on MW and UI (see `features/authenticity`) and this value is not marked as proteced, the user can select a level which
controls how strict the authenticty results are shown at UI side. (default: `none`, values: `none`, `fail_neutral_trusted` and `all`)
-->

<config>io.ox/mail//features/autoCollapseBlockquotes=`<bool>`</config>
If enabled, blockquotes larger than 300 chars will be collapsed.

<config>io.ox/mail//features/cleanSubjects=`<bool>`</config>
Remove clutter from subjects like `AW:` or `RE:`

<config>io.ox/mail//features/notifyOnSent=`<bool>`</config>
Show an infopopup after mail was send successfully. Default `false`

<config>io.ox/mail//listview/primaryPageSize=`<number>`</config>
Initial size of mail list until pagination will start. Default `50`

<config>io.ox/mail//listview/secondaryPageSize=`<bool>`</config>
Sets how many mails will loaded on each paginate call. Default `200`

<config>io.ox/mail//prefetch/count=`<bool>`</config>
Prefetch N mails on Mail App startup. Default `5`

<config>io.ox/mail//features/prefetchOnBoot='<bool>'</config>
Prefetch the first chunk of mail data (action=all) already on App Suite boot.
Only disable this if you want to customize mail columns later on. Default `true`

<config>io.ox/mail//prefetch/next=`<bool>`</config>
Prefetch next mail in line during list traversing via cursor or selection. Default `true`

<config>io.ox/mail//transform/multipleEmptyLines=`<bool>`</config>
reduce multiple empty lines in plain text mails to a maximum of 2 (detail view, compose: html-to-text). Default `true`

<config>io.ox/mail//features/usePrimaryAccountNameInTree=`<bool>`</config>
Use the primary account name as label for the folder tree root node of non standard folders. If set to false the the String 'My Folders' will be used. Default `true`

# Contacts

## General

<config>io.ox/contacts//showAdmin=`<bool>`</config>
Show context admin in addressbook. Default `false`

<config>io.ox/contacts//showDepartment=`<bool>`</config>
Whenever a contact from the global addressbook is rendered, additionally show the department (field) next to the name. Default `false`

<config>io.ox/contacts//startInGlobalAddressbook=`<bool>`</config>
Start in global addressbook when Contacts App is launched. Default `true`

<config>io.ox/contacts//mapService=`<string>`</config>
External map service to locate addresses. One of `google` (Google Maps, default), `osm` (Open Street Map) or `apple` (Apple Maps, only works on iOS and MacOS)

<config>io.ox/contacts//toolbar/limits/fetch=`<number>`</config>
Fetch limit when selecting multiple contacts. A number of selected contacts beyond this limit might led to unavailable toolbar actions. Default `100`

## Addressbook picker

<config>io.ox/contacts//picker/limits/departments=`<number>`</config>
Maxium departments to show. Default `100`

<config>io.ox/contacts//picker/limits/fetch=`<number>`</config>
Maximum number of contacts to fetch. Default `10000`

<config>io.ox/contacts//picker/limits/list=`<number>`</config>
Max elements shown in the list before first paginate. Default `100`

<config>io.ox/contacts//picker/limits/more=`<number>`</config>
Elements for addition loading on each subsequent paginate call. Default `100`

<config>io.ox/contacts//picker/limits/search=`<number>`</config>
Maximum search results. Default `50`

# Calendar

## User settings

<config>io.ox/calendar//startTime=`<number>`</config>
Start of working time as hour of the day in current timezone. Default `8`

<config>io.ox/calendar//endTime=`<number>`</config>
End of working time as hour of the day in current timezone. Default `18`

<config>io.ox/calendar//interval=`<number>`</config>
Selected calendar grid scale interval in minutes. One of `5, 10, 15, 20, 30, 60`. Default `30`.

<config>io.ox/calendar//showDeclinedAppointments=`<bool>`</config>
Should declined appointments be displayed in the user calendar. Default `true`

<config>io.ox/calendar//deleteInvitationMailAfterAction=`<bool>`</config>
Automatically delete appointment invitation emails after the appointment has been accepted or declined.

<config>io.ox/calendar//markFulltimeAppointmentsAsFree=`<bool>`</config>
Mark all day appointments as 'free' for free/busy views. Default `false`

<config>io.ox/calendar//notifyNewModifiedDeleted=`<bool>`</config>
Receive notification emails for appointment changes where the user is participants. Default `true`

<config>io.ox/calendar//notifyAcceptedDeclinedAsCreator=`<bool>`</config>
Receive notification emails as appointment organizer when participants accept or decline. Default `false`

<config>io.ox/calendar//notifyAcceptedDeclinedAsParticipant=`<bool>`</config>
Receive notification emails as appointment participants when other participants accept or decline. Default `false`

<config>io.ox/calendar//deleteInvitationMailAfterAction=`<bool>`</config>
Automatically delete invitation emails after the appointment has been accepted or declined. Default `true`


<config>io.ox/calendar//numDaysWorkweek=`<number>`</config>
Number of days in a work week. Default `5`

<config>io.ox/calendar//workweekStart=`<number>`</config>
Day to start the workweek. Numeric where Sunday is `0`. Default `1` (Monday)

<config>io.ox/calendar//favoriteTimezones=`<string>`</config>
Array of timezones like `['Europe/Berlin']`

<config>io.ox/calendar//renderTimezones=`<bool>`</config>
Array of timzones that specifies that timezones out of the favoriteTimeszones that should be displayed

<config>io.ox/calendar//showPastReminders=`<bool>`</config>
Determines if reminders should be shown for appointments in the past.
This does not affect reminders that are set to trigger after an appointment ends.
Default is `true`.

## Scheduling view

<config>io.ox/calendar//scheduling/zoom=`<number>`</config>
Zoom level in percent. One of 10, 25, 50, 100, 200, 400 or 1000. Default `100`

<config>io.ox/calendar//scheduling/compact=`<bool>`</config>
Use compact mode for scheduling view, rows take less vertical space. Default `false`

<config>io.ox/calendar//scheduling/showFree=`<bool>`</config>
Show/hide appointments that are marked as free. Default `false`

<config>io.ox/calendar//scheduling/showReserved=`<bool>`</config>
Show/hide appointments that are marked as reserved. Default `false`

<config>io.ox/calendar//scheduling/onlyWorkingHours=`<bool>`</config>
Show only working hours in scheduling view. Default `true`

<config>io.ox/calendar//scheduling/dateRange=`<string>`</config>
Show either one week or the complete month in the view (`week` or `month`). Default `week`

## Misc

<config>io.ox/calendar//defaultFolderColor=`<string>`</config>
Calendar folder color as CSS HEX string, defaults to `#CFE6FF`

<config>io.ox/calendar//freeBusyStrict=`<bool>`</config>
Hide appointment data in planning view for all appointment where the user is not an participants. Default `true`

<config>io.ox/calendar//participantBlacklist=`<string>`</config>
List of blacklisted participants which can not be added to appointments. Useful for mailing lists.

<config>io.ox/calendar//viewView=`<string>`</config>
value is 'week:day', 'week:workweek', 'week:week', 'month' or 'list'


# Files

<config>io.ox/files//showHidden=`<bool>`</config>
Show hidden files and folders. Default `false`

<config>io.ox/files//uploadHandling=`<string>`</config>
Strategy how to handle files with identical names. One of `newVersion`, `announceNewVersion` or `newFile`. Default `announceNewVersion`.

<config>io.ox/files//autoplayPause=`<number>`</config>
Slideshow / Autoplay mode pause in seconds. Default `5`

<config>io.ox/files//audioEnabled=`<bool>`</config>
Play audio files in viewer. Default `true`

<config>io.ox/files//videoEnabled=`<bool>`</config>
Play video files in viewer. Default `true`.

<config>io.ox/files//autoplayLoopMode=`<string>`</config>
Autoplaymode of the viewer. `loopEndlessly` or `loopOnlyOnce`. Default `loopEndlessly`

<config>io.ox/files//features/comments=`<bool>`</config>
Allow comments when uploaded a new version of a file. Default `true`

# Tasks

<config>io.ox/tasks//currencies=`<array>`</config>
Availabe currencies in create/edit dialog. Default `['CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'JPY', 'PLN', 'RMB', 'RUB', 'SEK', 'USD']`

<config>io.ox/tasks//notifyAcceptedDeclinedAsCreator=`<bool>`</config>
Receive notifications when a participant accepted or declined a task created by you. Default `false`

<config>io.ox/tasks//notifyAcceptedDeclinedAsParticipant=`<bool>`</config>
Receive notifications when a participant accepted or declined a task in which you participate. Default `false`

<config>io.ox/tasks//notifyNewModifiedDeleted=`<bool>`</config>
Receive notifications when a task in which you participate is created, modified or deleted. Default `false`

# Portal: OX Drive Clients Widget

<config>plugins/portal//oxdriveclients/appIconAsBase64=`<string>`</config>
App icon encoded as base64 string.

<config>plugins/portal//oxdriveclients/l10nImages=`<array>`</config>
Array of language strings like 'en,de,es'. This will indicate which localized app store images are present. Default `['de', 'en', 'es', 'fr', 'it', 'nl']`

<config>plugins/portal//oxdriveclients/linkTo/[windows|android|ios|macos]=`<string>`</config>
Link to Appstore or download location

<config>plugins/portal//oxdriveclients/productName=`<string>`</config>
Customized product name for OX Drive. Default `OX Drive`

