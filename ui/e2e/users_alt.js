const users = [{
    name: 'tthamm',
    password: 'secret'
}];

(function () {
    let i = 0;
    users.create = () => users[i++];
    users.removeAll = function () { i = 0; };
}());

module.exports = users;
