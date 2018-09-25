/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
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
