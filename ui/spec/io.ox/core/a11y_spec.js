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

define([
    'io.ox/core/a11y'
], function (a11y) {

    'use strict';

    describe('Core: a11y', function () {
        describe('select previous tabbable element', function () {

            beforeEach(function () {
                $('body').empty();
            });

            after(function () {
                ox.testUtils.stubAppsuiteBody();
            });

            it('with direct predecessor', function () {
                var el = $('<a href="#">'), other = $('<a href="#">'), result;
                $('body').append($('<div>').append(
                    $('<a href="#">'), other, el, $('<a href="#">')
                ));
                result = a11y.getPreviousTabbable(el);
                result.is(other).should.be.true;
            });

            it('with parent', function () {
                var el = $('<a href="#">'), other = $('<div tabindex="0">'), result;
                $('body').append($('<div>').append(
                    $('<a href="#">'), other.append(el), $('<a href="#">')
                ));
                result = a11y.getPreviousTabbable(el);
                result.is(other).should.be.true;
            });

            it('with indirect predecessor', function () {
                var el = $('<a href="#">'), other = $('<a href="#">'), result;
                $('body').append($('<div>').append(
                    $('<a href="#">'), other
                ), $('<div>').append(
                    el, $('<a href="#">')
                ));
                result = a11y.getPreviousTabbable(el);
                result.is(other).should.be.true;
            });

            it('with no previous element', function () {
                var el = $('<a href="#">'), other = $('<a href="#">'), result;
                $('body').append($('<div>').append(
                    el, $('<a href="#">'), $('<a href="#">'), other
                ));
                result = a11y.getPreviousTabbable(el);
                result.is(other).should.be.true;
            });
        });

        describe('select next tabbable element', function () {

            beforeEach(function () {
                $('body').empty();
            });

            after(function () {
                ox.testUtils.stubAppsuiteBody();
            });

            it('with direct descendant', function () {
                var el = $('<a href="#">'), other = $('<a href="#">'), result;
                $('body').append($('<div>').append(
                    $('<a href="#">'), el, other, $('<a href="#">')
                ));
                result = a11y.getNextTabbable(el);
                result.is(other).should.be.true;
            });

            it('with child', function () {
                var el = $('<div tabindex="0">'), other = $('<a href="#">'), result;
                $('body').append($('<div>').append(
                    $('<a href="#">'), el.append(other), $('<a href="#">')
                ));
                result = a11y.getNextTabbable(el);
                result.is(other).should.be.true;
            });

            it('with indirect descendant', function () {
                var el = $('<a href="#">'), other = $('<a href="#">'), result;
                $('body').append($('<div>').append(
                    $('<a href="#">'), el
                ), $('<div>').append(
                    other, $('<a href="#">')
                ));
                result = a11y.getNextTabbable(el);
                result.is(other).should.be.true;
            });

            it('with no following element', function () {
                var el = $('<a href="#">'), other = $('<a href="#">'), result;
                $('body').append($('<div>').append(
                    other, $('<a href="#">'), $('<a href="#">'), el
                ));
                result = a11y.getNextTabbable(el);
                result.is(other).should.be.true;
            });
        });

    });

});
