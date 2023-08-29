import type { NextApiRequest, NextApiResponse } from 'next';
import SteamAuth from 'node-steam-openid';
import 'dotenv/config';

const STEAM_KEY = process.env.STEAM_KEY!;
const MA_URL = process.env.MA_URL!;

const steam = new SteamAuth({
    realm: `http://${MA_URL}`,
    returnUrl: `http://${MA_URL}/api/return`,
    apiKey: STEAM_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('/api/return', req.query);

    try {
        const user = await steam.authenticate(req);
        res.redirect(`/?u_id=${user.steamid}`);
    } catch (error) {
        res.status(500).send('Could not authenticate');
        console.error(error);
    }
}