// ------------ BEGIN MODULE SCOPE VARIABLES --------------
var
    JSONStream = require('JSONStream');

// ------------- END MODULE SCOPE VARIABLES ---------------

function TeamHandler (cfg, db) {
    "use strict";

    // Access teams collection to get list of teams for each franchise
    // Add franchise name to final output
    function getFranchiseTeams(res, map, next) {
        var teams, cursor, arr = [];

        // db.teams.aggregate({$group : {_id : {Franchise :"$franchID"} , Year_Founded : {$min : "$yearID"}, Teams : {$addToSet : "$teamID"}}}, {$sort : {"_id":1}})^
        teams = db.collection('teams');

        cursor = teams.aggregate([
            {$group : {
                _id : {Franchise : "$franchID"},
                Year_Founded : {$min : "$yearID"},
                Teams : {$addToSet : "$teamID"}
            }},
            {$project : {
                _id : 0,
                Franchise : "$_id.Franchise",
                Year_Founded: 1,
                Teams : 1
            }},
            {$sort : {Franchise:1}}
        ], {cursor : {batchSize : 50}} // cursor object is required
        );

        cursor.each(function(err, result) {
            if (err) {
                return next(err);
            }

            if (result == null) { // cursor exhausted
                // console.log('franchise teams ->', arr);
                res.set('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);

                return res.send(arr);

            }

            // massage output
            var franchise = map[result.Franchise];
            if (franchise) {
                result.Name = franchise.id;
                result.Active = franchise.active;
                arr.push(result);
            }
        });
    }

    // Since we want to get a list of teams that belongs/belonged to each
    // franchise we have to do extra work and access the teams collection
    // Here is the basic alg:
    // 1. run find on franchises collection
    // 2. for each franchise set up map of franchID to franchName
    // 3. run $group aggregate on teams collection (and massage output)
    // 4. for each aggregate document, add franchName using map obtained in 2.
    // 5. return results

    this.franchiseList = function(req, res, next) {
        "use strict";

        console.log('franchiseList: url ->', req.url);
        console.log('franchiseList: query ->', req.query);

        var franchises, cursor, franchise_name_map = {}, obj, id;

        franchises = db.collection('franchises');

        res.set('Content-Type', 'application/json');

        // It we were to stream directly, we could do the following
        // cursor = franchises.find({}, {_id:0}).sort([["franchName", 1]]);
        //cursor.stream().pipe(JSONStream.stringify()).pipe(res);

         cursor = franchises.find({}, {_id:0}).sort([["franchName", 1]]);

         cursor.each(function(err, result) {
             if (err) {
                return next(err);
             }

             if (result == null) { // cursor exhausted
                 // console.log('franchise Name Map ->',
                 //    JSON.stringify(franchise_name_map));
                 getFranchiseTeams(res, franchise_name_map, next);

             } else {
                 // build map containing franchName and active flag
                 // well add them to the teams output
                 id = result.franchID;
                 obj = { id : result.franchName, active : result.active };

                 franchise_name_map[result.franchID] = obj;
             }
          });
    };

    // db.teams.aggregate({$group : {_id :"$teamID", Name : {$min : "$name"}, Initial_Year : {$min :"$yearID"}, League : {$min : "$lgID"}, Division : {$min : "$divID"}, Park : {$min : "$park"}}}, {$sort : {Name:1, Initial_Year:-1}}, {$limit:10})

    this.teamList = function(req, res, next) {
        "use strict";

        console.log('teamList: url ->', req.url);
        console.log('teamList: query ->', req.query);

        var teams, cursor, arr = [], count;
        var league_map = {"AL" : "American", "NL" : "National"};
        var div_map = {"E" : "East", "W" : "West", "C" : "Central"};

        teams = db.collection('teams');

        cursor = teams.aggregate([
            {$match : {
                name : {$ne: null}
            }},
            {$group : {
                _id :  "$name",
                teamID: {$addToSet : "$teamID"},
                // initialYear : {$min : "$yearID"}, // can't easily determine this
                league : {$min : "$lgID"},
                division : {$min : "$divID"},
                park : {$min : "$park"}
            }},
            {$unwind : "$teamID"},
            {$sort : {_id:1, teamID:1}}
        ], {cursor : {batchSize : 50}} // appears that batchSize must be specified!
        );

        // No stream method for cursor returned by aggregate
        // console.log(cursor);
        // cursor.stream().pipe(JSONStream.stringify()).pipe(res);

        count = 1;
        cursor.each(function(err, result) {
            if (err) {
                return next(err);
            }

            if (result == null) { // cursor exhausted
                // console.log('teams ->', arr);
                res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
                res.set('Content-Type', 'application/json');
                return res.send(arr);

            }
            // massage output
            if (league_map[result.league]) {
                result.league = league_map[result.league];
            }
            if (div_map[result.division]) {
                result.division = div_map[result.division];
            }
            result.num = count;
            count++;

            arr.push(result);
        });

    };

    // Append franchise name to team profile
    function teamProfileAppend(res, team, next) {
        var franchises = db.collection('franchises');

        res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
        res.set('Content-Type', 'application/json');

        franchises.findOne({franchID: team.franchID}, {_id:0, franchName:1},
            function(err, franchise) {
                if (err) {
                    return next(err);
                }

                // TODO: check if franchise is empty object
                if (franchise == null) {
                    return res.send({data : null});
                }

                team.franchise = franchise['franchName'];

                // console.log('teamProfileAppend: team ->', team);

                return res.send(team);
            });
    }

    this.teamProfile = function(req, res, next) {
        "use strict";

        console.log('teamProfile: url ->', req.url);
        console.log('teamProfile: req.query ->', req.query);

        var query, cursor, name, id,
            teams = db.collection('teams');

        var league_map = {"AL" : "American", "NL" : "National"};
        var div_map = {"E" : "East", "W" : "West", "C" : "Central"};

        name = req.query['name'];
        id = req.query['id'];

        if (name) {
            query = { "name" : name, "teamID" : id};
        } else {
            // TODO:
            // If accessed from franchises list, we currently only have the
            // teamID available. Since multiple teams can have the same
            // teamID, if we query by teamID alone we'll only get one (random)
            // team
            query = {"teamID" : id};
        }
        console.log('teamProfile: query ->', query);


        cursor = teams.aggregate([
            {$match :
                query
            },
            {$sort : {yearID : 1}},
            {$group : {
               _id : 0,
               teamID : {$first : "$teamID"},
               name : {$first : "$name"},
               initialYear : {$first : "$yearID"},
               league : {$first : "$lgID"},
               division : {$first : "$divID"},
               franchID : {$first : "$franchID"},
               parks : {$addToSet : "$park"}
            }},
            {$project : {
                _id : 0,
                teamID : 1,
                name: 1,
                initialYear : 1,
                league : 1,
                division : 1,
                parks : 1,
                franchID : 1
            }}
        ], {cursor : {batchSize : 1}} // appears that batchSize must be specified!
        );

        cursor.getOne(function(err, team) {
            if (err) {
                return next(err);
            }

            console.log('teamProfile: team ->', team);

            if (team == null) { // findOne failed
                return res.send({data : null});
            }

            // massage output
            if (league_map[team.league]) {
                team.league = league_map[team.league];
            }
            if (div_map[team.division]) {
                team.division = div_map[team.division];
            }
            return teamProfileAppend(res, team, next);

        });
/*
        teams.findOne(query, {_id:0}, function(err, team) {
            if (err) {
                return next(err);
            }
            console.log('teamProfile: team ->', team);

            if (team) {
                return teamProfileAppend(res, team);
            }
            res.send({data: null});
        });
*/
    };

    this.teamYearlyStats = function(req, res, next) {
        "use strict";

        console.log('teamYearlyStats: query ->', req.query);

        var teams, name, id, query, cursor;

        teams = db.collection('teams');

        name= req.query['name'];
        id = req.query['id'];

        query = { "name" : name, "teamID" : id};
        console.log('teamProfile: query ->', query);

        res.set('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);

        cursor = teams.find(query, {_id:0}).sort([["yearID", 1]]);

        // This works!
        cursor.stream().pipe(JSONStream.stringify()).pipe(res);

        /*
        cursor.toArray(function(err, result) {
            if (err) { return next(err);}

            if (!result) {return res.send({data : null})};

            return res.send(result);
        });
        */
    };

    this.teamTotalStats = function(req, res, next) {
        "use strict";
        var teams, query, name, id, cursor;

        console.log('teamTotalStats: query ->', req.query);

        name= req.query['name'];
        id = req.query['id'];

        query = { "name" : name, "teamID" : id};
        console.log('teamProfile: query ->', query);

        teams = db.collection('teams');
        cursor = teams.aggregate([
            {$match :
                query
            },
            {$group : {
                _id :  0,
                years : {$addToSet  : "$yearID"},
                G : {$sum  : "$G"},
                W : {$sum  : "$W"},
                L : {$sum  : "$L"},
                // calculate Pct
                // calculate WsWin, LgWin, DivWin, WcWin, TotWin
                ws : {$push  : "$WSWin"},
                lg : {$push  : "$LgWin"},
                div : {$push  : "$DivWin"},
                wc : {$push  : "$WCWin"},
                AB : {$sum  : "$AB"},
                HR : {$sum  : "$HR"},
                "2B" : {$sum  : "$2B"},
                "3B" : {$sum  : "$3B"},
                H : {$sum  : "$H"},
                R : {$sum  : "$R"},
                // calculate BA and SLG
                HRA : {$sum  : "$HRA"},
                HA : {$sum  : "$HA"},
                ER : {$sum  : "$ER"},
                IPouts : {$sum  : "$IPouts"}
                // calculate IP
                // calculate ERA
            }},
            {$project : {
                _id : 0,
                Yrs : {$size : "$years"},
                Pct : {$divide : ["$W", "$G"]},
                BA : {$divide : ["$H", "$AB"]},
                // ERA = 9 × Earned Runs Allowed / Innings Pitched
                ERA : {$divide : [
                    {$multiply : [9, "$ER"]}, {$divide : ["$IPouts",3]}
                ]},
                IP : {$divide : ["$IPouts", 3]},
                G : 1, W : 1, L : 1, ws : 1, lg : 1, div : 1, wc :1, AB : 1,
                HR : 1, H : 1, '2B' : 1, '3B' : 1, R : 1,
                HRA : 1, HA : 1, ER : 1
            }}
        ], {cursor : {batchSize : 1}} // appears that cursor and batchSize must be specified!
        );

        res.set('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);

        // can I use cursor.stream() ?
        var stat, cnt, total_cnt, singles;

        cursor.get(function(err, stats) {
            if (err) return next(err);
            // no need to check for null stats, if null client will
            // get empty payload !


            // stats is an array of one - need to massage it
            // before sending to client
            // calculate WsWin, LgWin, DivWin, WcWin, TotWin
            stat = stats[0];

            cnt = 0; total_cnt = 0;
            stat.ws.forEach(function(entry) {
                if (entry == 'Y') cnt++;
            });
            stats[0].WsWin = cnt;
            total_cnt += cnt;

            cnt = 0;
            stat.lg.forEach(function(entry) {
                if (entry == 'Y') cnt++;
            });
            stats[0].LgWin = cnt;
            total_cnt += cnt;

            cnt = 0;
            stat.div.forEach(function(entry) {
                if (entry == 'Y') cnt++;
            });
            stats[0].DivWin = cnt;
            total_cnt += cnt;

            cnt = 0;
            stat.wc.forEach(function(entry) {
                if (entry == 'Y') cnt++;
            });
            stats[0].WcWin = cnt;
            total_cnt += cnt;

            stats[0].TotWin = total_cnt;

            // fix Pct wins, BA, IP, ERA
            stat.Pct= stat.Pct.toFixed(3).slice(1);
            stat.BA = stat.BA.toFixed(3).slice(1);
            stat.IP = stat.IP.toFixed(1);
            stat.ERA = stat.ERA.toFixed(2);

            // Calculate SLG
            // Formula is : SLG = (1B + 2 × 2B + 3 × 3B + 4 × HR) / AB
            singles = stat.H - stat.HR - stat['3B'] - stat['2B'];

            stat.SLG =
                (singles +  2 * stat['2B'] +
                    3 * stat['3B'] + 4 * stat.HR)/stat.AB;

            stat.SLG = stat.SLG.toFixed(3).slice(1);

            delete stat.ws; delete stat.lg; delete stat.div;
            delete stat.wc;

            // console.log('teamTotalStats: stats ->', stats);

            return res.send(stats);
        });
    };

} // TeamHandler

module.exports = TeamHandler;