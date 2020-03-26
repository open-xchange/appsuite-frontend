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
    if (_.isEmpty(whitelist)) console.warn('No sanitizing whitelist defined. Falling back to strict sanitizing');

    // TODO: Backend seems to leave out a few necessary attributes
    whitelist.allowedAttributes = ['desktop', 'mobile', 'tablet', 'id', 'class', 'style'].concat(whitelist.allowedAttributes || []);

    // See: https://github.com/cure53/DOMPurify for all available options
    var defaultOptions = {
        SAFE_FOR_JQUERY: true,
        FORCE_BODY: true,
        ALLOWED_ATTR: whitelist.allowedAttributes,
        // keep HTML and style tags to display mails correctly in iframes
        WHOLE_DOCUMENT: true
    };

    // strange handling of options by DOMPurify: breaks on undefined or empty array
    if (whitelist.allowedTags && whitelist.allowedTags.length) defaultOptions.ALLOWED_TAGS = whitelist.allowedTags;

    // add hook before sanitizing, to catch some issues
    DOMPurify.addHook('beforeSanitizeElements', function (currentNode) {
        // dompurify removes the title tag but keeps the text in it, creating strange artefacts
        if (currentNode.tagName === 'TITLE') currentNode.innerHTML = '';
        // add a class namespace to style nodes so that they overrule our stylesheets without !important
        if (currentNode.tagName === 'STYLE' && currentNode.sheet && currentNode.sheet.cssRules) {
            var rules = '';
            _(currentNode.sheet.cssRules).each(function (rule) {
                //avoid double prefix if someone decides to sanitize this twice
                var prefix = rule.cssText.indexOf('.mail-detail-content ') > -1 ? '' : '.mail-detail-content ';
                rules = rules + prefix + rule.cssText + ' ';
            });
            currentNode.innerHTML = rules;
        }
        return currentNode;
    });

    function isEnabled() {
        // this is not optional any more
        // the setting is deprecated
        // return mailSettings.get('features/sanitize', true);
        return true;
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
