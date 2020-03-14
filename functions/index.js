const functions = require('firebase-functions');
const fetch = require('node-fetch');
const api_key = functions.config().steam.key;
const u_id_re = new RegExp('^([0-9]).{16}$');
const g_id_re = new RegExp('^[0-9]{1,}$');


exports.getOwnedGames = functions.https.onRequest(async (request, response) => {

    // Ensure the 'id' parameter has been given.
    if (!Object.keys(request.query).includes('id')) {
        console.log('Missing id parameter');
        response.status(400).send("Missing 'id' parameter");
        return;
    }

    const user_id = request.query.id;
    console.info(user_id);

    // Ensure the provided id is valid.
    if (!u_id_re.test(user_id)) {
        console.log('Invalid id parameter');
        response.status(400).send("Invalid 'id' parameter");
        return;
    }

    // Get details of the games the user owns.
    let steam_request = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${api_key}&steamid=${user_id}&include_appinfo=true`;

    let steam_response = null;
    await fetch(steam_request)
        .then(res => res.json())
        .catch(err => {
            console.info(err);
            response.status(503).send('Error getting request from api.steampowered.com.');
            return;
        })
        .then(json => {
            steam_response = json;
            return;
        })
        .catch(err => {
            console.info(err);
            response.status(503).send('Error getting request from api.steampowered.com.');
            return;
        });

    if (steam_response === null) {
        console.log("Null route entered");
        return;
    }

    const ownedGames = steam_response.response.games
        .filter(game => game.playtime_forever > 0)
        .map(game => { return { 'appid': game.appid, 'name': game.name }; })
        .sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });

    response.setHeader('Content-Type', 'application/json');
    response.send(ownedGames);
    return;
});



exports.getMissingAchievements = functions.https.onRequest(async (request, response) => {

    // Ensure the 'u_id' and 'g_id' has been given.
    const givenFields = Object.keys(request.query);
    if (!givenFields.includes('u_id') || !givenFields.includes('g_id')) {
        console.log("Missing 'u_id' and/or 'g_id' parameter");
        response.status(400).send("Missing 'u_id' and/or 'g_id' parameter");
        return;
    }

    const u_id = request.query.u_id;
    const g_id = request.query.g_id;

    // Ensure the provided u_id is valid.
    if (!u_id_re.test(u_id)) {
        console.log('Invalid id parameter');
        response.status(400).send("Invalid 'u_id' parameter");
        return;
    }

    // Ensure the provided g_id is valid.
    if (!g_id_re.test(g_id)) {
        console.log("'Invalid 'g_id' parameter");
        response.status(400).send("Invalid 'g_id' parameter");
        return;
    }

    // Get details of the games the user owns.
    let steam_request = `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${g_id}&key=${api_key}&steamid=${u_id}`;

    let steam_response = null;
    await fetch(steam_request)
        .then(res => res.json())
        .catch(err => {
            console.info(err);
            response.status(503).send('Error getting request from GetPlayerAchievements');
            return;
        })
        .then(json => {
            steam_response = json;
            return;
        })
        .catch(err => {
            console.info(err);
            response.status(503).send('Error getting request from GetPlayerAchievements');
            return;
        });

    const user_locked = (steam_response.playerstats.achievements || [])
        .filter(x => x.achieved === 0)
        .map(x => x.apiname);

    // ---------------------------------------

    steam_request = `http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${g_id}`;

    steam_response = null;
    await fetch(steam_request)
        .then(res => res.json())
        .catch(err => {
            console.info(err);
            response.status(503).send('Error getting request from GetGlobalAchievementPercentagesForApp');
            return;
        })
        .then(json => {
            steam_response = json;
            return;
        })
        .catch(err => {
            console.info(err);
            response.status(503).send('Error getting request from GetGlobalAchievementPercentagesForApp');
            return;
        });

    try {
    const global_achievements = steam_response.achievementpercentages.achievements
        .filter(x => x.percent > 0);
    } catch (e) {
        console.info(err);
            response.status(503).send('Error getting request from GetGlobalAchievementPercentagesForApp');
            return;
    }

    // ---------------------------------------

    steam_request = `http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${api_key}&appid=${g_id}`;

    steam_response = null;
    await fetch(steam_request)
        .then(res => res.json())
        .catch(err => {
            console.info(err);
            response.status(503).send('Error getting request from GetSchemaForGame');
            return;
        })
        .then(json => {
            steam_response = json;
            return;
        })
        .catch(err => {
            console.info(err);
            response.status(503).send('Error getting request from GetSchemaForGame');
            return;
        });

    const achievement_schemas = steam_response.game.availableGameStats.achievements
        .filter(x => user_locked.includes(x.name))
        .map(x => {
            return {
                'name': x.name,
                'display_name': x.displayName,
                'desc': x.description,
                'icon': x.icon
            };
        });


    let output = [];
    for (let i = 0; i < achievement_schemas.length; i++) {
        let schema = achievement_schemas[i];

        let percent = null;

        let percent_found = false;
        for (let j = 0; j < global_achievements.length; j++) {
            let achievement = global_achievements[j];
            if (achievement.name === schema.name) {
                percent = parseFloat(achievement.percent);
                percent_found = true;
                break;
            }
        }

        if (!percent_found) {
            // Missing achievement cannot be unlocked.
            continue;
        }

        output.push({
            display_name: schema.display_name,
            desc: schema.desc,
            percent: percent,
            icon: schema.icon
        });

    }

    
    output = output.sort((a, b) => {
        if (a.percent > b.percent) {
            return -1;
        }
        if (a.percent < b.percent) {
            return 1;
        }
        return 0;
    });
    

    response.setHeader('Content-Type', 'application/json');
    response.send(output);
    return;
});