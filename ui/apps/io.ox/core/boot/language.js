/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/language', ['gettext', 'io.ox/core/boot/util'], function (gettext, util) {

    'use strict';

    var selectedLanguage;

    var exports = {

        change: function (id) {
            // if the user sets a language on the login page, it will be used for the rest of the session, too
            gettext.setLanguage(id).done(function () {
                $('html').attr('lang', id.split('_')[0]);
                gettext.enable();
                // get all nodes
                $('[data-i18n]').each(function () {
                    var node = $(this),
                        val = util.gt(node.attr('data-i18n')),
                        target = (node.attr('data-i18n-attr') || 'text').split(',');
                    _.each(target, function (el) {
                        switch (el) {
                        case 'value':
                            node.val(val);
                            break;
                        case 'text':
                            node.text(val);
                            break;
                        case 'label':
                            node.contents().get(-1).nodeValue = val;
                            break;
                        default:
                            node.attr(el, val);
                            break;
                        }
                    });
                });
                // Set Cookie
                _.setCookie('language', (ox.language = id));
                ox.trigger('language');
            });
        },

        getCurrentLanguage: function () {
            return selectedLanguage || ox.language || 'en_US';
        },

        getSelectedLanguage: function () {
            return selectedLanguage;
        },

        getBrowserLanguage: function () {
            var language = (navigator.language || navigator.userLanguage).substr(0, 2),
                languages = ox.serverConfig.languages || {};
            return _.chain(languages).keys().find(function (id) {
                return id.substr(0, 2) === language;
            }).value();
        },

        setDefaultLanguage: function () {
            // look at navigator.language with en_US as fallback
            var navLang = (navigator.language || navigator.userLanguage).substr(0, 2),
                languages = ox.serverConfig.languages || {},
                lang = 'en_US', id = '', found = false, langCookie = _.getCookie('language');
            if (langCookie) {
                return this.change(langCookie);
            }
            for (id in languages) {
                // match?
                if (id.substr(0, 2) === navLang) {
                    lang = id;
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (!_.isEmpty(languages)) {
                    lang = _(languages).keys()[0];
                }
            }
            return this.change(lang);
        },

        changeByUser: function (id) {
            if (!id) return;
            this.change(id);
            selectedLanguage = id;
        },

        onChangeLanguage: function (e) {
            e.preventDefault();
            this.changeByUser(e.data.id);
        },

        render: function () {

            var sc = ox.serverConfig, lang = sc.languages,
                node, id = '', i = 0, maxLang = 30;

            // show languages
            if (!_.isEmpty(lang)) {

                util.debug('Render languages', lang);

                node = $('#io-ox-language-list');

                var langCount = _.size(lang),
                    defaultLanguage = _.getCookie('language') || this.getBrowserLanguage(),
                    // Display native select box for languages if there are up to 'maxLang' languages
                    langSorted = _.toArray(_.invert(lang)).sort(function (a, b) {
                        return lang[a] <= lang[b] ? -1 : +1;
                    });

                if (langCount < maxLang && !_.url.hash('language-select') && _.device('!smartphone')) {
                    for (id in langSorted) {
                        i++;
                        node.append(
                            $('<li>').append(
                                $('<a role="menuitem" href="#" aria-label="' + lang[langSorted[id]] + '" lang="' + langSorted[id] + '">')
                                    .on('click', { id: langSorted[id] }, $.proxy(this.onChangeLanguage, this))
                                    .text(lang[langSorted[id]])
                            )
                        );
                        if (i < langCount && langCount < maxLang) {
                            // node.append($('<span class="language-delimiter">').text('\u00A0\u00A0\u2022\u00A0 '));
                        }
                    }
                } else {
                    $('#io-ox-language-list').append(
                        $('<select>')
                        .on('change', function () {
                            exports.changeByUser($(this).val());
                        })
                        .append(
                            _(langSorted).map(function (value, id) {
                                return $('<option>')
                                    .attr({
                                        'aria-label': lang[langSorted[id]],
                                        'value': langSorted[id]
                                    })
                                    .text(lang[langSorted[id]]);
                            })
                        )
                        .val(defaultLanguage)
                    );
                }
            } else {
                $('#io-ox-languages').remove();
            }
        }
    };

    return exports;

});
