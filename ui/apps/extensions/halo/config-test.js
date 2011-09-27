define("extensions/halo/config-test", function () {
    console.log("load test");
    return function (jasmine) {
        var describe = jasmine.describe;
        var it = jasmine.it;
        var expect = jasmine.expect;
       
        describe("something", function () {
            expect(1 + 1).toEqual(2);
        });
    };
});