/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define([
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/action-dropdown',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/extensions'
], function (ToolbarView, ActionDropdownView, util, ext) {

    'use strict';

    var POINT = 'io.ox/test/toolbar',
        folder_id = 'toolbar/test',
        data = [{ id: 1, folder_id: folder_id }, { id: 2, folder_id: folder_id }],
        enableEight = false;

    // define links
    ext.point(POINT + '/links').extend(
        { id: 'one', title: 'One', prio: 'hi', ref: POINT + '/actions/one', section: 'a' },
        { id: 'two', title: 'Two', prio: 'hi', ref: POINT + '/actions/two', icon: 'fa fa-trash', section: 'a' },
        { id: 'three', title: 'Three', prio: 'hi', ref: POINT + '/actions/three', steady: true, section: 'a' },
        { id: 'four', title: 'Four', prio: 'lo', ref: POINT + '/actions/four', section: 'b' },
        { id: 'five', title: 'Five', prio: 'lo', ref: POINT + '/actions/five', section: 'b' },
        { id: 'six', title: 'Six', prio: 'lo', ref: POINT + '/actions/six', section: 'c' },
        { id: 'seven', title: 'Seven', prio: 'lo', ref: POINT + '/actions/seven', section: 'c' },
        { id: 'eight', title: 'Eight', prio: 'lo', ref: POINT + '/actions/eight', section: 'd', sectionTitle: 'foo' }
    );

    // define actions
    action(POINT + '/actions/one', {
        device: 'chrome'
    });

    action(POINT + '/actions/two', {
        collection: 'some'
    });

    action(POINT + '/actions/three', {
        matches: function () { return false; }
    });

    action(POINT + '/actions/four', {
        matches: function () { return true; }
    });

    action(POINT + '/actions/five');

    action(POINT + '/actions/six', {
        toggle: false
    });

    action(POINT + '/actions/seven', {
        device: 'firefox'
    });

    action(POINT + '/actions/eight', {
        matches: function () {
            return enableEight;
        },
        matchesAsync: function () {
            return _.wait(1).then(function () { return true; });
        }
    });

    function action(id, options) {
        ext.point(id).extend(_.extend({ id: 'default', index: 100 }, options));
    }

    describe('Actions', function () {

        //
        // Action Toolbar
        //

        describe('Toolbar view', function () {

            beforeEach(function () {
                this.toolbar = new ToolbarView({ point: POINT + '/links', simple: true });
            });

            it('has proper markup', function () {
                this.toolbar.setSelection(data);
                // proper role and class
                expect(this.toolbar.$('> ul').attr('role'), 'role').to.equal('toolbar');
                expect(this.toolbar.$('> ul').attr('class'), 'class').to.equal('classic-toolbar');
                // toolbar has a label
                expect(this.toolbar.$('> ul[aria-label]', 'aria-label').length).to.equal(1);
                // all <li> have proper role
                expect(this.toolbar.$('li[role="presentation"]', 'presentation').length).to.equal(6);
                // all <a> have proper role
                expect(this.toolbar.$('a[role="button"]', 'role button').length).to.equal(4);
                expect(this.toolbar.$('a[role="menuitem"]', 'role menuitem').length).to.equal(2);
                // last <li> in toolbar is "more" dropdown
                expect(this.toolbar.$('> ul > li').last().hasClass('dropdown'), 'dropdown').to.equal(true);
                // dropdown has proper role
                expect(this.toolbar.$('ul.dropdown-menu[role="menu"]', 'role menu').length).to.equal(1);
            });

            it('trigger ready event synchronously', function () {
                var spy = sinon.spy();
                this.toolbar.on('ready', spy);
                this.toolbar.setSelection(data);
                expect(spy.called).to.be.true;
            });

            it('renders actions', function () {
                this.toolbar.setSelection(data);
                // actions in total
                expect(this.toolbar.$('li[data-prio]').length).to.equal(5);
                // action in toolbar - not dropdown
                expect(this.toolbar.$('> ul > li[data-prio]').length).to.equal(3);
                // first action uses title
                expect(this.toolbar.$('[data-action="io.ox/test/toolbar/actions/one"]').text()).to.equal('One');
                // second uses icon
                expect(this.toolbar.$('[data-action="io.ox/test/toolbar/actions/two"] > i.fa').length).to.equal(1);
            });

            it('marks actions as disabled', function () {
                this.toolbar.setSelection(data);
                expect(this.toolbar.$('[data-action="io.ox/test/toolbar/actions/three"]').hasClass('disabled')).to.be.true;
            });

            it('waits for an async action', function (done) {
                enableEight = true;
                var spy = sinon.spy();
                this.toolbar.on('ready', spy);
                this.toolbar.on('ready:toolbar/test.1,toolbar/test.2', function (selection) {
                    // use try/catch to see the error instead of timeout
                    try {
                        expect(selection).to.equal('toolbar/test.1,toolbar/test.2');
                        expect(spy.called).to.be.true;
                    } catch (e) {
                        console.error(e);
                    } finally {
                        done();
                    }
                });
                this.toolbar.setSelection(data);
                expect(spy.called).to.be.false;
                enableEight = false;
            });
        });

        //
        // Action Dropdown
        //

        describe('Dropdown view', function () {

            beforeEach(function () {
                this.dropdown = new ActionDropdownView({ point: POINT + '/links', simple: true });
            });

            it('has proper markup', function () {
                enableEight = true;
                this.dropdown.setSelection(data);
                enableEight = false;
                // proper role and class
                expect(this.dropdown.$el.hasClass('dropdown')).to.be.true;
                // dropdown toggle
                expect(this.dropdown.$('> a.dropdown-toggle[role="button"][data-toggle="dropdown"]').length).to.equal(1);
                // all <li> have proper role
                expect(this.dropdown.$('li[role="presentation"]').length).to.equal(7);
                expect(this.dropdown.$('li.dropdown-header[role="presentation"]').length).to.equal(1);
                expect(this.dropdown.$('li[role="separator"]').length).to.equal(2);
                // all <a> have proper role
                expect(this.dropdown.$('a[role="button"]').length).to.equal(1);
                expect(this.dropdown.$('a[role="menuitem"]').length).to.equal(6);
            });
        });

        describe.only('Invoke', function () {

            // ----------------------------------------------------------

            action(POINT + '/actions/simple', {
                matches: function (baton) {
                    baton.spies.matches();
                    return true;
                },
                action: function (baton) {
                    baton.spies.action();
                }
            });

            // ----------------------------------------------------------

            action(POINT + '/actions/skip-first', {
                id: 'skip',
                index: 'first',
                collection: 'one',
                matches: function (baton) {
                    baton.spies.first.matches();
                    return false;
                },
                action: function (baton) {
                    baton.spies.first.action();
                }
            });

            action(POINT + '/actions/skip-first', {
                collection: 'one',
                matches: function (baton) {
                    baton.spies.second.matches();
                    return true;
                },
                action: function (baton) {
                    baton.spies.second.action();
                }
            });

            // ----------------------------------------------------------

            action(POINT + '/actions/skip-second', {
                collection: 'one',
                matches: function (baton) {
                    baton.spies.first.matches();
                    return true;
                },
                action: function (baton) {
                    baton.spies.first.action();
                }
            });

            action(POINT + '/actions/skip-second', {
                id: 'skip',
                index: 'last',
                collection: 'one',
                matches: function (baton) {
                    baton.spies.second.matches();
                    return true;
                },
                action: function (baton) {
                    baton.spies.second.action();
                }
            });

            // ----------------------------------------------------------

            action(POINT + '/actions/stop', {
                matches: function (baton) {
                    baton.stopPropagation();
                    baton.spies.first.matches();
                    return false;
                },
                action: function (baton) {
                    baton.spies.first.action();
                }
            });

            action(POINT + '/actions/stop', {
                id: 'skip',
                index: 'last',
                matches: function (baton) {
                    baton.spies.second.matches();
                    return true;
                },
                action: function (baton) {
                    baton.spies.second.action();
                }
            });

            // ----------------------------------------------------------

            it('calls stacking actions (skip first)', function () {
                var spies = {
                    first: { matches: sinon.spy(), action: sinon.spy() },
                    second: { matches: sinon.spy(), action: sinon.spy() }
                };
                var baton = ext.Baton({ data: [{}], simple: true, spies: spies });
                return util.invoke(POINT + '/actions/skip-first', baton).done(function () {
                    expect(baton.spies.first.matches.called, '#1').to.be.true;
                    expect(baton.spies.first.action.called, '#2').to.be.false;
                    expect(baton.spies.second.matches.called, '#3').to.be.true;
                    expect(baton.spies.second.action.called, '#4').to.be.true;
                });
            });

            it('calls stacking actions (skip last)', function () {
                var spies = {
                    first: { matches: sinon.spy(), action: sinon.spy() },
                    second: { matches: sinon.spy(), action: sinon.spy() }
                };
                var baton = ext.Baton({ data: [{}], simple: true, spies: spies });
                return util.invoke(POINT + '/actions/skip-second', baton).done(function () {
                    expect(baton.spies.first.matches.called, '#1').to.be.true;
                    expect(baton.spies.first.action.called, '#2').to.be.true;
                    expect(baton.spies.second.matches.called, '#3').to.be.false;
                    expect(baton.spies.second.action.called, '#4').to.be.false;
                });
            });

            it('calls stacking actions (stop propagation)', function () {
                var spies = {
                    first: { matches: sinon.spy(), action: sinon.spy() },
                    second: { matches: sinon.spy(), action: sinon.spy() }
                };
                var baton = ext.Baton({ data: [{}], simple: true, spies: spies });
                return util.invoke(POINT + '/actions/stop', baton).done(function () {
                    expect(baton.spies.first.matches.called, '#1').to.be.true;
                    expect(baton.spies.first.action.called, '#2').to.be.false;
                    expect(baton.spies.second.matches.called, '#3').to.be.false;
                    expect(baton.spies.second.action.called, '#4').to.be.false;
                });
            });
        });
    });
});
