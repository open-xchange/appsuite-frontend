/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

/*
taken from jasmine wiki: https://github.com/pivotal/jasmine/wiki/Matchers

expect(function(){fn();}).toThrow(e);
expect(x).toBe(y);
expect(x).toBeDefined();
expect(x).toBeFalsy();
expect(x).toBeGreaterThan(y);
expect(x).toBeLessThan(y);
expect(x).toBeNull();
expect(x).toBeTruthy();
expect(x).toBeUndefined();
expect(x).toContain(y);
expect(x).toEqual(y);
expect(x).toMatch(pattern);

hint: Every matcher's criteria can be inverted by prepending '.not'
*/

//inspiration for other matchers can be found here:
//https://github.com/JamieMason/Jasmine-Matchers