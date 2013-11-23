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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/files/fluid/view-detail', 'io.ox/core/extensions'], function (view, ext) {
    describe('files detail view', function () {
        var baton = ext.Baton.ensure({
                data: {
                    id: '4711'
                }
            }),
            app = {
                getName: function () {
                    return 'testapp';
                },
                folder : {
                    set: '0815'
                }
            };

        describe('needs a baton that', function () {
            it('has to be defined', function () {
                var node = view.draw();
                expect(node).toBeJquery();
                expect(node.is(':empty')).toBeTruthy;
            });
            it('stores name of opening app', function () {
                var node = view.draw(baton, app);
                expect(baton.openedBy).toEqual('testapp');
                delete baton.openedBy;
            });
        });

        describe('creates a DOM structure', function () {
            var node = view.draw(baton);
            $(document.body).empty().append(node);

            describe('with a container that', function () {
                it('has class file-details', function () {
                    expect(node.hasClass('file-details')).toBeTruthy;
                });
                it('use file id as data-cid', function () {
                    expect(node.attr('data-cid')).toEqual(baton.data.id);
                });
            });
            describe('with action menu that', function () {
                it('has some actions', function () {
                    expect(node.find('ul.io-ox-inline-links').children().length).toBeGreaterThan(0);
                });
            });
            it('with may contain a table with information about versions', function () {
                //no versions for dummy file
                expect(node.find('table.versiontable').length).toBe(0);
            });
        });
    });
});
