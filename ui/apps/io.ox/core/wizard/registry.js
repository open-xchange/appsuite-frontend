/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/wizard/registry', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core/wizard',
    'less!io.ox/core/wizard/style'
], function (ext, dialogs, gt) {

    'use strict';

    function Wizard(options) {
        if (!options) {
            console.error('Please specify options for the wizard. At minimum it needs an id!');
            options = { id: 'defunct' };
        }
        var state = 'stopped';
        var batons = {};
        var renderedPages = {};
        var self = this;
        var isBusy = false;

        this.options = options;
        this.runOptions = null;

        this.index = 0;

        this.currentPage = null;
        this.previousPage = null;
        this.nextPage = null;
        this.dialog = null;
        this.pageData = {};

        this.wizardIsRunning = null;

        this.navButtons = $('<div/>').append(
            $('<button type="button" class="btn btn-default wizard-next">').text(gt('Next')).on('click', function () {
                self.next();
            }),
            $('<button type="button" class="btn btn-primary wizard-done">').text(gt('Done')).on('click', function () {
                self.done();
            }),
            $('<button type="button" class="btn wizard-prev">').text(gt('Previous')).on('click', function () {
                self.back();
            })
        );

        if (options.closeable) {
            this.navButtons.append(
                $('<button type="button" class="btn btn-default wizard-close">').text(gt('Close')).on('click', function () {
                    self.close();
                })
            );
        }

        function isNextEnabled() {
            return getBaton().buttons.nextEnabled;
        }

        function busy() {
            isBusy = true;
            self.dialog.busy();
        }

        function idle() {
            isBusy = false;
            self.dialog.idle();
            self.updateButtonState();
        }

        function getBaton(index) {
            if (_.isUndefined(index)) {
                index = self.index;
            }
            if (batons[index]) {
                return batons[index];
            }
            var baton = ext.Baton.ensure(self.runOptions);
            baton.wizard = self;
            baton.ready = $.Deferred();
            batons[index] = baton;
            baton.completed = false;

            baton.buttons = {
                nextEnabled: false
            };

            baton.buttons.enableNext = function () {
                baton.buttons.nextEnabled = true;
                baton.wizard.updateButtonState();
            };

            baton.buttons.disableNext = function () {
                baton.buttons.nextEnabled = false;
                baton.wizard.updateButtonState();
            };
            return baton;
        }

        function callMethod(page, methodName, index) {
            if (page[methodName] && _.isFunction(page[methodName])) {
                return page[methodName](getBaton(index));
            }
            return null;
        }

        function triggerLoad(page, index) {
            var baton = getBaton(index);
            if (baton.ready.state() !== 'pending') {
                return baton.ready;
            }
            if (page.load) {
                var def = page.load(baton);
                if (def) {
                    def.done(baton.ready.resolve).fail(baton.ready.reject);
                }
                return baton.ready;
            }

            baton.ready.resolve();

            return baton.ready;
        }

        function triggerPreLoad(page, index) {
            var baton = getBaton(index);
            if (baton.ready.state() !== 'pending') {
                return;
            }

            if (page.options && !_.isUndefined(page.options.preLoad) && !page.options.preLoad) {
                return;
            }

            if (page.preLoad) {
                page.preLoad(baton);
                return;
            }

            if (page.load) {
                var def = page.load(baton);
                if (def) {
                    def.done(baton.ready.resolve).fail(baton.ready.reject);
                }
                return baton.ready;
            }

            baton.ready.resolve();

            return baton.ready;
        }

        function goToPage(pageNum) {
            var pages = self.pages();
            var length = pages.length;
            if (!_.isNumber(pageNum)) {
                // id?
                var name = pageNum;
                pageNum = _(pages).find(function (elem) {
                    return elem.id === pageNum;
                });
                if (_.isUndefined(pageNum)) {
                    console.error('Could not find page with id "' + name + '"');
                    pageNum = 0;
                }
            }
            if (pageNum >= length) {
                self.close();
                return;
            }

            if (pageNum < 0) {
                return;
            }

            if (self.currentPage) {
                callMethod(self.currentPage, 'leave', self.index);
            }

            self.previousPage = (pageNum > 0) ? pages[pageNum - 1] : null;
            self.nextPage = ((pageNum + 1) < length) ? pages[pageNum + 1] : null;
            self.currentPage = pages[pageNum];

            // hide and show buttons as needed
            if (self.previousPage) {
                self.navButtons.find('.wizard-prev').show();
            } else {
                self.navButtons.find('.wizard-prev').hide();
            }

            if (self.nextPage) {
                self.navButtons.find('.wizard-next').show();
                self.navButtons.find('.wizard-done').hide();
            } else {
                self.navButtons.find('.wizard-next').hide();
                self.navButtons.find('.wizard-done').show();
            }

            self.navButtons.find('.wizard-close').show();

            if (self.currentPage.metadata('hideButtons', getBaton())) {
                self.navButtons.find('button').hide();
            }

            self.index = pageNum;
            busy();
            triggerLoad(self.currentPage).done(function () {
                self.dialog.getBody().find('.wizard-page').detach();
                if (!renderedPages[self.index]) {
                    var $div = $('<div class="wizard-page"></div>');
                    self.currentPage.draw.call($div, getBaton());
                    renderedPages[self.index] = $div;
                }
                self.dialog.getBody().append(renderedPages[self.index]);
                idle();
                callMethod(self.currentPage, 'activate', self.index);
                self.dialog.getHeader().find('.wizard-header').detach();
                self.dialog.getHeader().append($('<h1 class="wizard-header" />').text(self.currentPage.metadata('title', getBaton())));
                self.updateButtonState();

            }).fail(function (resp) {
                require('io.ox/core/notifications').yell(resp);
                self.close();
            });

            setTimeout(function () {
                if (self.nextPage) {
                    triggerPreLoad(self.nextPage, self.index + 1);
                }

                if (self.previousPage) {
                    triggerPreLoad(self.previousPage, self.index - 1);
                }
            }, 0);

        }

        this.updateButtonState = function () {
            if (isBusy) return;

            var next = this.navButtons.find('.wizard-next'),
                done = this.navButtons.find('.wizard-done');

            if (isNextEnabled()) {
                next.prop('disabled', false);
                next.addClass('btn-primary');
                next.removeClass('btn-disabled');
            } else {
                next.prop('disabled', true);
                next.removeClass('btn-primary');
                next.addClass('btn-disabled');
            }

            done.prop('disabled', false);
            done.removeClass('btn-disabled');
        };

        this.point = function () {
            return ext.point(options.id);
        };

        this.titles = function () {
            var titles = [];
            var i = 0;
            _(this.pages()).each(function (page) {
                titles.push(page.metadata('title', getBaton(i)));
                i++;
            });
        };

        this.pages = function () {
            return this.point().list();
        };

        this.start = function (options) {
            options = options || {};
            if (state !== 'stopped') {
                console.error('Cannot start wizard, when it is in state: ', state);
                return;
            }
            this.dialog = new dialogs.ModalDialog({ easyOut: !!this.options.closeable });
            this.dialog.getContentControls().append(this.navButtons);
            if (!!options.id) {
                this.dialog.getPopup().attr('id', options.id);
            }
            if (!!options.cssClass) {
                this.dialog.getPopup().addClass(options.cssClass);
            }
            this.runOptions = options;
            goToPage(0);
            this.wizardIsRunning = this.dialog.show();
            return this.wizardIsRunning;

        };

        this.next = function () {
            if (!isNextEnabled()) {
                return;
            }
            var def = $.when();
            if (this.currentPage) {
                def = callMethod(this.currentPage, 'finish', this.index) || $.when();
            }
            busy();
            def.then(function () {
                idle();
                goToPage(self.index + 1);
            }, function () {
                idle();
                goToPage(self.index);
            });
        };

        this.done = function () {
            if (!isNextEnabled()) {
                return;
            }
            var def = $.when();
            if (this.currentPage) {
                def = callMethod(this.currentPage, 'finish', this.index) || $.when();
            }
            busy();
            def.done(function () {
                idle();
                self.close();
            });
        };

        this.back = function () {
            goToPage(this.index - 1);
        };

        this.close = function () {
            if (state === 'done') {
                return;
            }
            state = 'done';
            this.dialog.close();
        };

        this.busy = busy;
        this.idle = idle;
        this.goToPage = goToPage;

    }

    return {
        getWizard: function (options) {
            return new Wizard(options);
        }
    };
});
