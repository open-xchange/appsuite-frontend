---
title: Settings List
---

# Types

As flexible presistant storage Settings (sometimes 'jslob' as name of the API is used synonymously) covering more than one purpose.

## Configuration

Defined on the middlware by setting up property files this type of settings control availability and determine configurational details for different features.

_example: features/dedicatedLogoutButton_

## User preferences

Individually adjustable user preferences defined via ui interaction elements in App Suites settings module or by in-app dropdowns/checkboxes.

_example: allowHtmlImages_

## Dynamic storage

Used to store ui related informations persistently like open/close states of foldertree items.

_example: folderview/open/large_

# Core

```
settings!io.ox/core
```

## Accessibility

**features/accessibility)**
> Use accessibility improvements (true/false)

**highcontrast**
> enable/disable high contrast theme (true/false)


## Settings

**disabledSettingsPanes**
> comma separated list of disabled extension ids of point _io.ox/settings/pane_

**features/dedicatedLogoutButton**
> adds a extra logout icon to the topbar (true/false)

**features/folderIcons**
> show icons in the folder tree (true/false)

**features/hideAddressBook**
> hide address book e.g. for drive standalone (true/false)

**features/logoutButtonHint**
> shows little reminder tooltip when user didn't logged out last time  (true/false)

**features/reloginPopup**
> if session expires, the user gets a popup that says what went wrong (true/false)

**forceDesktopLaunchers**
> By default all launchers on smartphone will be hidden in the laucher menu  (true/false)


## Restore and save points

**savepoints**
> UI stores draft mail ids here. Those are created when the user logs out while writing a mail. Used to restore the mail compose dialog on next login.

**features/storeSavePoints**
> no saving in the background, no restore dialog  (true/false)

**features/storeMailSavePoints**
> mail: no saving in the background, no restore dialog. only relevant in case 'features/storeSavePoints' is set to true (true/false)


## Validation

**features/validateMailAddresses**
> enable validiation for mail addresse (true/false)

**features/validatePhoneNumbers**
> enable validiation for phone numbers (true/false)

**features/windowHeaderPosition**
> mainly relevant for actions toolbar in new/edit dialogs ('top', 'bottom')

## Notifications

**autoOpenNotificationarea**
> open notification area automatically (true/false)

**notificationsHidingTimer**
> hide notifications for a period of x milliseconds when user clicks on 'Notify me again later' (default is half an hour (1800000))

**showDesktopNotifications**
> determines if the appsuite should try to send desktop notifications (true/false).
> Important: To actually see desktop notifications they also have to be enabled in the browser.


## Ping

**ping/enabled**
> frequently ping calls (true/false)

**ping/interval**
> specifies frequency in milliseconds


## I18n

**language**
> current locale as a combination of language and country ('en_GB', ...)

**timezone**
>  IANA time zone database ('Europe/Berlin', ...)

**settingOptions/availableTimeZones**
> list of available time zones


## Quota and limits

**properties/maxBodySize**
> ...

**properties/attachmentQuota**
> defines limit for summarized file size of all mail attachments

**properties/attachmentQuotaPerFile**
> defines limit for the file size of a single mail attachment

**properties/attachmentMaxUploadSize**
> defines limit for summarized file size of all attachments for a single appointment/task

**properties/infostoreMaxUploadSize**
> defines limit for summarized file size of all mail attachments published via infostore

**properties/infostoreQuota**
> defines limit for summarized file size of all inforstore files

**properties/infostoreUsage**
> current summarized file size of all inforstore files

## Feedback

**feedback/supportlink**
> stores a link to a support site

**feedback/mode**
> provided by middleware. Defines the type used when sending the feedback request. 'star-rating-v1' is the only possible value.

**feedback/dialog**
> used to switch feedback dialogs. 'modules' is the default value . Should only be changed for testing purpose, since only 'modules' has proper mw support yet. (stars/modules/nps)

**feedback/position**
> defines the position of the feedback button. Default value is 'right'. (left/right)

**feedback/show**
> defines which feedback buttons to show. Default value is 'both'. (topbar/side/both)

**feedback/showHover**
> defines if the rating should show when hovering with the mose over it. (true/false)

**feedback/showModuleSelect**
> only applies to 'modules' dialog. Defines if the select box for he module selection should be replaced by a static text, resembling the current app. (true/false)

## Special

**pdf/enableRangeRequests**
> if the server supports range requests the PDF will be fetched in chunks (true/false)

**refreshInterval**
> automatic refresh interval in milliseconds

