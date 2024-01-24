/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('plugins/portal/upsellads/register', [
    'io.ox/core/extensions',
    'io.ox/mail/sanitizer',
    'gettext!plugins/portal',
    'settings!plugins/upsell',
    'less!plugins/portal/upsellads/style'
], function (ext, sanitizer, gt, settings) {

    'use strict';

    var adInterval = {},
        intervalDuration = settings.get('ads/delayInMilliseconds', 5000),
        addContent,
        nextAd,
        getSlides,
        currPos = 0;

    getSlides = function (data) {
        var slides, languages, slideKeys, result = [];

        if (!data.slides || _(data.slides).isEmpty()) {
            console.error('No slides present', data);
            return;
        }
        languages = _(data.slides).keys();
        slides = _(languages).contains(ox.language) ? data.slides[ox.language] : data.slides[languages[0]];

        /* prepare sorted slides as array. Stupid but necessary, because the backend can neither handle YaML lists nor integers as keys. */
        slideKeys = _(slides).keys().sort();
        _(slideKeys).each(function (key) { result.push(slides[key]); });

        return result;
    };

    addContent = function (fromAd, toTarget) {
        var type;

        if (!fromAd || !fromAd.type) {
            console.error('No type set', fromAd, toTarget);
            return;
        }

        type = fromAd.type;

        fromAd.text = sanitizer.simpleSanitize(fromAd.text);

        if (!type || type === 'text-only') {
            toTarget.append(
                $('<div class="text upsell-full">').append(
                    $('<div class="overflow-container">').text(fromAd.text)
                )
            );

        } else if (type === 'text-top') {
            toTarget.append(
                $('<div class="text upsell-top">').text(fromAd.text),
                $('<div class="image upsell-bottom">').css({ 'background-image': 'url(' + fromAd.image + ')' })
            );

        } else if (type === 'text-bottom') {
            toTarget.append(
                $('<div class="image upsell-top">').css({ 'background-image': 'url(' + fromAd.image + ')' }),
                $('<div class="text upsell-bottom">').text(fromAd.text)
            );

        } else if (type === 'image-only') {
            toTarget.append(
                $('<div class="image upsell-full">').css({ 'background-image': 'url(' + fromAd.image + ')' })
            );

        } else {
            console.error('Do not know type "' + type + '"', fromAd, toTarget);
        }
    };

    nextAd = function (content, ad, slides) {
        currPos = (currPos + 1) % slides.length;

        /* show next ad */
        content.empty();
        addContent(slides[currPos], content);

        /* if user clicked "next", reset timer to zero; if here because of interval: no problem either. */
        clearInterval(adInterval[ad]);
        adInterval[ad] = setInterval(function () { return nextAd(content, ad, slides); }, intervalDuration);

    };

    ext.point('io.ox/portal/widget/upsellads').extend({
        title: 'Upsell Ads',

        preview: function (baton) {
            var content = $('<div class="content">').appendTo(this),
                ad = baton.model.get('props').ad,
                data = settings.get('ads/' + ad),
                startPos = settings.get(ad + '.position', 0),
                slides;

            if (!data) {
                content.parent().remove();
                return;
            }
            slides = getSlides(data);

            content.parent().addClass('upsellads-widget');
            content.parent().find('h2').remove();
            content.parent().append(
                $('<div class="upsellads-next">')
                    .on('click', function () {
                        return nextAd(content, ad, slides);
                    })
                    .append($('<i class="fa fa-circle-arrow-right fa-2x" aria-hidden="true">'))
            );
            content.on('click', function () {
                var def = $.Deferred();
                require(['io.ox/wizards/upsell'], function (w) {
                    w.getInstance().start({ cssClass: 'upsell-wizard-container' })
                        .done(function () {})
                        .fail(def.reject);
                });
            });
            addContent(slides[startPos], content);
            adInterval[ad] = setInterval(function () { return nextAd(content, ad, slides); }, intervalDuration);
        }
    });

    // make this testable with unit tests
    return { addContent: addContent };
});
