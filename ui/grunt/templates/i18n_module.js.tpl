<%
function extractSingularOnly(arr) {
    if (arr.length < 2) {
        return arr[0];
    }
    return arr;
}
%>
define("<%= module %>.<%= language %>", ["io.ox/core/gettext"], function (g) {
    return g("<%= module %>", {
      "nplurals": <%= nplurals %>,
      "plural": "<%= plural %>",
      "dictionary": {
      <% for (var msgid in dictionary) { %>
          <%= JSON.stringify(msgid) %>: <%= JSON.stringify(extractSingularOnly(dictionary[msgid])) %>,
      <% } %>
      }
    });
});
