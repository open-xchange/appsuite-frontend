/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/upsellads/register', [
    'io.ox/core/extensions',
    'gettext!plugins/portal',
    'settings!plugins/upsell',
    'less!plugins/portal/upsellads/style'
], function (ext, gt, settings) {

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

        if (!type || type === 'text-only') {
            toTarget.append(
                $('<div class="text upsell-full">').append(
                    $('<div class="overflow-container">').html(fromAd.text)
                )
            );

        } else if (type === 'text-top') {
            toTarget.append(
                $('<div class="text upsell-top">').html(fromAd.text),
                $('<div class="image upsell-bottom">').css({ 'background-image': 'url(' + fromAd.image + ')' })
            );

        } else if (type === 'text-bottom') {
            toTarget.append(
                $('<div class="image upsell-top">').css({ 'background-image': 'url(' + fromAd.image + ')' }),
                $('<div class="text upsell-bottom">').html(fromAd.text)
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
                    .append($('<i class="fa fa-circle-arrow-right fa-2x">'))
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
});
