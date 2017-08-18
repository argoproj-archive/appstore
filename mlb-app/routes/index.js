var PlayerHandler = require('./player'),
    TeamHandler = require('./team'),
    SearchHandler = require('./search'),
    ErrorHandler = require('./error').errorHandler;

module.exports = exports = function(app, cfg, db) {

    var playerHandler = new PlayerHandler(cfg, db),
        teamHandler = new TeamHandler(cfg, db),
        searchHandler = new SearchHandler(cfg, db);

    // Home page
    app.get('/', function(req, res) {
        res.redirect('/index.html');
    });
    app.get('/');
    app.get('/autoc-search', searchHandler.autocSearch);
    app.get('/search-list', searchHandler.searchList);
    app.get('/player-profile', playerHandler.playerProfile);
    app.get('/player-stats', playerHandler.playerStats);
    app.get('/player-list', playerHandler.playerList);
    app.get('/hof-list', playerHandler.hofList);
    app.get('/player-career-stats', playerHandler.playerCareerStats);

    app.get('/franchise-list', teamHandler.franchiseList);
    app.get('/team-list', teamHandler.teamList);
    app.get('/team-profile', teamHandler.teamProfile);
    app.get('/team-year-stats', teamHandler.teamYearlyStats);
    app.get('/team-total-stats', teamHandler.teamTotalStats);

    // Error handling middle-ware
    app.use(ErrorHandler);
};
