/**
 * Copyright (c) 2012 James Newbery (@froots101)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in the
 * Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
(function(global) {

  var spyMatchers = "called calledOnce calledTwice calledThrice calledBefore calledAfter calledOn alwaysCalledOn calledWith alwaysCalledWith calledWithExactly alwaysCalledWithExactly calledWithMatch alwaysCalledWithMatch".split(" "),
    i = spyMatchers.length,
    spyMatcherHash = {},
    unusualMatchers = {
      "returned": "toHaveReturned",
      "alwaysReturned": "toHaveAlwaysReturned",
      "threw": "toHaveThrown",
      "alwaysThrew": "toHaveAlwaysThrown"
    },

  getMatcherFunction = function(sinonName, matcherName) {
    var original = jasmine.Matchers.prototype[matcherName];
    return function () {
      if (jasmine.isSpy(this.actual) && original) {
        return original.apply(this, arguments);
      }
      var sinonProperty = this.actual[sinonName];
      return (typeof sinonProperty === 'function') ? sinonProperty.apply(this.actual, arguments) : sinonProperty;
    };
  };

  while(i--) {
    var sinonName = spyMatchers[i],
      matcherName = "toHaveBeen" + sinonName.charAt(0).toUpperCase() + sinonName.slice(1);

    spyMatcherHash[matcherName] = getMatcherFunction(sinonName, matcherName);
  };

  for (var j in unusualMatchers) {
    spyMatcherHash[unusualMatchers[j]] = getMatcherFunction(j, unusualMatchers[j]);
  }

  global.sinonJasmine = {
    getMatchers: function() {
      return spyMatcherHash;
    }
  };

})(window);

beforeEach(function() {

  this.addMatchers(sinonJasmine.getMatchers());

});
