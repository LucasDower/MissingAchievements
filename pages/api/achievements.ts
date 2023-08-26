import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import 'dotenv/config';

const STEAM_KEY = process.env.STEAM_KEY;
const USER_ID_REGEX = new RegExp('^([0-9]).{16}$');
const GAME_ID_REGEX = new RegExp('^[0-9]{1,}$');

type AchievementData = {
    title: string,
    description: string,
    percent: number,
    icon: string,
};

export type ResponseData_Achievements = AchievementData[];

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData_Achievements>) {
    console.log('/api/achievements', req.query);

    const userId = req.query.u_id;
    const gameId = req.query.g_id;

    if (!(typeof userId === 'string' && USER_ID_REGEX.test(userId))) {
        console.log("Invalid u_id");
        res.status(400).send([]);
        return;
    }

    if (!(typeof gameId === 'string' && GAME_ID_REGEX.test(gameId))) {
        console.log("Invalid g_id");
        res.status(400).send([]);
        return;
    }

    const lockedAchievements = new Map<string, Partial<AchievementData>>();

    // Get the player's locked achievements for this game
    {
        const playerAchievementsResponse = await fetch(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${gameId}&key=${STEAM_KEY}&steamid=${userId}`);
        if (!playerAchievementsResponse.ok) {
            console.warn("Bad response from ISteamUserStats");
            res.status(400).send([]);
            return;
        }

        const playerAchievementsJSON = (await playerAchievementsResponse.json()) as any;

        playerAchievementsJSON.playerstats.achievements
            .filter((x: any) => x.achieved === 0)
            .forEach((x: any) => {
                lockedAchievements.set(x.apiname, {});
            });
    }


    // Get achievement unlock percentages.
    {
        const globalAchievementPercentagesResponse = await fetch(`http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${gameId}`);
        if (!globalAchievementPercentagesResponse.ok) {
            console.warn("Bad response from GetGlobalAchievementPercentagesForApp");
            res.status(400).send([]);
            return;
        }

        const globalAchievementPercentagesJSON = (await globalAchievementPercentagesResponse.json()) as any;
        const globalAchievements: { name: string, percent: number }[] = globalAchievementPercentagesJSON.achievementpercentages.achievements;

        globalAchievements.forEach((x) => {
            const entry = lockedAchievements.get(x.name);
            if (entry !== undefined) {
                entry.percent = x.percent;
            }
        });
    }

    // Get achievement details.
    {
        const achievementDetailsResponse = await fetch(`http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_KEY}&appid=${gameId}`);
        if (!achievementDetailsResponse.ok) {
            console.warn("Bad response from GetSchemaForGame");
            res.status(400).send([]);
            return;
        }

        const achievementDetailsJSON = (await achievementDetailsResponse.json()) as any;
        const details: { name: string, displayName: string, hidden: number, icon: string, description: string }[] = achievementDetailsJSON.game.availableGameStats.achievements;

        details.forEach((x) => {
            const entry = lockedAchievements.get(x.name);
            if (entry !== undefined) {
                entry.title = x.displayName;
                entry.description = x.description;
                entry.icon = x.icon;
            }
        });
    }

    const output = Array.from(lockedAchievements.values())
        .sort((a, b) => {
            return (a.percent ?? 0) > (b.percent ?? 0) ? -1 : 1;
        });

    res.status(200).json(output as ResponseData_Achievements);
}