define("<%= module %>.<%= language %>", ["io.ox/core/gettext"], function (g) {
    g("<%= module %>", {
      "nplurals": <%= nplurals %>,
      "plural": "<%= plural %>",
      "dictionary": {
      <% for (var msgid in dictionary) { %>
          "<%= msgid %>": "<%= dictionary[msgid] %>",
      <% } %>
      }
    });
});
