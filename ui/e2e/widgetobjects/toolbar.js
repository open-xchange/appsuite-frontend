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

const { I } = inject();

async function Helper(selector) {
    const list = [];
    const dropdowns = [];
    const count = await I.executeScript((selector) => $(selector + ' > li > a').length, selector);

    for (let i = 1; i <= count; i++) {
        const action = locate(selector + ' > li').at(i).find('a').first();
        const [label, text, toggle] = await Promise.all([I.grabAttributeFrom(action, 'aria-label'), I.grabTextFrom(action), I.grabAttributeFrom(action, 'data-toggle')]);
        list.push(action.as(label || text || `Action ${i}`));
        dropdowns[i - 1] = toggle;
    }
    return {
        list,
        dropdowns,
        checkTabindexes: (cur) => list.forEach((el, i) => i + 1 === cur ? I.seeTabbable(el) : I.dontSeeTabbable(el)),
        isFocused: (pos) => I.haveFocus(list[pos - 1]),
        isNotFocused: (pos) => I.dontHaveFocus(list[pos - 1]),
        isDropdown: (pos) => !!dropdowns[pos - 1]
    };
}

async function Dropdown(selector) {
    const list = [];
    const count = await I.executeScript((selector) => $(selector + ' li > a').length, selector);
    for (let i = 1; i <= count; i++) {
        const action = locate(selector + ' li:not(.divider):not(.dropdown-header)').at(i).find('a').first();
        const text = await I.grabTextFrom(action);
        list.push(action.as(text || `Action ${i}`));
    }
    return {
        list,
        isFocused: (pos) => I.haveFocus(list[pos - 1]),
        isNotFocused: (pos) => I.dontHaveFocus(list[pos - 1])
    };
}

module.exports = {
    Helper,
    Dropdown,

    testFocus: async (selector) => {
        const helper = await Helper(selector);
        helper.isFocused(1);
        helper.checkTabindexes(1);
    },

    testWrapAround: async function (selector) {
        I.wait(0.5);
        const helper = await Helper(selector);
        const { list } = helper;

        list.forEach(function (obj, i) {
            const pos = i + 1;
            helper.isFocused(pos);
            helper.checkTabindexes(pos);
            I.pressKey('ArrowRight');
            if (pos === this.length) helper.checkTabindexes(1);
        });

        list.forEach(function (action, i) {
            const pos = list.length - i;
            if (i === 0) I.pressKey('ArrowLeft');
            helper.isFocused(pos);
            helper.checkTabindexes(pos);
            if (pos === 1) return;
            I.pressKey('ArrowLeft');
        });
    },

    testTabindex: async function (selector) {
        const helper = await Helper(selector);
        const pos = Math.round(helper.list.length / 2);
        //helper.jumpTo(pos);
        for (let i = 1; i < pos; i++) I.pressKey('ArrowRight');
        // tab away and tab back
        helper.isFocused(pos);
        I.pressKey('Tab');
        helper.isNotFocused(pos);
        I.pressKey(['Shift', 'Tab']);
        helper.isFocused(pos);
    },

    testDropdowns: async function (selector) {
        const helper = await Helper(selector);
        const { list } = helper;

        for (let i in list) {
            i = parseInt(i, 10);
            const pos = i + 1;
            const isDropdown = helper.isDropdown(pos);

            if (isDropdown) {
                const menu = locate('.smart-dropdown-container .dropdown-menu').as('Dropdown menu');
                // open / close
                ['Enter', 'ArrowDown', 'ArrowUp', 'Space'].forEach(function (key) {
                    I.pressKey(key);
                    I.waitForElement(menu);
                    I.pressKey('Escape');
                    I.waitForDetached(menu);
                    helper.isFocused(pos);
                });

                // open
                I.pressKey('Enter');
                I.waitForElement(menu);
                const dropdown = await Dropdown('.smart-dropdown-container .dropdown-menu');
                const menuitems = dropdown.list;

                // wrap around
                menuitems.forEach(function (action, i) {
                    const pos = i + 1;
                    dropdown.isFocused(pos);
                    I.pressKey('ArrowDown');
                });
                menuitems.forEach(function (action, i) {
                    const pos = menuitems.length - i;
                    if (i === 0) I.pressKey('ArrowUp');
                    dropdown.isFocused(pos);
                    if (pos === 1) return;
                    I.pressKey('ArrowUp');
                });

                // reset
                I.pressKey('Escape');
                I.waitForDetached(menu);
            }

            I.pressKey('ArrowRight');
        }
    }
};
