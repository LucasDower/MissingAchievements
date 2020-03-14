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

function binarySearchAttribute(low, high, array, search, attribute) {
    while (low <= high) {
        let pivot = Math.floor((high + low) / 2);
        let entry = array[pivot][attribute];
        if (search < entry) {
            high = pivot - 1;
        }
        if (search > entry) {
            low = pivot + 1;
        }
        if (search === entry) {
            return pivot;
        }
    }
    return null;
}

async function makeRequest(request) {
    return await fetch(request)
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

    response.set('Access-Control-Allow-Origin', '*');

    // Ensure the 'u_id' parameter has been given and valid.
    const u_id = testParameter(request, 'u_id', u_id_re);
    if (!u_id) {
        console.log('Invalid u_id parameter');
        response.status(400).send("Invalid 'u_id' parameter");
        return;
    }

    // Get details of the games the user owns.
    const steam_request = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${api_key}&steamid=${u_id}&include_appinfo=true`;
    console.log(steam_request);
    // Make request.
    let steam_response = await makeRequest(steam_request);
    console.log(steam_response);
    if (steam_response === []) {
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

    let output = { games: ownedGames };



    // Send response.
    response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    response.setHeader('Content-Type', 'application/json');
    response.send(output);
    return;
});



exports.getMissingAchievements = functions.region('europe-west2').https.onRequest(async (request, response) => {

    // CORS
    response.set('Access-Control-Allow-Origin', '*');

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
    if (steam_response === []) {
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
        console.info(e);
        response.status(503).send('Error getting request from GetGlobalAchievementPercentagesForApp');
        return;
    }
    let locked = user_locked.length; // 576


    // Get achievement unlock percentages.
    steam_request = `http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${g_id}`;

    // Make request.
    steam_response = await makeRequest(steam_request);
    if (steam_response === []) {
        const error = "Error when requesting ISteamUserStats/GetGlobalAchievementPercentagesForApp";
        console.error(error);
        response.status(500).send(error);
        return;
    }

    // Parse response.
    let global_achievements;
    let total; // 700
    let unlockable;
    try {
        global_achievements = steam_response.achievementpercentages.achievements;
        total = global_achievements.length;
        global_achievements = global_achievements.filter(x => x.percent > 0);
        unlockable = global_achievements.length;
    } catch (e) {
        console.info(err);
        response.status(503).send('Error when requesting ISteamUserStats/GetGlobalAchievementPercentagesForApp');
        return;
    }
    let unobtainable = total - unlockable;
    let unlocked = total - locked;
    locked = unlockable - unlocked;



    // Get achievement details.
    steam_request = `http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${api_key}&appid=${g_id}`;

    // Make request.
    steam_response = await makeRequest(steam_request);
    if (steam_response === []) {
        const error = "Error when requesting ISteamUserStats/GetSchemaForGame";
        console.error(error);
        response.status(500).send(error);
        return;
    }

    // Parse response.
    let achievement_schemas;
    let game_name;
    try {
        game_name = steam_response.game.gameName;
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



    // Get profile details.
    steam_request = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${api_key}&steamids=${u_id}`;

    // Make request.
    steam_response = await makeRequest(steam_request);
    if (steam_response === []) {
        const error = "Error when requesting ISteamUser/GetPlayerSummaries";
        console.error(error);
        response.status(500).send(error);
        return;
    }

    // Parse response.
    let user_name;
    let user_avatar;
    try {
        let user = steam_response.response.players[0];
        user_name = user.personaname;
        user_avatar = user.avatarfull;
    } catch (e) {
        console.info(err);
        response.status(503).send('Error when requesting ISteamUserStats/GetSchemaForGame');
        return;
    }

    global_achievements = global_achievements.sort((a, b) => {
        if (a.name > b.name) {
            return 1;
        }
        if (a.name < b.name) {
            return -1;
        }
        return 0;
    });

    let output = [];
    for (let i = 0; i < achievement_schemas.length; i++) {
        let schema = achievement_schemas[i];

        let index = binarySearchAttribute(0, global_achievements.length - 1, global_achievements, schema.name, 'name');
        if (!index) {
            continue;
        }

        let percent = parseFloat(global_achievements[index].percent);
        global_achievements.splice(index, 1);

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

    output = { 'stats': { 'name': user_name, 'avatar': user_avatar, 'game': game_name, 'locked': locked, 'unlocked': unlocked, 'unobtainable': unobtainable }, 'achievements': output };



    response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    response.setHeader('Content-Type', 'application/json');
    response.send(output);
    return;
});