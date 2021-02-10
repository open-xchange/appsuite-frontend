define([
    'io.ox/core/capabilities'
], function (capabilities) {
    'use strict';

    describe('Capabilities API: edge cases for has', () => {
        it('should return true for falsy arguments', () => {
            expect(capabilities.has()).to.be.true;
            expect(capabilities.has('')).to.be.true;
            expect(capabilities.has(null)).to.be.true;
            expect(capabilities.has(undefined)).to.be.true;
            expect(capabilities.has(false)).to.be.true;
        });

        it('should return true for empty array', () => {
            expect(capabilities.has([])).to.be.true;
        });
    });
});
