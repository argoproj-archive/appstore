/**
 * Created by raynald on 5/18/14.
 */

module.exports = {
    development : {
        mode : "development",
        mongoDbUri : "mongodb://192.168.0.252:27017/mlb",
        // HTTP response Cache-Control max-age for static files
        maxAgeS: 0, // in ms
        // HTTP response Cache-Control max-age for (AJAX) dynamic content
        maxAgeD : 0 // in seconds
    },
    production : {
        mode : "production",
        // Use this URI to use heroku provisioned mongodb database (runs 2.4.9)
        // mongoDbUri : process.env.MONGOLAB_URI,
        // Use this URI to use mongodb database directly provisioned by mongolab
        // (currently uses mongodb 2.6.2)
        mongoDbUri : process.env.MONGOLAB_URI || "mongodb://admin:jr6460*@ds051459.mongolab.com:51459/mlb-db",
        maxAgeS : 60 * 60 * 24 * 1000, // in ms
        maxAgeD : 60 * 60 * 24 // in seconds
    }
};