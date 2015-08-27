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

define('io.ox/core/boot/language', ['gettext', 'io.ox/core/boot/util', 'io.ox/core/session'], function (gettext, util, session) {

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

        setDefaultLanguage: function () {
            var language = _.getCookie('language') || session.getBrowserLanguage();
            return this.change(language);
        },

        changeByUser: function (id) {
            if (!id) return;
            this.change(id);
            selectedLanguage = id;
        },

        render: function () {

            var lang = ox.serverConfig.languages,
                node = $('#io-ox-languages');

            // show languages
            if (!_.isEmpty(lang)) {

                util.debug('Render languages', lang);

                var self = this,
                    maxLang = 30,
                    defaultLanguage = _.getCookie('language') || session.getBrowserLanguage(),
                    // Display native select box for languages if there are up to 'maxLang' languages
                    langSorted = _.toArray(_.invert(lang)).sort(function (a, b) {
                        return lang[a] <= lang[b] ? -1 : +1;
                    });

                if (_.size(lang) < maxLang && !_.url.hash('language-select') && _.device('!smartphone')) {
                    var toggle, list;

                    node.append(
                        $('<span class="lang-label" data-i18n="Languages" data-i18n-attr="text,aria-label">'),
                        $('<div class="dropup">').append(
                            toggle = $('<a href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">').append(
                                $('<span class="toggle-text">').text(lang[defaultLanguage]),
                                $('<span class="caret">')
                            ),
                            list = $('<ul id="io-ox-language-list" class="dropdown-menu" role="menu" aria-labeledby="io-ox-languages-label">')
                        )
                    );

                    // add to column layout
                    if (_.size(lang) > 15) list.addClass('multi');

                    list.append(
                        _(langSorted).map(function (value) {
                            return $('<li role="presentation">').append(
                                $('<a href="#" role="menuitem">')
                                    .attr({ 'aria-label': lang[value], 'lang': value })
                                    .text(lang[value])
                            );
                        })
                    );

                    list.on('click', 'a', function (e) {
                        var node = $(e.currentTarget), value = node.attr('lang');
                        e.preventDefault();
                        self.changeByUser(value);
                        $(e.delegateTarget).parent().find('.toggle-text').text(lang[value]);
                    });

                    // init dropdown
                    toggle.dropdown();
                } else {
                    node.append(
                        $('<label for="language-select" class="lang-label" data-i18n="Languages" data-i18n-attr="text,aria-label">'),
                        $('<select id="language-select">')
                            .on('change', function () {
                                exports.changeByUser($(this).val());
                            })
                            .append(
                                _(langSorted).map(function (value) {
                                    return $('<option>')
                                        .attr({
                                            'aria-label': lang[value],
                                            'value': value
                                        })
                                        .text(lang[value]);
                                })
                            )
                            .val(defaultLanguage)
                    );
                }
            } else {
                node.remove();
            }
        }
    };

    return exports;

});