**security/acceptUntrustedCertificates**
> Allow connections with untrusted certificates (true/false)

**settings/downloadsDisabled**
> enables/disables download pane in settings (true/false)

**shardingSubdomains**
> list of available sharding domains

**theme**
> current theme

**topbar/order**
> defines order of apps in topbar


## Mail compose: tinyMCE

**maxUploadIdleTimeout**
> timeout for contenteditable-editor in milliseconds when adding inline imagesF

**tinyMCE/theme_advanced_buttons1**
> list of tinyMCE toolbar actions separated by space - targets toolbar1

**tinyMCE/theme_advanced_buttons2**
> list of tinyMCE toolbar actions separated by space - targets toolbar2)

**tinyMCE/theme_advanced_buttons3**
> list of tinyMCE toolbar actions separated by space - targets toolbar3


## Folders

**folder/blacklist**
> folders that are filtered out of folder api responses

**folder/hidden**
> Important: call via ```settings.get(['folder/hidden'])```

**folder/calendar**
> default folder for calendar

**folder/tasks**
> default folder for tasks

**folder/contacts**
> default folder for contacts

**folder/infostore**
> default folder for infostore

**folder/mailattachments/all**
> folder where to look for all attachments when attachmentView is available

**folder/mailattachments/received**
> folder where to look for received attachments when attachmentView is available

**folder/mailattachments/sent**
> folder where to look for sent attachments when attachmentView is available

**favorites/mail**
> list of favorite folders

**favorites/infostore**
> list of favorite folders

**favorites/contacts**
> list of favorite folders

**favorites/calendar**
> list of favorite folders

**favorites/infostore**
> list of favorite folders


## Search

**search/allfolders/[module]**
> a boolean that indicates if search among all folders is supported

**search/mandatory/[facet-id]**
> a list of apps that facet is mandatory for

**search/default**
> default app when search is used as a separate module on mobile

**search/modules**
> list of apps that are supported  when search is used as a separate module on mobile


## Metrics

**tracking/donottrack**
> respect donottrack already on client side

**tracking/enabled**
> tracking enabled in general

### PIWIK

**tracking/piwik/enabled**
> enable piwik adapter

**tracking/piwik/url**
> piwik server url

**tracking/piwik/id**
> piwik id

### Google Analytics

**tracking/analytics/enabled**
> enabled

**tracking/analytics/id**
> google analytics id

**tracking/analytics/url**
> usually `https://www.google-analytics.com/analytics.js`

**tracking/analytics/mapping**
> optional mappings for custom dimensions


### Misc

**tracking/console/enabled**
> enables console adapter that logs events to browser console

**tracking/context/enabled**
> enabled context tracker that provides last 10 tracked events via `window.ox.metricss


## Upsell

**upsell/enabled**
> list of capabilities that are available for upsell

**upsell/defaultIcon**
> default icon used for upsell 'decoration'

**upsell/premium/folderView/visible**
> show premium link in folder tree

**upsell/premium/folderView/closedByUser**
> is user allowed to hide the premium link permanently

**features/upsell/[custom-id]/enabled**
> upsell enabled for feature

**features/upsell/[custom-id]/color**
> customize upsell 'decoration' appearance

**features/upsell/[custom-id]/icon**
> customize upsell 'decoration' appearance


## Viewer

**viewer/sidebarActiveTab**
> last active sidebar navigation tab

**viewer/sidebarOpenState**
> stores active sidebar tab


## Password

**password/showStrength**
> show strength of entered password - capability `'edit_password'

**password/minLength**
> requirement for new passwords - capability `'edit_password'

**password/maxLength**
> requirement for new passwords - capability `'edit_password'

**password/regexp**
> requirement for new passwords - capability `'edit_password'

**password/special**
> required special characters for new passwords - capability `'edit_password'

## Unused/Deprecated?

**settings/downloadDisabled**
> ...

**settings/advancedMode**
> ...

**viewer:sidebar:state**
> ...

**identifier**
> ...


## Misc

**autoLogout**
> timespan in milliseconds when autologout is triggered

**autoStart, autoStartMobile**
>  starting app defined via app-id

**banner/visible**
> show top banner (true/false)

**customLocations/guestLogin**<br>
**customLocations/login**<br>
**customLocations/logout**<br>
> custom redirections as url

**selectionMode**
> specifies behavior when selecting items in mail listview. ('normal'|'alternative'|'simple')

**wizards/firstStart/finished**
> stores if firststart wizard finished

**states**
> migration state for each signature

**user/internalUserEdit**
> is user allowed to edit his/her own data

