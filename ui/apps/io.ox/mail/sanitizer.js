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

    var whitelist = mailSettings.get('whitelist', {}),
        specialAttributes = ['desktop', 'mobile', 'tablet', 'id', 'class', 'style'],
        defaultOptions = {
            SAFE_FOR_JQUERY: true,
            FORCE_BODY: true,
            // keep HTML and style tags to display mails correctly in iframes
            WHOLE_DOCUMENT: true
        };

    if (_.isEmpty(whitelist)) {
        // fallback to DOMPurify defaults without replacing them (only add some). This should
        // never happen so we print an error to console.
        // console.error('Sanitizer: No whitelist defined in "io.ox/mail//whitelist". HTML sanitizer will not work correctly.');
        defaultOptions.ADD_ATTR = ['desktop', 'mobile', 'tablet'];
    } else {
        // extend MW defaults with some more attributes. Should be removed as soon as MW adds our
        // extended list to their defaults
        defaultOptions.ALLOWED_ATTR = specialAttributes.concat(whitelist.allowedAttributes || []);
        // set new default. This will overwrite DOMPurify's default
        defaultOptions.ALLOWED_TAGS = whitelist.allowedTags;
    }

    function isEnabled() {
        return mailSettings.get('features/sanitize', false);
    }

    function sanitize(data, options) {
        options = _.extend({}, defaultOptions, options);

        if (data.content_type !== 'text/html') return data;
        data.content = DOMPurify.sanitize(data.content, options);
        return data;
    }

    // used for non mail related sanitizing (for example used in rss feeds)
    function simpleSanitize(str) {
        return DOMPurify.sanitize(str, _.extend({}, defaultOptions, { WHOLE_DOCUMENT: false }));
    }

    return {
        sanitize: sanitize,
        simpleSanitize: simpleSanitize,
        isEnabled: isEnabled
    };
});
