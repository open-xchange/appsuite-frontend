module.exports = function () {
    return actor({
        login: require('./commands/login'),
        logout: require('./commands/logout')
    });
};