**registry/[id]**
> allows different targets for 'mail-compose' and 'client-onboarding'


# Portal

```
settings!io.ox/portal
```

## API keys

**apiKeys/flickr**
> ...

**apiKeys/tumblr**
> ...

## Sets

**widgetSet**
> defines a widget set that is used as part of the settings path ('widgets/deleted' + widgetSet )

**widgets/user**
> all widgets added/created by the user

**widgets/deleted\[widgetSet\]/gen_\[generation\]**
> list of deleted widgets

**widgets/eager\[widgetSet\]/gen_\[generation\]**
> list of eager widgets

**widgets/protected\[widgetSet\]**
> list of protected widgets that are not disableable and not deletable

**widgets/deleted**
> ...

**generation**
>  current active generation starting with 0


## First Start Widget

**settings\hadData**
> list of app ids that where already shown to the user with real data once

**settings\getStartedLink**
> target of 'get started' labled link in 'getting started' widget


## Widget properties

**widgets/defaults**
> default properties

**widgets/user/\[widgetid\]/id**
> ...

**widgets/user/\[widgetid\]/color**
> color of title and highligting within widget preview/content

**widgets/user/\[widgetid\]/enabled**
> enabled state

**widgets/user/\[widgetid\]/index**
> specifies order of widgets

**widgets/user/\[widgetid\]/inverse**
> use color for background instead of title

**widgets/user/\[widgetid\]/plugin**
> reference to tht plugin id/path

**widgets/user/\[widgetid\]/props**
> additional data like custom description or related configuration

**widgets/user/\[widgetid\]/type**
> widget type like 'rss' or 'stickyfile'

**widgets/user/\[widgetid\]/userWidget**
> is user created widget


## Misc

**mobile/summaryView**
> show only summary of portal widgets on mobile


## Unused?

**force**
> ...

# Mail

```
settings!io.ox/mail
```

## Folders

**allMessagesFolder**
> id of virtual folder with all messages

**features/unseenFolder**
> id of virtual folder with all unread messages

