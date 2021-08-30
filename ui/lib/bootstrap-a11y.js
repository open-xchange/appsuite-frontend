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

    //
    // Copied from bootstrap accessibility plugin
    // https://github.com/Open-Xchange-Frontend/bootstrap-accessibility-plugin
    //

    // Modal Extension
    // ===============================
    $.fn.modal.Constructor.prototype._hide = $.fn.modal.Constructor.prototype.hide;
    $.fn.modal.Constructor.prototype._show = $.fn.modal.Constructor.prototype.show;

    $.fn.modal.Constructor.prototype.hide = function () {
        var modalOpener = this.$element.parent().find('[data-target="#' + this.$element.attr('id') + '"]');
        $.fn.modal.Constructor.prototype._hide.apply(this, arguments);
        modalOpener.focus();
    };

    $.fn.modal.Constructor.prototype.show = function () {
        $('.modal-dialog', this).attr({ role: 'document' });
        $.fn.modal.Constructor.prototype._show.apply(this, arguments);
    };

    // GENERAL UTILITY FUNCTIONS
    // ===============================
    var removeMultiValAttributes = function (el, attr, val) {
        var describedby = (el.attr(attr) || '').split(/\s+/),
            index = $.inArray(val, describedby);
        if (index !== -1) {
            describedby.splice(index, 1);
        }
        describedby = $.trim(describedby.join(' '));
        if (describedby) {
            el.attr(attr, describedby);
        } else {
            el.removeAttr(attr);
        }
    };

    // Popover Extension
    // ===============================
    var showPopover =     $.fn.popover.Constructor.prototype.setContent,
        hidePopover =     $.fn.popover.Constructor.prototype.hide;

    $.fn.popover.Constructor.prototype.setContent = function () {
        showPopover.apply(this, arguments);
        var $tip = this.tip(),
            tooltipID = $tip.attr('id') || _.uniqueId('ui-tooltip');
        $tip.attr({ role: 'tooltip', id: tooltipID });
        this.$element.attr('aria-describedby', tooltipID);
    };

    $.fn.popover.Constructor.prototype.hide = function () {
        hidePopover.apply(this, arguments);
        removeMultiValAttributes(this.$element, 'aria-describedby', this.tip().attr('id'));
        return this;
    };

    // TOOLTIP Extension
    // ===============================
    var showTooltip =       $.fn.tooltip.Constructor.prototype.show,
        hideTooltip =       $.fn.tooltip.Constructor.prototype.hide,
        tooltipHasContent = $.fn.tooltip.Constructor.prototype.hasContent;

    $.fn.tooltip.Constructor.prototype.show = function () {
        showTooltip.apply(this, arguments);
        var $tip = this.tip(),
            tooltipID = $tip.attr('id') || _.uniqueId('ui-tooltip');
        $tip.attr({ role: 'tooltip', id: tooltipID });
        if (this.$element) this.$element.attr({ 'aria-describedby': tooltipID });
    };

    $.fn.tooltip.Constructor.prototype.hide = function () {
        hideTooltip.apply(this, arguments);
        if (this.$element) removeMultiValAttributes(this.$element, 'aria-describedby', this.tip().attr('id'));
        return this;
    };

    $.fn.tooltip.Constructor.prototype.hasContent = function () {
        if (!this.$element) return false;
        return tooltipHasContent.apply(this, arguments);
    };

})(jQuery);
