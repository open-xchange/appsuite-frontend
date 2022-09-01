/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/sanitizer', [
    'settings!io.ox/mail',
    'static/3rd.party/purify.min.js'
], function (mailSettings, DOMPurify) {

    var whitelist = mailSettings.get('whitelist', {}),
        specialAttributes = ['desktop', 'mobile', 'tablet', 'id', 'class', 'style'],
        // used to find url("...") patterns in css to block external images when option is given
        urlDetectionRule = /url\(("|')?http.*?\)/gi,
        defaultOptions = {
            FORCE_BODY: true,
            // keep HTML and style tags to display mails correctly in iframes
            WHOLE_DOCUMENT: true
        },
        processRule = function (rule, config) {
            // see https://developer.mozilla.org/en-US/docs/Web/API/CSSRule#Type_constants for a full list (note most rule types are experimental or deprecated, only a few have actual use)
            switch (rule.type) {
                // standard css rules
                case 1:
                    //avoid double prefix if someone decides to sanitize this twice
                    var prefix = rule.cssText.indexOf('.mail-detail-content ') > -1 ? '' : '.mail-detail-content ',
                        // clear url paths from css when image loading is disabled
                        text = config.noImages ? rule.cssText.replace(urlDetectionRule, '') : rule.cssText;
                    // exception for styles applied directly to body element since this cannot be simply prefixed
                    if (rule.cssText.startsWith('body')) return text.replace(/^body/g, 'body' + prefix);
                    return prefix + text;
                // media rules
                case 4:
                    var innerRules = '';
                    // recursion: process the inner rules inside a media rule
                    _(rule.cssRules).each(function (innerRule) {
                        innerRules = innerRules + processRule(innerRule, config) + ' ';
                    });
                    return '@media ' + rule.media.mediaText + '{ ' + innerRules + '}';
                default:
                    return rule.cssText;
            }
        };

    if (_.isEmpty(whitelist)) {
        // fallback to DOMPurify defaults without replacling them (only add some). This should
        // never happen so we print an error to console.
        console.error('Sanitizer: No whitelist defined in "io.ox/mail//whitelist". HTML sanitizer will not work correctly.');
        defaultOptions.ADD_ATTR = ['desktop', 'mobile', 'tablet'];
    } else {
        // extend MW defaults with some more attributes. Should be removed as soon as MW adds our
        // extended list to their defaults
        defaultOptions.ALLOWED_ATTR = specialAttributes.concat(whitelist.allowedAttributes || []);
        // set new default. This will overwrite DOMPurify's default
        defaultOptions.ALLOWED_TAGS = whitelist.allowedTags;
    }

    // add hook before sanitizing, to catch some issues
    DOMPurify.addHook('beforeSanitizeElements', function (currentNode, hookEvent, config) {
        // we're just interested in elements, i.e. tagName is set
        // anything else, e.g. text nodes, comments, can be skipped
        if (!currentNode.tagName) return currentNode;
        // if (!currentNode.tagName) debugger
        switch (currentNode.tagName) {
            // dompurify removes the title tag but keeps the text in it, creating strange artifacts
            case 'TITLE':
                currentNode.innerHTML = '';
                break;
            case 'STYLE':
                // add a class namespace to style nodes so that they overrule our stylesheets without !important
                // if not for IE support we could just use a namespacerule here oh joy. Instead we have to parse every rule...
                if (currentNode.sheet && currentNode.sheet.cssRules) {
                    currentNode.innerHTML = _(currentNode.sheet.cssRules).reduce(function (concat, rule) {
                        return concat + processRule(rule, config) + ' ';
                    }, '');
                }
                break;
            case 'IMG':
                if (config.noImages && currentNode.getAttribute) {
                    var src = String(currentNode.getAttribute('src') || '').trim();
                    if (!src) break;
                    // data:image are embedded images -> don't block it
                    if (/^data:image/i.test(src)) break;
                    // mail attachment used as inline image -> don't block it
                    // the path is a bit tricky and quite unpredictable because it might differ from ox.root
                    // ox.root might be /appsuite but inline images start with /ajax/image/... *sigh*
                    // we could also assume that any path starting with '/' must be an inline image
                    // but let's cover the typical patterns (/api/image/... or /appsuite/api/image/... /ajax/image/...)
                    if (/^(\/\w+)*\/image\/mail\/picture/i.test(src)) break;
                    // clear url paths from inline css when image loading is disabled
                    currentNode.setAttribute('src', '');
                    // mark mail as modified (to show blocked images button)
                    if (config.mail) config.mail.modified = 1;
                }
                break;
            default:
                if (config.noImages && currentNode.hasAttribute && currentNode.hasAttribute('style')) {
                    // clear url paths from inline css when image loading is disabled
                    currentNode.setAttribute('style', currentNode.getAttribute('style').replace(urlDetectionRule, ''));
                }
                break;
        }
        return currentNode;
    });

    function isEnabled() {
        // this is not optional any more
        // the setting is deprecated
        // return mailSettings.get('features/sanitize', true);
        return true;
    }

    function sanitize(data, options, mail) {
        options = _.extend({}, defaultOptions, options);
        if (_.isObject(mail)) options.mail = mail;

        if (data.content_type !== 'text/html') return data;
        // See bug 66936, ensure sanitize returns a string
        data.content = (DOMPurify.sanitize(data.content, options) + '');
        return data;
    }

    // used for non mail related sanitizing (for example used in rss feeds)
    function simpleSanitize(str, options) {
        return (DOMPurify.sanitize(str, _.extend({}, defaultOptions, { WHOLE_DOCUMENT: false }, options)) + '');
    }

    return {
        sanitize: sanitize,
        simpleSanitize: simpleSanitize,
        isEnabled: isEnabled
    };
});
