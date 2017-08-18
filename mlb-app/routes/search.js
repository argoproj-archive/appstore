/**
 * Created by raynald on 6/13/14.
 */
// search.js
// ------------ BEGIN MODULE SCOPE VARIABLES --------------

// ------------- END MODULE SCOPE VARIABLES ---------------

function buildQuery(req, last_name_only) {
    var search_arr = [], key = [], query = {};

    search_arr = req.query['search'].split(' ');

    // Build the query
    key[0] = '^' + search_arr[0] + '*';

    if (search_arr.length == 1) {
        if (last_name_only) {
            query = {"nameLast": {$regex : key[0], $options: 'i'}}
        } else {
            query = {$or : [{"nameFirst": { $regex : key[0], $options: 'i'} },
                {"nameLast" : {$regex : key[0], $options:'i'}} ]};
        }
        // if more than one 'word', assume it's first and last name
    } else {
        key[1] = '^' + search_arr[1] + '*';
        query = {$and : [{"nameFirst": { $regex : key[0], $options: 'i'} },
            {"nameLast" : {$regex : key[1], $options:'i'}}
        ]};
    }

    // console.log('buildQuery: keys ->', key[0], key[1]);
    // console.log('buildQuery: db query ->', query);

    return query;
}

// SearchHandler constructor
function SearchHandler(cfg, db) {

    // Auto-complete search
    // Thus far only handles players: Only player name is returned.
    this.autocSearch = function(req, res, next) {
        "use strict";

        var query, players = db.collection('players');

        console.log('autocSearch: url ->', req.url);
        console.log('autocSearch: query ->', req.query);

        query = buildQuery(req , 0);

        players.find(query, {_id:0, "nameFirst":1, "nameLast":1}).limit(10).toArray(function(err, result) {
            if (err) {
                return next(err);
            }
            // console.log('autocSearch: result ->', result);

            res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
            return res.send(result);

        });
    };

    // Takes search query and returns full results
    // Thus far only handles players
    this.searchList = function(req, res, next) {
        "use strict";

        var query,  cursor, players = db.collection('players');

        console.log('searchList: url ->', req.url);
        console.log('searchList: query ->', req.query);

        query = buildQuery(req, 1);

        // console.log('searchList: db query ->', query);

        cursor = players.aggregate([
            {$match : query },
            {$sort : {"nameLast" : 1, "nameFirst" : 1}},
            {$project : {
                _id: 0,
                profile : {
                    PlayerId : "$playerID",
                    LastName : "$nameLast", // for sorting purposes
                    Name : {$concat : ["$nameFirst", " ", "$nameLast"]},
                    Ht : "$height", Wt : "$weight",
                    M : "$birthMonth", D : "$birthDay", Y : "$birthYear",
                    Birthplace : {$concat : ["$birthCity",", ","$birthState"," ","$birthCountry"]}
                }
            }}
        ], {cursor : {batchSize : 50}} // cursor object is required
        );

        cursor.get(function(err, result) {
            // console.log('searchList: result ->', result);
            res.setHeader('Cache-Control', 'public, max-age=' + cfg.maxAgeD);
            return res.send(result);
        });
    };

}
module.exports = SearchHandler;