/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/mail/sanitizer', [
    'settings!io.ox/mail',
    'static/3rd.party/purify.min.js'
], function (mailSettings, DOMPurify) {

    var whitelist = mailSettings.get('whitelist', {});

    // TODO: Backend seems to leave out a few necessary attributes
    whitelist.allowedAttributes = ['id', 'class', 'style'].concat(whitelist.allowedAttributes || []);

    // See: https://github.com/cure53/DOMPurify for all available options
    var options = {
        SAFE_FOR_JQUERY: true,
        ALLOWED_ATTR: whitelist.allowedAttributes,
        // keep HTML and style tags to display mails correctly in iframes
        WHOLE_DOCUMENT: true
    };

    // strange handling of options by DOMPurify: breaks on undefined or empty array
    if (whitelist.allowedTags && whitelist.allowedTags.length) options.ALLOWED_TAGS = whitelist.allowedTags;

    function isEnabled() {
        return mailSettings.get('features/sanitize', false);
    }

    function sanitize(data) {
        if (data.content_type !== 'text/html') return data;
        if (ox.debug) console.time('purify');
        data.content = DOMPurify.sanitize(data.content, options);
        if (ox.debug) console.timeEnd('purify');
        return data;
    }

    return {
        sanitize: sanitize,
        isEnabled: isEnabled
    };
});
