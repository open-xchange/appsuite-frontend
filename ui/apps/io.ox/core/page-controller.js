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

define('io.ox/core/page-controller', [], function () {

    'use strict';

    var PageController = function (o) {
        // stats ;)
        //if (!window.trappedTaps) window.trappedTaps = 0;
        var pages = {},
            current,
            order = [],
            lastPage = [],
            self = this,
            // mimic an app object instead of real reference
            app = {
                navbar: o.navbar || $(),
                toolbar: o.toolbar || $(),
                options: {
                    name: o.appname
                }
            },
            //app = app,
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
         * changes the actual page to the given one
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

            var opt = _.extend({ from: current, animation: _.device('smartphone') ? 'slideleft' : 'pop', disableAnimations: false }, options || {}),
                $toPage = pages[to].$el,
                $fromPage = pages[opt.from].$el;

            // Android's native UI standard is pop, so we use this too
            opt.animation = _.device('android') ? 'pop' : opt.animation;

            // trigger 'before' events
            $toPage.trigger('pagebeforeshow', { frompage: opt.from });
            $fromPage.trigger('pagebeforehide', { topage: opt.to });

            // since the pagecontroller is also used on desktop
            // we have to dismiss this part on dekstop to prevent focus and a11y trouble
            if (_.device('smartphone')) {
                // page blur, dismiss keyboard
                try {
                    if (document.activeElement &&
                        document.activeElement.nodeName.toLowerCase() !== 'body') {

                        $(document.activeElement).blur();
                    } else {
                        $('input:focus, textarea:focus, select:focus').blur();
                    }
                } catch (e) {
                    // nothing
                }
            }

            // save for back-button
            lastPage = current;
            // start animation to-page in
            current = to;
            var tapTrap = $('<div class="taptrap">');
            if (_.device('!smartphone')) {
                // taptrap is not needed on desktop, use empty node
                tapTrap = $();
            }

            // only animate if possible
            if (Modernizr.cssanimations && !opt.disableAnimations) {
                _.defer(function () {
                    $toPage
                        .append(tapTrap)
                        .addClass('io-ox-core-animation in current ' + opt.animation)
                        .one('webkitAnimationEnd mozAnimationEnd animationend', function () {
                            $(this).removeClass('io-ox-core-animation in ' + opt.animation);
                            $toPage.trigger('pageshow', { from: opt.from, to: opt.to });
                            $(this).find('.taptrap').remove();
                        });
                    // prevent leaking
                    tapTrap = null;
                }, 1);

                // start animation "from" page out
                _.defer(function () {
                    $fromPage.removeClass('current')
                        .addClass('io-ox-core-animation out inmotion ' + opt.animation)
                        .one('webkitAnimationEnd mozAnimationEnd animationend', function () {
                            $(this).removeClass('io-ox-core-animation out inmotion ' + opt.animation);
                            $fromPage.trigger('pagehide', { from: opt.from, to: opt.to });
                        });
                }, 1);
            } else {
                // no animations, direct page change
                $toPage.addClass('current').trigger('pageshow', { from: opt.from, to: opt.to });
                $fromPage.removeClass('current').trigger('pagehide', { from: opt.from, to: opt.to });
            }

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

        this.goBack = function (options) {
            var target = lastPage,
                o = _.extend({ animation: 'slideright' }, options || {});
            // if we do have a custom navigation for some pages
            // use this instead of the last page
            if (backButtonRules && backButtonRules[current]) {
                target = backButtonRules[current];
            }
            this.changePage(target, o);
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

        /**
         * getPage
         * return the main DOM node of the page
         * @param  {string} page pagename to return
         * @return { jQuery object} jQuery node
         */
        this.getPage = function (page) {
            if (!pages[page]) {
                console.error('PageController: Page ' + page + ' does not exist.');
                console.error('PageController: Available pages are ' + order.join());
                return;
            }
            return pages[page].$el;
        };
        /**
         * returns the whole page object
         * @param  {string} page identifier of the page
         * @return { Object} the page object
         */
        this.getPageObject = function (page) {
            if (!pages[page]) {
                console.error('PageController: Page ' + page + ' does not exist.');
                console.error('PageController: Available pages are ' + order.join());
                return;
            }
            return pages[page];
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

        var showNavbar = function (page) {
            var bar = pages[page].navbar, last = pages[lastPage];
            if (last && last.navbar) last.navbar.toggle(false);
            if (bar) {
                if (!bar.rendered) bar.render();
                app.navbar.append(bar.$el);
                app.navbar.toggle(true);
                bar.toggle(true);
            } else {
                // hide navbar from previous page to get "fullscreen" page
                app.navbar.hide();
                pages[page].$el.addClass('fullscreen'); // remove padding
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
                // append new toolbar view and show toolbar container
                app.toolbar.append(bar.$el).show();
                app.toolbar.trigger('show');
                if (!secondary) {
                    bar.render();
                }
            } else if (app.toolbar) {
                // if there is no toolbar defined for the current page, hide the whole container
                app.toolbar.children().detach();
                app.toolbar.hide();
                app.toolbar.trigger('hide');
            }
        };

        this.toggleSecondaryToolbar = showToolbar;
    };

    return PageController;

});
