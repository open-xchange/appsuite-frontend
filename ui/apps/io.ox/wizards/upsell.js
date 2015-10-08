/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2013
 * Mail: info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

/**
* TODO:
* - empty detail view looks shitty
* - remove ticked checkboxes after buying product
* - show un-uncheckable checkboxes if product is owned
*/
define('io.ox/wizards/upsell', [
    'io.ox/core/extensions',
    'io.ox/core/wizard/registry',
    'io.ox/backbone/mini-views',
    'settings!plugins/upsell',
    'gettext!io.ox/wizards',
    'less!io.ox/wizards/upsell'
], function (ext, wizards, miniViews, settings, gt) {

    'use strict';

    var getProducts,
        link,
        shop = settings.get('shop'),
        point = ext.point('io.ox/wizards/upsell'),
        priceFormat = '%sEUR',
        printPrice,
        Product = Backbone.Model.extend({}),
        products = [];

    getProducts = function (shop) {
        var products, languages, prodKeys, result = [];

        if (!shop.products || _(shop.products).isEmpty()) {
            console.error('No products present', shop);
            return;
        }

        languages = _(shop.products).keys();
        products = _(languages).contains(ox.language) ? shop.products[ox.language] : shop.products[languages[0]];

        prodKeys = _(products).keys().sort();
        _(prodKeys).each(function (key) {
            var p = products[key];
            result.push(
                new Product({
                    id: key,
                    image: p.image,
                    title: p.title,
                    price: p.price,
                    description: p.description
                })
            );
        });
        return result;
    };

    printPrice = function (prod) {
        return _.printf(priceFormat, prod.get('price').toFixed(2));
    };

    link = shop.target;
    priceFormat = shop.priceFormat ? shop.priceFormat : priceFormat;
    products = getProducts(shop);

    point.extend({
        id: 'upsell-selection',
        index: 100,
        title: gt('Upgrade to premium edition'),
        activate: function () {
            $('.wizard-next').text(gt('Next'));
        },
        draw: function (baton) {
            var $products = $('<form class="upsell-product-choice">'),
                $details = $('<div class="upsell-product-details">'),
                $cart = $('<div class="upsell-shopping-cart">'),
                $this = $(this),
                cartContents,
                updateCart;

            /* what to do when contents of cart change */
            updateCart = function () {
                /* what is in the cart? */
                cartContents = _(products).filter(function (prod) {
                    return prod.attributes.inCart;
                });

                /* update view */
                $cart.find('.upsell-shopping-cart-status').empty();
                _(cartContents).each(function (prod) {
                    $cart.find('.upsell-shopping-cart-status').append(
                        $('<span>').text(prod.get('title')),
                        $('<br/>')
                    );
                });

                /* toggle next button */
                if (cartContents.length > 0) {
                    baton.buttons.enableNext();
                } else {
                    baton.buttons.disableNext();
                }

            };

            /* draw product selection pane */
            _(products).each(function (p) {
                $products.append(
                    $('<div class="upsell-product upsell-product-' + p.id + '">').append(
                        $('<div class="upsell-product-image">').css({ 'background-image': 'url(' + p.get('image') + ')' }),
                        $('<label class="upsell-product-name">').append(
                            new miniViews.CheckboxView({ name: 'inCart', model: p }).render().$el,
                            $.txt(' '),
                            $.txt(p.get('title'))
                        ),
                        $('<span class="upsell-product-price">').text(printPrice(p))
                    )
                );
            });

            /* draw cart */
            $cart.append(
                $('<i class="fa fa-shopping-cart fa-2x">'),
                $('<span class="title">').text(gt('Shopping cart')),
                $('<br/>'),
                $('<span class="upsell-shopping-cart-status">').text(gt('Cart is empty.'))
            );

            /* draw detail view pane */
            _(products).each(function (p) {
                $details.append(
                    $('<div class="upsell-product upsell-product-' + p.id + '">').append(
                        $('<div class="upsell-product-image">').css({ 'background-image': 'url(' + p.get('image') + ')' }),
                        $('<div class="upsell-product-name">').text(p.get('title')),
                        $('<span class="upsell-product-price">').text(printPrice(p)),
                    $('<div class="upsell-product-description">').html(p.get('description'))
                    )
                );
            });
            $details.find('.upsell-product').hide();
            $details.append(
                $('<div class="upsell-product filler">').append(
                    $('<span>').text('No product was selected.'),
                    $('<br/>'),
                    $('<span>').html(' &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;')
                )
            );

            /* event listening */
            $products.delegate('.upsell-product', 'click', function (eventDetail) {
                var toActivate = $(eventDetail.currentTarget).attr('class');

                $details.find('.upsell-product').hide();
                $details.find('.' + toActivate.replace(/\s+/, '.')).show();
            });

            $products.delegate('.upsell-product', 'change', updateCart);

            /* put it all on display */
            $this.append($products, $cart, $details);

            updateCart();
        }
    });

    point.extend({
        id: 'upsell-confirmation',
        index: 200,
        title: gt('Review your purchases'),
        activate: function (baton) {
            var cartContents,
                total,
                $cart = baton.confirm.node;

            $cart.empty();

            cartContents = _(products).filter(function (prod) {
                return prod.attributes.inCart;
            });

            total = _(cartContents).reduce(function (memo, prod) {
                return memo + parseFloat(prod.get('price'));
            }, 0);

            _(cartContents).each(function (prod) {
                $cart.append(
                    $('<tr class="upsell-product upsell-product-' + prod.id + '">').append(
                        $('<td class="upsell-product-name">').text(prod.get('title')),
                        $('<td class="upsell-product-price">').text(_.printf(priceFormat, prod.get('price').toFixed(2)))
                    )
                );
            });

            $cart.append(
                $('<tr class="upsell-total">').append(
                    $('<td>').text(gt('Total cost')),
                    $('<td>').text(_.printf(priceFormat, total.toFixed(2)))
                )
            );

            if (cartContents.length > 0) {
                baton.buttons.enableNext();
            }

            $('.wizard-next').text(gt('Buy now!'));
        },
        draw: function (baton) {
            var $this = $(this),
                $cart = $('<table class="upsell-shopping-cart-review">').appendTo($this);

            baton.confirm = { node: $cart };

            $this.append(
                $('<div class="upsell-disclaimer">').html(shop.disclaimer.en_US)
            );
        }
    });

    point.extend({
        id: 'upsell-acknowledgement',
        index: 300,
        title: gt('Purchase confirmation'),
        draw: function (baton) {
            var cartContents,
                idList,
                $activation = $('<div class="upsell-activation">').appendTo($(this)),
                $list = $('<ul class="upsell-product-activated">');

            cartContents = _(products).filter(function (prod) {
                return prod.attributes.inCart;
            });
            idList = _(cartContents).pluck('id').join(',');

            $.ajax(link.replace('OXUPSELLCART', idList).replace('OXUPSELLCONTEXT', ox.context_id).replace('OXUPSELLUSER', ox.user_id));

            $activation.append(
                $('<p>').text(gt('The following products will be activated now:')),
                $list
            );

            _(cartContents).each(function (prod) {
                $list.append(
                    $('<p class="upsell-product-name">').text(prod.get('title'))
                );
                prod.attributes.inCart = false;
            });
            baton.buttons.enableNext();
            $('.wizard-prev').hide();
        }
    });

    return {
        getInstance: function () {
            // Create a new instance of the wizard. Note that the id of the wizard determines the extension point
            // that pages have to extend
            return wizards.getWizard({ id: 'io.ox/wizards/upsell', closeable: true });
        }
    };
});
