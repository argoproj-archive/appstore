// ------------ BEGIN MODULE SCOPE VARIABLES --------------
var
async = require('async'),
    fresh = require('fresh'); // not currently used
// ------------- END MODULE SCOPE VARIABLES ---------------

function PlayerHandler(cfg, db) {
    "use strict";

    // Access fielding table to add team and position to player profile
    // db.fielding.aggregate({$match : {"playerID": "ruthba01"}}, {$group : {_id:"$playerID", "Team": {$addToSet : "$teamID"}, "POS" : {$addToSet : "$POS"}}})

    function playerProfileAppend(res, player, next) {
        var search_arr = [],
            query,
            fielding = db.collection('fielding');

        // Find all positions and all teams
        fielding.aggregate({ $match: { "playerID": player.playerID } }, {
            $group: {
                _id: "$playerID",
                "Team": { $addToSet: "$teamID" },
                "POS": { $addToSet: "$POS" }
            }
        }, function(err, result) {
            if (err) {
                return next(err);
            }
            if (result.length > 0) {

                player.teamID = result[0].Team.join(' ');
                player.POS = result[0].POS.join(' ');

                // Find last position played, we use that to display
                // batting or pitching stats
                fielding.find({ "playerID": player.playerID }, { fields: { _id: 0, yearID: 1, POS: 1 } }).sort([
                        ['yearID', -1]
                    ])
                    .limit(1)
                    .toArray(function(err, result) {
                        if (err) {
                            return next(err);
                        }
                        console.log('playerProfileAppend: result ->', result);
                        player.LAST_POS = result[0].POS;
                        res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
                        return res.send(player);
                    });
            } else {
                res.send({ data: null });
            }
        });
    }

    this.playerProfile = function(req, res, next) {
        "use strict";

        console.log('playerProfile: url ->', req.url);
        console.log('playerProfile: query ->', req.query);

        var search_arr = [],
            query,
            //players = db.collection('master');
            players = db.collection('players');

        search_arr = req.query['search'].split(' ');
        query = { "nameFirst": search_arr[0], "nameLast": search_arr[1] };

        players.findOne(query, { _id: 0 }, function(err, player) {
            if (err) {
                return next(err);
            }

            // console.log('playerProfile: player ->', player);

            if (player != null) {
                return playerProfileAppend(res, player);
            }
            return res.send({ data: null });
        });
    };

    this.playerStats = function(req, res, next) {
        "use strict";

        console.log('playerStats: url ->', req.url);
        console.log('playerStats: query ->', req.query);

        var player, position, coll, query;

        player = req.query['player'];
        position = req.query['position'];

        coll = (position == 'P') ? db.collection('pitching') :
            db.collection('batting');

        query = { "playerID": player };
        coll.find(query, { _id: 0 }).sort([
            ["yearID", 1]
        ]).toArray(function(err, result) {
            if (err) {
                return next(err);
            }
            // console.log('playerStats ->', result);
            res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
            return res.send(result);

        });
    };

    this.playerCareerStats = function(req, res, next) {
        "use strict";
        var player, position, coll, query, cursor;

        console.log('playerCareerStats: url ->', req.url);
        console.log('playerCareerStats: query ->', req.query);

        player = req.query['player'];
        position = req.query['position'];

        coll = (position == 'P') ? db.collection('pitching') :
            db.collection('batting');

        query = { playerID: player };

        if (position == 'P') {
            coll = db.collection('pitching');
            cursor = coll.aggregate([{
                        $match: query
                    },
                    {
                        $group: {
                            _id: 0,
                            years: { $addToSet: "$yearID" },
                            G: { $sum: "$G" },
                            IPouts: { $sum: "$IPouts" },
                            W: { $sum: "$W" },
                            L: { $sum: "$L" },
                            H: { $sum: "$H" },
                            R: { $sum: "$R" },
                            ER: { $sum: "$ER" },
                            CG: { $sum: "$CG" },
                            GS: { $sum: "$GS" },
                            SV: { $sum: "$SV" },
                            SHO: { $sum: "$SHO" },
                            K: { $sum: "$SO" },
                            BB: { $sum: "$BB" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            Yrs: { $size: "$years" },
                            // ERA = 9 × Earned Runs Allowed / Innings Pitched
                            ERA: {
                                $divide: [
                                    { $multiply: [9, "$ER"] }, { $divide: ["$IPouts", 3] }
                                ]
                            },
                            IP: { $divide: ["$IPouts", 3] },
                            G: 1,
                            W: 1,
                            L: 1,
                            H: 1,
                            R: 1,
                            ER: 1,
                            CG: 1,
                            GS: 1,
                            SV: 1,
                            SHO: 1,
                            K: 1,
                            BB: 1
                        }
                    }
                ], { cursor: { batchSize: 1 } } // appears that cursor and batchSize must be specified!
            );

        } else { // position player
            coll = db.collection('batting');
            cursor = coll.aggregate([{
                        $match: query
                    },
                    {
                        $group: {
                            _id: 0,
                            years: { $addToSet: "$yearID" },
                            G: { $sum: "$G" },
                            AB: { $sum: "$AB" },
                            R: { $sum: "$R" },
                            H: { $sum: "$H" },
                            BB: { $sum: "$BB" },
                            RBI: { $sum: "$RBI" },
                            HR: { $sum: "$HR" },
                            "2B": { $sum: "$2B" },
                            "3B": { $sum: "$3B" },
                            SO: { $sum: "$SO" },
                            SB: { $sum: "$SB" },
                            HBP: { $sum: "$HBP" },
                            SF: { $sum: "$HBP" }
                        }
                    },
                    {
                        $project: {
                            Yrs: { $size: "$years" },
                            BA: { $divide: ["$H", "$AB"] },
                            OBP: {
                                $divide: [ // on base percentage calculation
                                    { $add: ["$H", "$BB", "$HBP"] },
                                    { $add: ["$AB", "$BB", "$HBP", "$SF"] }
                                ]
                            },
                            // Calculate slugging percentage on client
                            // since the calculation is a little complicated to do
                            // in projection. Could use variable though, $let
                            G: 1,
                            AB: 1,
                            R: 1,
                            H: 1,
                            BB: 1,
                            RBI: 1,
                            HR: 1,
                            SB: 1,
                            "2B": 1,
                            "3B": 1,
                            SO: 1
                        }
                    }
                ], { cursor: { batchSize: 1 } } // appears that cursor and batchSize must be specified!
            );
        }

        // console.log('playerCareerStats: cursor ->', cursor);

        // can I use cursor.stream() ?

        cursor.get(function(err, stats) {
            if (err) return next(err);
            // no need to check for null stats, if null client will
            // get empty payload !
            // console.log('playerCareerStats: stats ->', stats);

            res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
            return res.send(stats); // no need to check for null stats
        });
    };

    this.playerList = function(req, res, next) {
        "use strict";

        var players, page, skip, limit, cache;

        console.log('playerList: url ->', req.url);
        console.log('playerList: query ->', req.query);

        // console.log('playerList: if-none-match ->', req.get('If-None-Match'));
        // console.log('playerList: etag ->', res.get('etag'));

        // Both req.fresh and fresh() always return false even if Etag
        // on client and server side is the same value
        /*
        console.log('playerList: fresh stale ->', req.fresh, req.stale);

        cache = fresh(req, res);
        console.log('playerList: fresh ->', cache);

        if (cache) {
            return res.status(304);
        }
        */

        players = db.collection('players');

        page = +req.query.page // change to number!
        limit = +req.query.limit;
        skip = (page - 1) * limit;

        // Here we use $project aggregation operator to create profile
        // sub-document, rename fields and use $concat expression operator
        // put $sort at head of pipeline so {nameLast, nameFirst} index
        // can be used
        players.aggregate({ $sort: { "nameLast": 1, "nameFirst": 1 } }, {
            $project: {
                _id: 0,
                profile: {
                    PlayerId: "$playerID",
                    LastName: "$nameLast", // for sorting purposes
                    Name: { $concat: ["$nameFirst", " ", "$nameLast"] },
                    Ht: "$height",
                    Wt: "$weight",
                    M: "$birthMonth",
                    D: "$birthDay",
                    Y: "$birthYear",
                    Birthplace: { $concat: ["$birthCity", ", ", "$birthState", " ", "$birthCountry"] }
                }
            }
        }, { $skip: skip }, { $limit: limit }, function(err, result) {
            if (err) {
                return next(err);
            }
            // console.log('playerList ->', result);
            res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
            return res.send(result);

        })
    };

    this.hofList = function(req, res, next) {
        "use strict";

        var cursor, hof, players, page, limit, skip, arr, num;

        console.log('hofList: url ->', req.url);
        console.log('hofList: query ->', req.query);

        page = +req.query.page; // change to number!
        limit = +req.query.limit;
        skip = (page - 1) * limit;

        hof = db.collection('hof');
        players = db.collection('players');

        cursor = hof.aggregate([
                { $match: { inducted: 'Y' } },
                { $sort: { "playerID": 1 } },
                {
                    $project: {
                        _id: 0,
                        yearInducted: "$yearid",
                        votesNeeded: "$needed",
                        votingMethod: "$votedBy",
                        playerID: 1,
                        inducted: 1,
                        ballots: 1,
                        votes: 1,
                        category: 1
                    }
                },

                { $skip: skip },
                { $limit: limit }
            ], { cursor: { batchSize: 50 } } // cursor object is required
        );

        num = (page - 1) * limit;
        arr = [];

        // The following has a race condition -
        // cursor may get exhausted before all players.findOne() callbacks have
        // finished executing

        /*
        cursor.each(function(err, result) {
            if (err) return next(err);
            if (!result) {
                // cursor exhausted
                // console.log('hofList ->', arr);
                res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
                return res.send(arr);
            }
            num++;
            players.findOne(
                {playerID: result.playerID}, {_id:0, nameFirst : 1, nameLast : 1},
                function(err, player) {
                    if (err) return next(err);

                    result.num = num;
                    result.name = player['nameFirst'] + ' ' + player['nameLast'];
                    arr.push(result);
                }
            )
        });
        */

        function addPlayerName(result, arr, num, callback) {
            players.findOne({ playerID: result.playerID }, { _id: 0, nameFirst: 1, nameLast: 1 },
                function(err, player) {
                    if (err) return callback(err);

                    if (player) {
                        result.num = num++;
                        result.name = player['nameFirst'] + ' ' + player['nameLast'];
                        arr.push(result);
                    }
                    callback();
                }
            );
        }

        // use async module to eliminate race condition noted above in
        // cursor.each()
        cursor.get(function(err, results) {
            async.eachSeries(results, function(result, callback) {
                num++;
                addPlayerName(result, arr, num, callback);
            }, function(err) {
                if (err) return next(err);
                // console.log('hofList ->', arr);
                res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
                res.send(arr);
            })
        });

    };

} // PlayerHandler

module.exports = PlayerHandler;