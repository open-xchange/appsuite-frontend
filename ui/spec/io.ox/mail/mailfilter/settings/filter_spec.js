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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define([
    'io.ox/mail/mailfilter/settings/filter',
    'waitsFor',
    'gettext!io.ox/mail'
], function (filters, waitsFor, gt) {

    'use strict';

    var resultWithFilter = { timestamp: 1378223251586, data: [
            {
                'position': 0,
                'id': 0,
                'flags': [],
                'test': {
                    'headers': ['To', 'Cc'],
                    'id': 'header',
                    'values': [''],
                    'comparison': 'matches'
                },
                'actioncmds': [{
                    'id': 'addflags',
                    'flags': ['$cl_1']
                }],
                'rulename': 'New rule',
                'active': true
            },
            {
                'position': 1,
                'id': 1,
                'flags': ['vacation'],
                'test': { 'id': 'true' },
                'actioncmds': [{
                    'id': 'vacation',
                    'text': 'text',
                    'days': '7',
                    'subject': 'subject',
                    'addresses': ['tester@open-xchange.com']
                }],
                'rulename': 'Abwesenheitsnotiz',
                'active': false
            }, {
                'position': 2,
                'id': 2,
                'flags': [],
                'test': {
                    'headers': ['To', 'Cc'],
                    'id': 'header',
                    'values': [''],
                    'comparison': 'matches'
                },
                'actioncmds': [{
                    'id': 'addflags',
                    'flags': ['$cl_1']
                }],
                'rulename': 'New rule 2',
                'active': false
            }, {
                'position': 3,
                'id': 3,
                'flags': [],
                'test': {
                    'id': 'true'
                },
                'rulename': 'PGP',
                'actioncmds': [{
                    'id': 'pgp',
                    'keys': '-----BEGIN PGP PUBLIC KEY BLOCK-----\r\nVersion: GnuPG v2.0.17 (GNU/Linux)\r\n\r\nmQENBFLreFoBCADOWZYrs/btv3DExwazPTxkmkzdmKgp3uw3+w0UDohFyyOcXowv\r\n81Q7DGEuTU9lk/R1TigzBWfVt8OOAKGGn1JGcDs+CVGdU++4VUoT9KvwoPL7K8Ys\r\nfrxWGxheEP4XGEhN++92dsQ1p6hIeZPf5z3V3MofZRls+SDeo1zhi33DGiYVYQHp\r\nD3A6+8X9rITsdRUXeyT6Qrv8q4yr6hUf2BnX5B+HSLjJeQ7CPj1YCM01onZIwSlv\r\ng4hpEx/JmHSupMkmCk7FpXXCM+fvdq07PtQBAd1Cbw4IPhdvQYop+tYID/ChBC4K\r\ntv1dU+UBvSausx4GjmkLgcGooYSvHR5YZrnzABEBAAG0MkhhYmkgVGFrICh0ZXN0\r\nYWNjb3VudCkgPGhhYml0YWtAdGVzdC5mYWlsbWFpbC5vcmc+iQE+BBMBAgAoBQJS\r\n63haAhsDBQkB4TOABgsJCAcDAgYVCAIJCgsEFgIDAQIeAQIXgAAKCRAdGOi2gcHA\r\nQgk+B/9Td7mc2i0NEa367LG6LQCq5EqdGWv9F3GeGZ+5eA/j058IwIedamLgpgh8\r\nx3DyHhv9cPtPEWN9ZNlxIwRMv8JhS08PgXScOfbyaOktF03W7a7Qq190nVUKfMfo\r\n4wPewKGNSpXqLn1wNiAaeSIftShylShTw+1nMKjyYBmWxRWcuta5wNLC4nJ1XcVb\r\n3kSkXvH9GGCTd6iiZ6who12XmjmRXmSkCpIgG57hwykeQJ1gqVoeOXYC2xJA3EsJ\r\n9m3o/ElVqsyUs7rzROeXImOYadIRwerVtcchsyPMCZJrJXwDan0dZykcwfgydMbA\r\nX+GSrdiYPqSl8xJp4l4mibQUlvxYuQENBFLreFoBCADHqj2Xgi1tiyO5qcLvh7LF\r\nqoA8Zfa9YNL8QyaZfEGWCY3inZ1BuvbjRw4P8B0deOoKkOxgc3BLaPOL3TMQIv2j\r\nwYuWXqLnn6zfC1eAlql4Ms+yMIm8nZ5y6Dua23bUeUpp/wd6+ZBD+jd7cVatsT9O\r\nCOje4xiw3R7vAofz9iQl6WI5/7ILi5IGPJ/KtlLtDeufLG9loRNHyT5pRJqIXiMG\r\np3kfe5YGuNPpktSLPKUZeZOmIQG3wBRAD21qjI0H93aG9M6KbaU4veiyBz6Pd+IA\r\nSzOMrOGc/usnAb7Ze8Xlm6ulQh/Zby3GiivzldQeJxuj2f9mo+1GdQPMzZhVk6tT\r\nABEBAAGJASUEGAECAA8FAlLreFoCGwwFCQHhM4AACgkQHRjotoHBwEJ6iQf+NqIK\r\nO2VhNZdZFPO6sX9ENeW0skZz3x6iqJ+d7xxhmdNRNFihDcaXPc0CKSzjV2jq5xHP\r\nLcbqcPwLJZAIeXAOQyUQ0PAxdmJbPws8wg+evb3fQa9NpBbUnsQpBUrBvMhPidgH\r\nbKviYr9eU1u2XwF+YLx21KFJmHcBfZARbkg8bxweRIlF9K4WKEhA6bi62F/NNxFU\r\nD8vG92Pach9vxJmPTY6Afv2YQQzcE1ZFxsw4ilImLYd0l28GWyHHEmHJaC4RZWXg\r\n5HMSS3/MzcRwJMAOjloFzkAtM1NdqSIhXR9A+UWOqRrN9YsaZ0toygJ6+s4CuC5E\r\nxIkAf8c60CqC9IpP4Q==\r\n=lIKb\r\n-----END PGP PUBLIC KEY BLOCK-----\r\n'
                }],
                'active': true
            }]
        },
        resultWithoutFilter = { data: [] },
        resultConfig = { timestamp: 1378223251586, data: {
            tests: [
                { test: 'address', comparison: ['user', 'detail'] },
                { test: 'envelope', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'exists', comparison: [] },
                { test: 'false', comparison: [] },
                { test: 'true', comparison: [] },
                { test: 'not', comparison: [] },
                { test: 'size', comparison: ['over', 'under'] },
                { test: 'header', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'allof', comparison: [] },
                { test: 'anyof', comparison: [] },
                { test: 'body', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'currentdate', comparison: ['ge', 'le', 'is', 'contains','matches'] }
            ],
            actioncommands: ['keep', 'discard', 'redirect', 'move', 'reject', 'stop', 'vacation', 'notify', 'addflags', 'set']
        }};

    describe('Mailfilter listview with rules', function () {

        beforeEach(function () {
            var that = this;
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultWithFilter));
            });

            this.server.respondWith('PUT', /api\/mailfilter\?action=config/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultConfig));
            });
            $('body', document).append(this.node = $('<div id="filtertestNode">'));

            filters.editMailfilter(this.node);
            return waitsFor(function () {
                return that.node.find('h1').length === 1;
            });

        });

        afterEach(function () {
            $('#filtertestNode', document).remove();
        });

        it('should draw the list of rules', function () {

            expect(this.node.find('h1')).to.have.length(1);
            expect(this.node.find('.btn-primary[data-action="add"]')).to.have.length(1);
            expect(this.node.find('li[data-id="0"]')).to.have.length(1);
            expect(this.node.find('li[data-id="0"]').hasClass('editable')).to.be.true;
            expect(this.node.find('li[data-id="1"]')).to.have.length(1);
            expect(this.node.find('li[data-id="1"]').hasClass('editable')).to.be.false;
            expect(this.node.find('li[data-id="2"]').hasClass('disabled')).to.be.true;
            expect(this.node.find('li[data-id="3"]').hasClass('editable')).to.be.false;
            expect(this.node.find('li a.drag-handle')).to.have.length(4);
            expect(this.node.find('li .widget-title')).to.have.length(4);
            expect(this.node.find('li [data-action="edit"]')).to.have.length(2);
            expect(this.node.find('li [data-action="edit-vacation"]')).to.have.length(1);
            expect(this.node.find('li [data-action="toggle"]')).to.have.length(3);
            expect(this.node.find('li [data-action="delete"]')).to.have.length(3);

        });

    });

    describe('Mailfilter listview without rules', function () {

        beforeEach(function () {
            var that = this;
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultWithoutFilter));
            });

            this.server.respondWith('PUT', /api\/mailfilter\?action=config/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultConfig));
            });
            $('body', document).append(this.node = $('<div id="filtertestNode">'));

            filters.editMailfilter(this.node);
            return waitsFor(function () {
                return that.node.find('h1').length === 1;
            });

        });

        afterEach(function () {
            $('#filtertestNode', document).remove();
        });

        it('should draw the empty list', function () {

            expect(this.node.find('h1')).to.have.length(1);
            expect(this.node.find('.btn-primary[data-action="add"]')).to.have.length(1);
            expect(this.node.find('h1')).to.have.length(1);
            expect(this.node.find('ol div').text()).to.equal(gt('There is no rule defined'));

        });

        it('should trigger the create new rule dialog', function () {
            var addButton,
                $popup;

            addButton = this.node.find('.btn-primary[data-action="add"]');
            addButton.click();

            $popup = $('body').find('.io-ox-mailfilter-edit').closest('.io-ox-dialog-popup');
            expect($popup).to.have.length(1);
            $popup.remove();
        });

    });

});
