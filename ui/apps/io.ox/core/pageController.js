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
    ['less!io.ox/core/pageController'], function () {

    'use strict';

    var PageController = function () {

        var pages = {},
            current,
            order = [],
            lastPage = [],
            self = this;

        function createPage(opt) {
            var defaults = {
                tag: '<div>',
                classes: 'io-ox-core-page page',
                container: $()
            };

            opt = _.extend(defaults, opt);
            // store page
            pages[opt.name] = {
                $el: $(opt.tag).addClass(opt.classes),
                navbar: opt.navbar
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
            // check if valid
            if (!pages[to]) {
                console.warn('target page does not exist: ', to);
                return;
            }
            // check if same page
            if (to === current) return;

            var opt = _.extend({ from: current, animation: 'slideleft' }, options || {}),
                $toPage = pages[to].$el,
                $fromPage = pages[opt.from].$el;

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
            // save for back-button
            lastPage = current;
            // start animation to-page in
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


        };

        this.goBack = function () {
            // TODO overhaulin, this is special for mail
            var target = lastPage;
            if (current === 'listView') target = 'folderTree';
            // TODO respect real last page
            this.changePage(target, {animation: 'slideright'});
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

        this.getNavbar = function (page) {
            if (!pages[page]) {
                console.error('PageController: Page ' + page + ' does not exist.');
                return;
            }
            return pages[page].navbar;
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
