---
title: Cookies
---
# List of Cookies managed by App Suite UI
App Suite UI uses JavaScript cookies (set by JavaScript frontend code) to persist frontend related data.

Cookie name | Example value | Expiry | Contains PII | Explanation
--- | --- | --- | --- | ---
locale| en_US | Session | no | used to sync displayed language between login page (if used) and main UI.
url.key| 827578327053882182757... | 10 years | no | Used as a key to encrypt mail folder names in the URL hash to protect the user against unwanted exposure of information about mail folder names

## Cookies used by the Piwik metrics adapter
App Suite UI supports different analytic solutions like Piwik. If the feature "Piwik" is enabled (default: disabled) for a installation, the included Piwik adapter generates a random hash on the client to identify the user later on as a unique user. The hash does not contain any user related data and is only generated based on a random number.

Cookie name | Example value | Expiry | Contains PII | Explanation
--- | --- | --- | --- | ---
metrics-userhash-v2| 345796bc0778e45... | Session | no | Unique identifier (see above)
