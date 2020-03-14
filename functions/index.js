const functions = require('firebase-functions');
const fetch = require('node-fetch');
const api_key = functions.config().steam.key;
const u_id_re = new RegExp('^([0-9]).{16}$');
const g_id_re = new RegExp('^[0-9]{1,}$');

function testParameter(request, key, regex) {
    if (!Object.keys(request.query).includes(key)) {
        return false;
    }
    let value = request.query[key];
    if (!regex.test(value)) {
        return false;
    }
    return value;
}

async function makeRequest(request) {
    await fetch(request)
        .then(res => res.json())
        .catch(err => {
            console.error(err);
            return [];
        })
        .then(json => {
            return json;
        })
        .catch(err => {
            console.error(err);
            return [];
        });
}

exports.getOwnedGames = functions.region('europe-west2').https.onRequest(async (request, response) => {

    // Ensure the 'u_id' parameter has been given and valid.
    const u_id = testParameter(request, 'u_id', u_id_re);
    if (!u_id) {
        console.log('Invalid u_id parameter');
        response.status(400).send("Invalid 'u_id' parameter");
        return;
    }

    // Get details of the games the user owns.
    const steam_request = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${api_key}&steamid=${user_id}&include_appinfo=true`;

    // Make request.
    let steam_response = await makeRequest(steam_request);
    if (steam_response.length === 0) {
        const error = "Error when requesting IPlayerService/GetOwnedGames";
        console.error(error);
        response.status(500).send(error);
        return;
    }

    // Parse response.
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

    // Send response.
    response.setHeader('Content-Type', 'application/json');
    response.send(ownedGames);
    return;
});



exports.getMissingAchievements = functions.region('europe-west2').https.onRequest(async (request, response) => {

    // Ensure the 'u_id' and 'g_id' has been given and valid.
    const u_id = testParameter(request, 'u_id', u_id_re);
    const g_id = testParameter(request, 'g_id', g_id_re);
    if (!u_id || !g_id) {
        console.log("Invalid 'u_id' and/or 'g_id' parameter");
        response.status(400).send("Invalid 'u_id' and/or 'g_id' parameter");
        return;
    }



    // Get locked achievements.
    let steam_request = `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${g_id}&key=${api_key}&steamid=${u_id}`;

    // Make request.
    let steam_response = await makeRequest(steam_request);
    if (steam_response.length === 0) {
        const error = "Error when requesting ISteamUserStats/GetPlayerAchievements";
        console.error(error);
        response.status(500).send(error);
        return;
    }

    // Parse response.
    var user_locked;
    try {
        user_locked = steam_response.playerstats.achievements
            .filter(x => x.achieved === 0)
            .map(x => x.apiname);
    } catch (e) {
        console.info(err);
        response.status(503).send('Error getting request from GetGlobalAchievementPercentagesForApp');
        return;
    }


    // Get achievement unlock percentages.
    steam_request = `http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${g_id}`;

    // Make request.
    steam_response = await makeRequest(steam_request);
    if (steam_response.length === 0) {
        const error = "Error when requesting ISteamUserStats/GetGlobalAchievementPercentagesForApp";
        console.error(error);
        response.status(500).send(error);
        return;
    }

    // Parse response.
    let global_achievements;
    try {
        global_achievements = steam_response.achievementpercentages.achievements
            .filter(x => x.percent > 0);
    } catch (e) {
        console.info(err);
        response.status(503).send('Error when requesting ISteamUserStats/GetGlobalAchievementPercentagesForApp');
        return;
    }



    // Get achievement details.
    steam_request = `http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${api_key}&appid=${g_id}`;

    // Make request.
    steam_response = await makeRequest(steam_request);
    if (steam_response.length === 0) {
        const error = "Error when requesting ISteamUserStats/GetSchemaForGame";
        console.error(error);
        response.status(500).send(error);
        return;
    }

    // Parse response.
    let achievement_schemas;
    try {
        achievement_schemas = steam_response.game.availableGameStats.achievements
            .filter(x => user_locked.includes(x.name))
            .map(x => {
                return {
                    'name': x.name,
                    'display_name': x.displayName,
                    'desc': x.description,
                    'icon': x.icon
                };
            });
    } catch (e) {
        console.info(err);
        response.status(503).send('Error when requesting ISteamUserStats/GetSchemaForGame');
        return;
    }

    

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