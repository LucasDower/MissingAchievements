const functions = require('firebase-functions');
const fetch = require('node-fetch');
const api_key = functions.config().steam.key;
const u_id_re = new RegExp('^([0-9]).{16}$');
const g_id_re = new RegExp('^[0-9]{1,}$');

exports.getOwnedGames = functions.https.onRequest(async (request, response) => {

    // CORS
    response.set('Access-Control-Allow-Origin', '*');
    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('');
        return;
    }

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

    // CORS
    response.set('Access-Control-Allow-Origin', '*');
    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('');
        return;
    }

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

    // ["1_0_LIFE_STORY","1_1_JUST_GETTING_STARTED","1_2_BALAHOS_MOST_WANTED","1_3_THE_ONE_PERCENT","1_4_SPOILSPORT",...]
    const user_locked = steam_request.playerstats.achievements
        .filter(x => x.achieved === 0)
        .map(x => x.apiname);



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

    // [{"name":"1_26_YOUR_JOURNEY_BEGINS","percent":95.0999984741210938},{"name":"22_16_IM_SORRY_DAVE","percent":90.5999984741210938},...]
    const global_achievements = steam_request.achievementpercentages.achievements;



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

    const achievement_schemas = steam_request.game.availableGameStats.achievements
        .filter(x => x.name in user_locked)
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
            let achievement = global_achievements[i];
            if (achievement.name === schema.name) {
                percent = achievement.percent;
                percent_found = true;
                break;
            }
        }

        if (!percent_found) {
            console.info('Percent not found');
            response.status(503).send('Percent not found');
            return;
        }

        output.push({
            display_name: schema.display_name,
            desc: schema.desc,
            percent: percent,
            icon: schema.icon
        });

    }

    response.setHeader('Content-Type', 'application/json');
    response.send(ownedGames);
    return;
});