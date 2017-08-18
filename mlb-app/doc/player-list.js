// Improved performance of the following aggregate by:
// 1. db.players.ensureIndex({nameLast:1, nameFirst:1})
// 2. move $sort to head of pipeline to take advantage of index
// 3. yielded 5x improvement: 400ms -> 75ms
// 4. run as follows: mongo < player-list.js
use mlb

db.players.aggregate([
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
    }},
    {$skip : 0 },
    {$limit : 50},
    ],
    {explain : true}
)