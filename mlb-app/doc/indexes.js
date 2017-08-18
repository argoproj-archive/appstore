// Use the following indexes to improve mongodb mlb
// database query performance
use mlb

// 15x improvement for playerProfile
db.fielding.ensureIndex({playerID:1})

// 5x improvement for playerList
db.players.ensureIndex({nameLast:1, nameFirst:1})

// 10x improvement for playerStats pitching
// 5x improvement for playerCareerStats pitching
db.pitching.ensureIndex({playerID:1})

// 10x improvement for playerStats batting
// 5x improvement for playerCareerStats batting
db.batting.ensureIndex({playerID:1})

// 2x improvement for teamYearlyStats and teamTotalStats
db.teams.ensureIndex({name:1,teamID:1})

// TODO : Is there a way to optimize teamList, franchiseList and
// hofList - these queries take 100 - 150ms
