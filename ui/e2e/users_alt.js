const users = [{
    name: 'dpondruff',
    password: 'secret',
    primaryEmail: 'dpondruff@local'
}, {
    name: 'mwagner',
    password: 'secret',
    primaryEmail: 'mwagner@local'
}];

(function () {
    let i = 0;
    users.create = () => users[i++];
    users.removeAll = function () { i = 0; };
}());

module.exports = users;
