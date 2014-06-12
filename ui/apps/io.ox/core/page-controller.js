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

define('io.ox/core/page-controller',
    ['less!io.ox/core/page-controller'], function () {

    'use strict';

    var PageController = function (app, o) {

        var pages = {},
            current,
            order = [],
            lastPage = [],
            self = this,
            app = app,
            backButtonRules,
            options = o || {};

        function createPage(opt) {
            var defaults = {
                tag: '<div>',
                classes: 'io-ox-pagecontroller page',
                container: $()
            };

            opt = _.extend(defaults, opt);
            if (options.container) opt.container = options.container;
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

            // for easier debugging
            pages[opt.name].$el.attr('data-page-id', app.options.name + '/' + opt.name);

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

        /**
         * setBackButtonRules is used to customize
         * the back button navigation. The rules object
         * is used to navigate back from a page (key) to another page (value)
         * @param {[Object]} rules An object with key-value pairs
         * of currentPage and toPage
         */
        this.setBackbuttonRules = function (rules) {
            backButtonRules = rules;
        };

        this.goBack = function () {
            var target = lastPage;

            // if we do have a custom navigation for some pages
            // use this instead of the last page
            if (backButtonRules && backButtonRules[current]) {
                target = backButtonRules[current];
            }
            this.changePage(target, {animation: 'slideright'});
        };

        /**
         * addPage creates a new page and adds it to the current
         * page stack
         * @param {[object]} opt an object like this
         * {
                name: string,
                container: Node,
                navbar: NavbarView,
                toolbar: ToolbarView
            }
         */
        this.addPage = function (opt) {
            if (!opt) return;
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

        this.getSecondaryToolbar = function (page) {
            if (!pages[page]) {
                console.error('PageController: Page ' + page + ' does not exist.');
                return;
            } else if (!pages[page].secondaryToolbar) {
                console.error('PageController: Page ' + page + ' does not own a secondary toolbar.');
                return;
            }
            return pages[page].secondaryToolbar;
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
                app.navbar.find('.toolbar-content').detach();
                app.navbar.append(bar.$el);
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
                // remove old stuff
                app.toolbar.children().detach();
                // appen new toolbar view and show toolbar container
                app.toolbar.append(bar.$el).show();
                if (!secondary) {
                    bar.render();
                }
            } else {
                // if there is no toolbar defined for the current page, hide the whole container
                app.toolbar.children().detach();
                app.toolbar.hide();
            }
        };

    };

    return PageController;

});
