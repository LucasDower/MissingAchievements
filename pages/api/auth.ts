import type { NextApiRequest, NextApiResponse } from 'next';
import SteamAuth from 'node-steam-openid';
import 'dotenv/config';

const STEAM_KEY = process.env.STEAM_KEY!;

const steam = new SteamAuth({
    realm: "http://localhost:3000",
    returnUrl: "http://localhost:3000/api/return",
    apiKey: STEAM_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('/api/auth');
    const redirectUrl = await steam.getRedirectUrl();
    res.redirect(redirectUrl);
}