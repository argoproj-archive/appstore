/**
 * Created by raynald on 6/10/14.
 */
var
    async = require('async');

module.exports = exports = function(cfg, db) {
    // Build indexes
    async.parallel([
        function(callback) {
            db.collection('fielding').ensureIndex({playerID: 1},
                function(err, name) {
                    callback(err, name);
            })
        },
        function(callback) {
            db.collection('players').ensureIndex({nameLast: 1, nameFirst:1},
                function(err, name) {
                    callback(err, name);
                }
            )
        },

        function(callback) {
            db.collection('players').ensureIndex({nameFirst: 1, nameLast:1},
                function(err, name) {
                    callback(err, name);
                }
            )
        },

        function(callback) {
            db.collection('players').ensureIndex({playerID:1},
                function(err, name) {
                    callback(err, name);
                }
            )
        },

        function(callback) {
            db.collection('pitching').ensureIndex({playerID: 1},
                function(err, name) {
                    callback(err, name);
                })
        },
        function(callback) {
            db.collection('batting').ensureIndex({playerID: 1},
                function(err, name) {
                    callback(err, name);
                })
        },
        function(callback) {
            db.collection('teams').ensureIndex({name:1, teamID:1},
                function(err, name) {
                    callback(err, name);
                })
        }

    ],
        function(err, results) {
            if (err) {
                console.log('mongodb: Failed to created index', err);
            } else {
                console.log('mongodb: Created all indexes ok');
            }
        }

    )
};