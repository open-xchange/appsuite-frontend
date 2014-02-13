define("<%= module %>.<%= language %>", ["io.ox/core/gettext"], function (g) {
    return g("<%= module %>", {
      "nplurals": <%= nplurals %>,
      "plural": "<%= plural %>",
      "dictionary": {
      <% for (var msgid in dictionary) { %>
          <%= JSON.stringify(msgid) %>: <%= JSON.stringify(dictionary[msgid]) %>,
      <% } %>
      }
    });
});