**contactCollectFolder**
> folder id for collect contacts feature - depends on capability 'collect_email_addresses'`

**folder/inbox**
> folder id of inbox

**namespace**
> Check if 'altnamespace' is enabled that does not has a 'INBOX' part

**defaultFolder/[type]**
> Name of default folder or `null` of not existing


## Folderpopup

**folderpopup/[id]/last**
> stores state of folder popups

**folderpopup/[id]/open**
> stores state of folder popups


## User Preferences: Display

**allowHtmlImages**
> Allow pre-loading of externally linked images

**allowHtmlMessages**
> Allow html formatted emails

**displayEmoticons**
> Display emoticons as graphics in text emails

**isColorQuoted**
> Color quoted lines

**useFixedWidthFont**
> Use fixed-width font for text mails

**beautifyPlainText**
> Prettify plain text mails

**sendDispositionNotification**
> Show requests for read receipts


## User Preferences:

### Common

**removeDeletedPermanently**
> Permanently remove deleted emails instead of moving them to the trash folder first(true/false)

**contactCollectOnMailTransport**
> Automatically collect contacts in the folder "Collected addresses" while sending - depends on capability `'collect_email_addresses'` (true/false)

**contactCollectOnMailAccess**
> Automatically collect contacts in the folder "Collected addresses" while reading - depends on capability `'collect_email_addresses'` (true/false)

**features/registerProtocolHandler**
> Ask for mailto link registration (true/false)

**unseenMessagesFolder**
> Show folder with all unseen messages (true/false)

**playSound**
> Play sound on incoming push e-mail - depends on capability `'websocket'` (true/false)

### Compose

**appendVcard**
> Append vCard (true/false)

**appendMailTextOnReply**
> Insert the original email text to a reply (true/false)

**confirmReplyToMailingLists**
> Confirm recipients when replying to a mailing list (true/false)

**forwardMessageAs**
> value 'Inline' or Attachment'

**messageFormat**
> value 'html', 'text' or 'alternative'

**defaultSendAddress**
> a single default sender address out of available accounts

**autoSaveDraftsAfter**
> values 'disabled', '1_minute', '3_minutes', '5_minutes' or '10_minutes'

**autobcc**
> Always add the following recipient to blind carbon copy

**defaultFontStyle/family**
> value 'browser-default', 'Andale Mono' or [...] for desktop only

**defaultFontStyle/size**
> value 'browser-default, '8pt' or [...] for desktop only

**defaultFontStyle/color**
> css compatible value for for desktop only


## Compose

**customDisplayNames**
> accounts hash with defaultName, name and overwrite property - editable via  ui via 'from > click on mail address > edit names'

**showReplyTo/configurable**
> show 'reply to' field

**maxSize/compose**
> size in byte used as param for mail api server requests with a default value of 512kb

**maxSize/view**
> size in byte used as param for mail api server requests with a default value of 100kb

**sendDisplayName**
> ...

## Compose: Attachments and Drive Mail

**attachments/layout/compose/\[small|medium|large\]**
> value is 'list' or 'preview'

**compose/shareAttachments/enabled**
> feature toggle

**compose/shareAttachments/expiryDates**<br>
**compose/shareAttachments/defaultExpiryDate**
> possible expire dates and its default

**compose/shareAttachments/forceAutoDelete**
> forces auto delete after expire

**compose/shareAttachments/requiredExpiration**
> hides option 'no expiry date'

**compose/shareAttachments/name**
> product name that usually is 'Drive Mail'

**compose/shareAttachments/enableNotifications**
> enable notification options for the user

**compose/shareAttachments/driveLimit**
> limit in bytes for all attachments of a single drive mail

**compose/shareAttachments/threshold**
> maximal file size for all attachments. Beyond this size drive mail is activated automatically.


## Compose: TinyMCE

**simpleLineBreaks**
> is mappend on TinyMCE's option 'forced_root_block'


## Emoji

**emoji/availableCollections**
> default is 'unified'

**emoji/defaultCollection**
> default is 'unified'

**emoji/userCollection**
> default is value of 'emoji/defaultCollection'

**emoji/overrideUserCollection**
> ...

**emoji/recently**
> stores recently used emojis

**emoji/sendEncoding**
> default is 'unified'


## Signatures

**defaultSignature**<br>
**mobileSignature**
> default signature

**defaultReplyForwardSignature**
> fallback is value of 'defaultSignature'

**defaultSignaturePosition**
> value is 'above' or 'below'

**mobileSignatureType**
> value is 'custom' or 'none'


## Flags

**features/flag/color**
> color flagging enabled

**features/flag/star**
> star flagging enabled


## Categories

**categories/initialized**
> read only value of initial migration status

**categories/enabled**
> currently enabled state based on users preference

**categories/list**
> list of category object that properties are partly writeable


## Malicious folders

**maliciousCheck**
> feature toggle

**maliciousFolders**
> extends list of considered folders


## Dovecot Smart Cache

**dsc/enabled**
> ...

**dsc/folder**
> ...


## Misc

**attachOriginalMessage**
> attach original message on touch devices

**unifiedInboxIdentifier**
> example value is 'default1729/INBOX"'

**phishing/headers**
> used reference in mail header that indicates a potential phising mail.

**attachments/layout/detail/\[small|medium|large\]**
> value is 'list' or 'preview'

**defaultseparator**
> separator for folder tree that usually is '/'

**features/accounts/configureUnifiedInboxOnCreate**
> allow enabling unified inbox for an account during creation

**features/anonymousAliases**
> ...

**features/autoCollapseBlockquotes**
> when enabled the limit of 300 chars is applied

**features/autoExpunge**
> ...

**features/cleanSubjects**
> removes square brackets including content (example: '[fwd]')

**features/deleteDraftOnClose**
> ...

**features/fixtoccbcc**
> client-side fix for missing to/cc/bcc fields

**features/inplaceReply**
> allow replying of mails within mail detail view

**features/notifyOnSent**
> `yell` after mail was send successfully

**features/recognizeDates**
> ...

**features/setFromInVacationNotice**
> ...

**listview/primaryPageSize**
> size of first chunk as integer

**listview/secondaryPageSize**
> size of every chunk after the first one as integer

**prefetch/count**
> Prefetch first \[number\] relevant unseen mails

**prefetch/next**
> Prefetch the next \[number\] mails in line

**viewOptions/<folder>/order**<br>
**viewOptions/<folder>/sort**<br>
**viewOptions/<folder>/thread**<br>
> stores display settings for each folder individually

# Calendar

```
settings!io.ox/calendar
```

## User settings

### General

**interval**
> time scale in minutes

**startTime**
> start of working time

**endTime**
> end of working time

**showDeclinedAppointments**
> ...

**deleteInvitationMailAfterAction**
> automatically delete the invitation email after the appointment has been accepted or declined

### Expert

**defaultReminder**
> value in minutes

**markFulltimeAppointmentsAsFree**
> mark all day appointments as free

### Email notifications

**notifyNewModifiedDeleted**
> receive notification for appointment changes

**notifyAcceptedDeclinedAsCreator**
> receive notification as appointment creator when participants accept or decline

**notifyAcceptedDeclinedAsParticipant**
> receive notification as appointment participant when other participants accept or decline

**deleteInvitationMailAfterAction**
> automatically delete the invitation email after the appointment has been accepted or declined

### Workweek

**numDaysWorkweek**
> number of days in work week

**workweekStart**
> work week starts on


## user setting: timezones

**favoriteTimezones**
> array of timezones like 'America/Jamaica'

**renderTimezones**
> array of timzones that specifies that timezones out of the favoriteTimeszones that should be displayed


## Folderpopup

**folderpopup/[id]/last**
> stores state of folder popups

**folderpopup/[id]/open**
> stores state of folder popups


## Scheduling view

**scheduling/zoom**
> value is 100, 200, 400 or 1000

**scheduling/compact**
> in compact mode rows are thinner (true/false)

**scheduling/showFree**
> (true/false)

**scheduling/showTemporary**
> (true/false)

**scheduling/showReserved**
> (true/false)

**scheduling/showAbsent**
> (true/false)

**scheduling/onlyWorkingHours**
> (true/false)


## Misc

**bossyAppointmentHandling**
> ...

**colorScheme**
> value is 'classic', 'dark' or 'custom'

**defaultFolderColor**
> value is between 1 and 11 as final part of css class 'color-label-'

**freeBusyStrict**
>  no detail view in scheduling view for appointments the user is not part of

**participantBlacklist**
> comma separated list of of mail adresses

**viewView**
> value is 'week:day', 'week:workweek', 'week:week', 'month' or 'list'


# Files

```
settings!io.ox/files
```

## User preferences

**showHidden**
> Show hidden files and folders

**uploadHandling**
> Strategy how to handle files with identical names is 'newVersion', 'announceNewVersion' or 'newFile'

**autoplayPause**
> Slideshow / Autoplay mode pause in seconds

## Mediaplayer and mediasupport

**audioEnabled**
> (true/false)

**videoEnabled**
> (true/false)

## Folder

**rootFolderId**
> ...

**folder/documents**
> ...

**folder/trash**
> ...

## Folderpopup

**folderpopup/[id]/last**
> stores state of folder popups

**folderpopup/[id]/open**
> stores state of folder popups

## Misc

**autoplayLoopMode**
> File Viewer setting is'loopendlessly' or  _something falsy_

**features/comments**
> allow comments when uploaded a new version of a file



# Tasks

```
settings!io.ox/tasks
```

## Mail notifications

**notifyAcceptedDeclinedAsCreator**
> Receive notifications when a participant accepted or declined a task created by you

**notifyAcceptedDeclinedAsParticipant**
> Receive notifications when a participant accepted or declined a task in which you participate

**notifyNewModifiedDeleted**
> Receive notifications when a task in which you participate is created, modified or deleted

## Folderview

**folderview/blacklist**
> hides folder nodes in tree view

**folderview/\[open|visible|width\]/\[small|medium|large\]**
> stores lists for different states


## Folderpopup

**folderpopup/[id]/last**
> stores state of folder popups

**folderpopup/[id]/open**
> stores state of folder popups


## VGrid

**showCheckboxes**
> are checkboxes shown in grid view

**vgrid/width/\[small|medium|large\]**
> stores lists for different states


## Misc

**currencies**
> list of available currencies (3-digits) in edit/new dialog


## Unused?

**interval**
> ...


# Other

## Settings: configjump

```
settings!io.ox/settings/configjump
```

## Portal: oxdriveclients

```
settings!plugins/portal/oxdriveclients
```

**appIconAsBase64**
> ...

**l10nImages**
> array of languages like 'en'

**linkTo/[Windows|Android|iOS|Mac OS]**
> url

**productName**
> customized product name for OX Drive

**standaloneWindowsClient**
> (true/false)

## Upsell

```
settings!plugins/upsell
```

**shop/products**
> list of products as hash

**ads/delayInMilliseconds**
> adInterval

**driveAd**
> ...

**bubbles/skipFirstLogin**
> do on first login ever?

**bubbles/repeatPerLogins**
> how many logins does this appear?

**bubbles/repeatInMilliseconds**
> after login in, how often does it appear?

## Upsell: simple wizard

```
settings!plugins/upsell/simple-wizard
```

**closeButton**
> adds close button

**height**
> max-height in px

**width**
> width in px

**overlayColor**
> background color

**overlayOpacity**
> background opacity

**url**
> ...

**zeroPadding**
> adds class 'zero-padding'
