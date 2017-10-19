module.exports = function () {
    return actor({
        insertMailaddress: require('./commands/insertMailaddress'),
        login: require('./commands/login'),
        logout: require('./commands/logout')
    });
};
