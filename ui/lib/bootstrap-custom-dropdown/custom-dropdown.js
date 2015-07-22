/* ========================================================================
 * Bootstrap: dropdown.js v3.1.1
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2013 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== */

/**
 * enhanced bootstrap dropdown for use in app suite with mobile support
 * author: Alexander Quast <alexander.quast@open-xchange.com>
 */

+function ($) {
    'use strict';
    // DROPDOWN CLASS DEFINITION
    // =========================

    var backdrop = '.dropdown-backdrop'
    var toggle   = '[data-toggle="dropdown"]'
    var Dropdown = function (element) {
        $(element).on('click.bs.dropdown', this.toggle)
    }
    var phone = _.device('smartphone');
    var activeElement = null;
    var closeString;
    $(document).one('dropdown:translate', function (e, string) {
        // get translated string when core gt is ready
        closeString = string;
    });

    function getCloseElement () {
        return $('<li><a href="#" class="io-ox-action-link" data-action="close-menu" data-i18n="Close">' + closeString + '</a></li>')
                    .on('click', function (e) {
                        e.preventDefault();
                        clearMenus();
                    });
    };

    Dropdown.prototype.toggle = function (e, f) {
        var $this = $(this)
        if ($this.is('.disabled, :disabled')) return

        var $parent  = getParent($this)
        var isActive = $parent.hasClass('open')

        // on a phone detach the menu and attach it to the body again
        // with position fixed. Then it will be a modal menu in fullscreen
        if (phone) {
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
                } else if (!menu.find('[data-action="close-menu"]')) {
                    // for programmatic invoked menu we have to append a new closer as menus may be cleared
                    setTimeout(function () {
                        menu.append(getCloseElement());
                    }, 50);
                }
            }
            //remove dividers
            $parent.data('menu').find('.divider').remove();
        }

        clearMenus();
        if (!isActive) {
            if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
                // if mobile we use a backdrop because click events don't delegate
                $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus)
            }

            var relatedTarget = { relatedTarget: this }
            $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget))

            activeElement = $(document.activeElement);

            if (e.isDefaultPrevented()) return

            $parent
                .toggleClass('open')
                .trigger('shown.bs.dropdown', relatedTarget)

            if (phone) {
                ox.disable(true);
                $('#io-ox-core').addClass('menu-blur');
                $parent.data('menu').show();
            }

            $this.trigger('focus')
        }

        return false;
    }

    Dropdown.prototype.keydown = function (e) {
        if (!/(32|38|40|27)/.test(e.keyCode)) return

        var $this = $(this)

        e.preventDefault()
        e.stopPropagation()

        if ($this.is('.disabled, :disabled')) return

        var $parent  = getParent($this)
        var isActive = $parent.hasClass('open')

        if (!isActive || (isActive && e.keyCode == 27)) {
            if (e.which == 27) $parent.find(toggle).trigger('focus')
            return $this.trigger('click')
        }

        var desc = ' li:not(.divider):visible a'
        var $items = $parent.find('[role="menu"]' + desc + ', [role="listbox"]' + desc)

        if (!$items.length) return

        var index = $items.index($items.filter(':focus'))

        if (e.keyCode == 38 && index > 0)                 index--                        // up
        if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
        if (!~index)                                      index = 0

        $items.eq(index).trigger('focus')
    }

    function clearMenus(e) {
        $(backdrop).remove()
        if (phone) {
            $('#io-ox-core').removeClass('menu-blur');
            $('.dropdown-menu').hide();
            ox.idle();
        }
        $(toggle).each(function () {
            var $parent = getParent($(this))
            var relatedTarget = { relatedTarget: this }
            if (!$parent.hasClass('open')) return
            $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget))
            if (e.isDefaultPrevented()) return
            if (activeElement) {
                activeElement.focus();
            }
            $parent.removeClass('open').trigger('hidden.bs.dropdown', relatedTarget)
        });
    }

    function getParent($this) {
        var selector = $this.attr('data-target')

        if (!selector) {
            selector = $this.attr('href')
            selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
        }

        var $parent = selector && $(selector)

        return $parent && $parent.length ? $parent : $this.parent()
    };

    // DROPDOWN PLUGIN DEFINITION
    // ==========================

    var old = $.fn.dropdown

    $.fn.dropdown = function (option) {
        return this.each(function () {
            var $this = $(this)
            var data  = $this.data('bs.dropdown')

            if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
            if (typeof option == 'string') data[option].call($this)
        })
    }

    $.fn.dropdown.Constructor = Dropdown;

    // DROPDOWN NO CONFLICT
    // ====================

    $.fn.dropdown.noConflict = function () {
        $.fn.dropdown = old
        return this
    }

    // APPLY TO STANDARD DROPDOWN ELEMENTS
    // ===================================

    $(document)
        .on('click.bs.dropdown.data-api', clearMenus)
        .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
        .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
        .on('keydown.bs.dropdown.data-api', toggle + ', [role="menu"], [role="listbox"]', Dropdown.prototype.keydown)

}(jQuery);
