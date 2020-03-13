const functions = require('firebase-functions');
const fetch = require('node-fetch');
const api_key = functions.config().steam.key;
const re = new RegExp('^([0-9]).{16}$');

exports.getOwnedGames = functions.https.onRequest(async (request, response) => {

    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
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
    if (!re.test(user_id)) {
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
        .map(game => { return { 'appid': game.appid, 'name': game.name }; });

    response.setHeader('Content-Type', 'application/json');
    response.send(ownedGames);
    return;
});
