import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import 'dotenv/config';

const STEAM_KEY = process.env.STEAM_KEY;
const userIdRegex = new RegExp('^([0-9]).{16}$');

export type ResponseData_Games = {
    id: number,
    title: string,
    icon_url: string,
    has_achievements: boolean,
}[];

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData_Games>) {
    console.log('/api/games', req.query);

    const uId = req.query.u_id;
    if (!(typeof uId === 'string' && userIdRegex.test(uId))) {
        console.log('Bad user id');
        res.status(400).send([]);
        return;
    }

    const steamReq = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1?key=${STEAM_KEY}&steamid=${uId}&include_appinfo=true&include_played_free_games=false`)

    if (!steamReq.ok) {
        console.log('Bad steam response');
        res.status(500).send([]);
        return;
    }

    const steamResJSON = (await steamReq.json()) as any;

    const games = steamResJSON.response.games.map((x: any) => {
        return {
            id: x.appid,
            title: x.name,
            icon_url: `http://media.steampowered.com/steamcommunity/public/images/apps/${x.appid}/${x.img_icon_url}.jpg`,
            has_achievements: true,
        };
    }).sort((a: any, b: any) => {
        return a.title < b.title ? -1 : 1;
    });

    res.status(200).json(games);
}