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

(function ($) {

    'use strict';

    var activeElement,
        phone = _.device('smartphone');

    // jquery extension for dropdown
    function Plugin(options) {
        return this.each(function () {
            var $this = $(this);
            $this.attr('data-toggle', 'dropdown');
            if (options === 'toggle') $this.trigger('click');
        });
    }

    $.fn.dropdown = Plugin;

    // get parent function from bootstrap
    function getParent($this) {
        var selector = $this.attr('data-target');

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
        }

        var $parent = selector && $(selector);

        return $parent && $parent.length ? $parent : $this.parent();
    }

    // clear menus function from bootstrap
    function clearMenus(e) {
        if (e && e.which === 3) return;
        $('.dropdown-backdrop').remove();
        if (phone) {
            $('#io-ox-core').removeClass('menu-blur');
            $('.dropdown-menu:not([dontProcessOnMobile="true"])').hide();
            ox.idle();
        }
        $('[data-toggle="dropdown"]').each(function () {
            var $this = $(this);
            var $parent  = getParent($this);
            var relatedTarget = { relatedTarget: this };

            if (!$parent.hasClass('open')) return;

            var originalEventType = e ? e.type : null;
            if (originalEventType === 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return;

            $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));

            // dropdowns can be manually prevented from closing. exception: direct click on the toggle button
            // used by special dropdowns, like notification area (should not close when a sidepopup is opened or the user clicks within it)
            // also used by tours
            // prevent closing of currently opening dropdowns, produces weird glitches when content is loaded asynchronously (foldertree context menu)
            if (e.isDefaultPrevented() || $parent.attr('forceOpen') === 'true' || $this.hasClass('opening')) return;

            // if the user clicked on a focusable inputfield we focus that instead of the dropdown root element
            var focusableElement = $(document.activeElement).filter('.editable, input[type="text"], input[type="textarea"], input[type="email"]');
            if (activeElement) {
                if (!phone && originalEventType === 'click' && focusableElement.length) {
                    focusableElement.focus();
                } else {
                    activeElement.focus();
                }
            }

            $this.attr('aria-expanded', false);
            $parent.removeClass('open').trigger($.Event('hidden.bs.dropdown', relatedTarget));
        });
    }

    // used by mobile dropdown
    var closeString;
    $(document).one('dropdown:translate', function (e, string) {
        // get translated string when core gt is ready
        closeString = string;
    });
    function getCloseElement() {
        return $('<li><a href="#" class="io-ox-action-link" data-action="close-menu" data-i18n="Close">' + closeString + '</a></li>')
                    .on('click', function (e) {
                        e.preventDefault();
                        clearMenus();
                        return false;
                    });
    }

    function toggle(e, f) {
        var $this = $(this),
            $parent = getParent($this),
            dontProcessOnMobile = !!$parent.attr('dontProcessOnMobile'),
            isActive = $parent.hasClass('open');

        if ($this.is('.disabled, :disabled')) return;
        // on a phone detach the menu and attach it to the body again
        // with position fixed. Then it will be a modal menu in fullscreen
        if (phone && !dontProcessOnMobile) {
            var $ul = $parent.find('ul');
            if ($ul.length > 0) {
                // menu was not re-attched before
                if ($ul.children().length === 0) {
                    // dropdown is filled during runtime, we have to wait till it's all
                    // drawn and append the closer afterwards
                    setTimeout(function () {
                        var isVisible = $ul.is(':visible');
                        // special handling for foldertree dropdowns as these are built manually
                        // at runtime
                        if (f !== 'foldertree') $ul.append(getCloseElement());
                        $('body').append($ul.addClass('custom-dropdown'));
                        // the dropdown has display:none after moving to body, so reapply correct visibility status
                        if (isVisible) {
                            $ul.show();
                        }
                    }, 50);
                } else {
                    if (f !== 'foldertree') $ul.append(getCloseElement());
                    $('body').append($ul.addClass('custom-dropdown'));
                }
                // save it for later re-use
                $parent.data('menu', $ul);
            } else {
                // ensure the close button is the last,
                // may be not the case if a menu point is added after menu was
                // initial moved to the body by the code above
                var menu = $parent.data('menu');
                if (!menu.find('[data-action="close-menu"]').parent().is(':last-child')) {
                    menu.find('[data-action="close-menu"]').parent().appendTo(menu);
                }

                if (menu.find('[data-action="close-menu"]').length === 0) {
                    // for programmatic invoked menu we have to append a new closer as menus may be cleared
                    setTimeout(function () {
                        menu.append(getCloseElement());
                    }, 50);
                }
            }
            //remove dividers
            $parent.data('menu').find('.divider').remove();
        }

        // direct click on the toggle button removes the force open state
        if (e && ($parent[0] !== e.target || this === e.target)) {
            $parent.attr('forceOpen', false);
        }
        clearMenus();

        if (!isActive) {
            if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
                // if mobile we use a backdrop because click events don't delegate
                $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus);
            }

            var relatedTarget = { relatedTarget: $this.get(0) };
            $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget));

            activeElement = $(this);

            if (e.isDefaultPrevented()) return;

            $this.attr('aria-expanded', true);

            $parent
                .toggleClass('open')
                .trigger($.Event('shown.bs.dropdown', relatedTarget));

            if (phone && !dontProcessOnMobile) {
                ox.disable(true);
                $('#io-ox-core').addClass('menu-blur');
                $parent.data('menu').show();
            }

            $this.focus();
        }

        return false;
    }

    function keydown(e) {
        // close on ESC
        if (e.which === 27) return clearMenus();

        if (!/(13|32|38|40)/.test(e.which)) return;

        var $target = $(e.target),
            $parent = getParent($target),
            $menu = $target.siblings('ul'),
            isActive = $parent.hasClass('open');

        if (!isActive) {
            // do not explecitely open on enter or space
            if (!/(13|32)/.test(e.which)) $target.trigger('click');
            require(['io.ox/core/a11y'], function (a11y) {
                _.defer(function () {
                    var items = a11y.getTabbable($menu);
                    if (/(13|32|40)/.test(e.which)) {
                        items.first(':visible').focus();
                    }
                    if (e.which === 38) items.last(':visible').focus();
                });
            });
            return;
        }
    }

    function keydownMenu(e) {
        // close on ESC
        if (e.which === 27) return clearMenus();

        if (!/(38|40)/.test(e.which)) return;
        // Needs preventDefault(), otherwise scrolling occurs on pages that exceed view port.
        e.preventDefault();
        var $target = $(e.target),
            $menu = $target.closest('ul'),
            $list = $menu.find('a:visible[role^="menuitem"]'),
            index = $list.index($target);

        if (e.which === 38) index--;
        if (e.which === 40) index++;

        if (index < 0) index += $list.length;
        if (index >= $list.length) index -= $list.length;

        _.defer(function () {
            $list.eq(index).get(0).focus();
        });
    }

    function onClickListItem(e) {
        var $target = $(e.target);
        if (e.which === 32 && $target.is('a')) $target.click();
    }

    function onFocusOut() {
        var self = this;
        _.defer(function () {
            if (!$.contains(self, document.activeElement)) clearMenus();
        });
    }

    function onResize(e) {
        // do not clear menus when the resize event has been triggered or on android
        if (!e.originalEvent || _.device('smartphone && android')) return;
        clearMenus(e);
    }

    // global listener for dropdown handling
    $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '[data-toggle="dropdown"]', toggle)
    .on('keydown.bs.dropdown.data-api', '[data-toggle="dropdown"]', keydown)
    .on('keydown.bs.dropdown.data-api', '.dropdown-menu', keydownMenu)
    .on('keydown.bs.dropdown.data-api', '[role=menu]', onClickListItem)
    .on('focusout.dropdown.data-api', '.dropdown-menu', onFocusOut);
    $(window).on('resize', _.throttle(onResize, 200));

})(jQuery);
