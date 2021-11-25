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
        // dompurify removes the title tag but keeps the text in it, creating strange artefacts
        if (currentNode.tagName === 'TITLE') currentNode.innerHTML = '';
        // add a class namespace to style nodes so that they overrule our stylesheets without !important
        // if not for IE support we could just use a namespacerule here oh joy. Instead we have to parse every rule...
        if (currentNode.tagName === 'STYLE' && currentNode.sheet && currentNode.sheet.cssRules) {
            var rules = '';
            _(currentNode.sheet.cssRules).each(function (rule) {
                rules = rules + processRule(rule, config) + ' ';
            });
            currentNode.innerHTML = rules;
        } else if (config.noImages && currentNode.hasAttribute && currentNode.hasAttribute('style')) {
            // clear url paths from inline css when image loading is disabled
            currentNode.setAttribute('style', currentNode.getAttribute('style').replace(urlDetectionRule, ''));
        }
        if (config.noImages && currentNode.tagName === 'IMG' && currentNode.hasAttribute && currentNode.hasAttribute('style')) {
            // clear url paths from inline css when image loading is disabled
            currentNode.setAttribute('src', '');
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
