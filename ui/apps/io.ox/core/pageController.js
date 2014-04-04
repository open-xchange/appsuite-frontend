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

    var PageController = function (app) {

        var pages = {},
            current,
            order = [],
            lastPage = [],
            self = this,
            app = app;

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
                navbar: opt.navbar,
                toolbar: opt.toolbar,
                secondaryToolbar: opt.secondaryToolbar,
                name: opt.name
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

            // page blur, dismiss keyboard
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
                $toPage.addClass('io-ox-core-animation in current ' + opt.animation)
                    .one('webkitAnimationEnd animationend', function () {
                        $(this).removeClass('io-ox-core-animation in ' + opt.animation);
                        $toPage.trigger('pageshow', {from: opt.from, to: opt.to});
                    });
            }, 1);

            // start animation "from" page out
            _.defer(function () {
                $fromPage.removeClass('current')
                    .addClass('io-ox-core-animation out inmotion ' + opt.animation)
                    .one('webkitAnimationEnd animationend', function () {
                        $(this).removeClass('io-ox-core-animation out inmotion ' + opt.animation);
                        $fromPage.trigger('pagehide', {from: opt.from, to: opt.to});
                    });
            }, 1);

            showNavbar(to);
            showToolbar(to);

        };

        this.goBack = function () {
            // TODO overhaulin, this is special for mail
            var target = lastPage;
            // this is not a browsing history, so we have to maintain special states
            if (current === 'listView') target = 'folderTree';
            if (current === 'threadView') target = 'listView';
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
            return pages[page].$el;
        };

        this.getNavbar = function (page) {
            if (!pages[page]) {
                console.error('PageController: Page ' + page + ' does not exist.');
                return;
            }
            return pages[page].navbar;
        };

        this.getAll = function () {
            return pages;
        };

        this.getToolbar = function (page) {
            if (!pages[page]) {
                console.error('PageController: Page ' + page + ' does not exist.');
                return;
            }
            return pages[page].toolbar;
        };

        this.getCurrentPage = function () {
            return pages[current];
        };

        this.setCurrentPage = function (page) {
            if (current) pages[current].$el.removeClass('current');
            pages[page].$el.addClass('current');
            showNavbar(page);
            showToolbar(page);
            current = page;
        };

        this.getPages = function () {
            return pages;
        };

        this.toggleSecondaryToolbar = function (page, state)  {
            showToolbar(page, state);
        };

        var showNavbar = function (page) {
            var bar = pages[page].navbar;
            if (bar) {
                app.navbar.empty().append(bar.render().$el);
            }
        };

        var showToolbar = function (page, secondary) {
            var bar;
            if (secondary && !!pages[page].secondaryToolbar) {
                bar = pages[page].secondaryToolbar;
            } else if (pages[page].toolbar) {
                bar = pages[page].toolbar;
            }
            if (bar) {
                app.toolbar.empty().show().append(bar.render().$el);
            } else {
                app.toolbar.empty().hide();
            }
        };

    };

    return PageController;

});
