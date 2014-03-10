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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/core/pageController',
    ['io.ox/core/extPatterns/links',
    'less!io.ox/core/pageController.less'], function (links) {

    'use strict';

    var Action = links.Action;

    new Action('io.ox/mail/actions/navigation', {
        id: 'back',
        requires: function () {
            return true;
        },
        action: function (baton) {
            console.log('wurstblinker', baton);
        }
    });

    var PageController = function () {
        var pages = {},
            current,
            order = [],
            self = this;

        // just for testing atm
        $(window).on('popstate', function () {
            // TODO make this safe to work
            self.goBack();
        });

        function createPage(opt) {
            var defaults = {
                tag: '<div>',
                classes: 'page',
                container: $()
            };

            opt = _.extend(defaults, opt);
            // store page
            pages[opt.name] = {
                $el: $(opt.tag).addClass(opt.classes)
            };

            // pages must be created in the correct order
            // to make the back function work
            // first page created is the most left page in the stack
            order.push(opt.name);

            // append to container
            $(opt.container)
                .append(pages[opt.name].$el);

            if (opt.startPage) {
                self.setCurrentPage(opt.name);
            }
        }
        /*
         * simple showpage, does not add transition to pages
         */
        this.showPage = function (page) {
            if (page !== current) {
                self.setCurrentPage(page);
            }
        };

        /*
         * changePage
         * changes the acutal page to the given one
         * with given animation and options
         */
        this.changePage = function (to, options) {
            console.log(to, opt);
            if (to === current) return;
            var opt = _.extend({ from: current, animation: 'slideleft' }, options || {}),
                $toPage = pages[to].$el,
                $fromPage = pages[opt.from].$el;

             // check if valid
            if (!$toPage) {
                console.warn('target page does not exist: ', opt.to);
                return;
            }
            // trigger 'before' events
            $toPage.trigger('pagebeforeshow', {frompage: opt.from});
            $fromPage.trigger('pagebeforehide', {topage: opt.to});


            try {
                if (document.activeElement &&
                    document.activeElement.nodeName.toLowerCase() !== 'body') {

                    $(document.activeElement).blur();
                } else {
                    $('input:focus, textarea:focus, select:focus').blur();
                }
            } catch (e) {

            }

            // start animation to page in
            current = to;

            _.defer(function () {
                $toPage.addClass('in current ' + opt.animation)
                    .one('webkitAnimationEnd animationend', function () {
                        //console.log('animation end toPAge');
                        $(this).removeClass('in ' + opt.animation);
                        $toPage.trigger('pageshow', {from: opt.from, to: opt.to});
                    });
            }, 1);

            // start animation "from" page out
            _.defer(function () {
                $fromPage.removeClass('current')
                    .addClass('out inmotion ' + opt.animation)
                    .one('webkitAnimationEnd animationend', function () {
                        //console.log('animation end fromPage');
                        $(this).removeClass('out inmotion ' + opt.animation);
                        $fromPage.trigger('pagehide', {from: opt.from, to: opt.to});

                    });
            }, 1);

            window.history.pushState({foo: 1});

        };

        this.goBack = function () {
            var cPos = _.indexOf(order, current);
            if (cPos === 0) return;

            // TODO respect real last page
            this.changePage(order[cPos - 2], {animation: 'slideright'});
        };

        this.addPage = function (opt) {
            createPage(opt);
            return this;
        };

        this.getPage = function (page) {
            if (!pages[page]) {
                console.error('PageController: Page ' + page + ' does not exist.');
                console.error('PageController: Available pages are ' + order.join());
                return;
            }
            if (_.device('!small')) {
                // on desktop return only the node
                return pages[page].$el;
            } else {
                // on mobile we need a page object to work with
                return pages[page].$el;
            }
        };

        this.getCurrentPage = function () {
            return pages[current];
        };

        this.setCurrentPage = function (page) {
            if (current) pages[current].$el.removeClass('current');
            pages[page].$el.addClass('current');
            current = page;
        };

        this.getPages = function () {
            return pages;
        };


    };

    return PageController;

});