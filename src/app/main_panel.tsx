'use client';

import { useEffect, useState } from 'react';
import Game from './game';
import { ResponseData_Games } from '../../pages/api/games';
import { ResponseData_Achievements } from '../../pages/api/achievements';
import Achievement from './achievement';
import Loading from './loading';
import AchievementStatus from './loading copy';

const USER_ID_REGEX = new RegExp('^([0-9]).{16}$');
const GAME_ID_REGEX = new RegExp('^[0-9]{1,}$');

export default function MainPanel() {
    const [steamId, setSteamId] = useState<string>('');
    const [gamesInfo, setGamesInfo] = useState<ResponseData_Games>([]);
    const [achievements, setAchievements] = useState<ResponseData_Achievements>({ data: [], meta: null });
    const [selectedGameId, setSelectedGameId] = useState<number>(NaN);
    const [loadingGames, setLoadingGames] = useState<boolean>(false);
    const [loadingAchievements, setLoadingAchievements] = useState<boolean>(false);

    const handleSteamSignIn = () => {
        window.location.replace('/api/auth');
    };

    const fetchGameData = (userId: string) => {
        if (!USER_ID_REGEX.test(userId)) {
            return;
        }

        setLoadingGames(true);
        fetch(`http://localhost:3000/api/games?u_id=${userId}`)
            .then(res => res.json())
            .then(res => {
                setGamesInfo(res);
                setSelectedGameId(NaN);
                setLoadingGames(false);
            })
            .catch((err) => {
                setGamesInfo([]);
                setSelectedGameId(NaN);
                setLoadingGames(false);
            });
    }

    const fetchAchievementData = (userId: string, gameId: number) => {
        if (!USER_ID_REGEX.test(userId)) {
            return;
        }

        if (!GAME_ID_REGEX.test(gameId.toString())) {
            return;
        }

        setAchievements({ data: [], meta: null });
        setLoadingAchievements(true);
        fetch(`http://localhost:3000/api/achievements?u_id=${userId}&g_id=${gameId}`)
            .then(res => res.json())
            .then(res => {
                console.log(res);
                setAchievements(res);
                setLoadingAchievements(false);
            })
            .catch((err) => {
                console.log(err);
                setAchievements({ data: [], meta: null });
                setSelectedGameId(NaN);
                setLoadingAchievements(false);
            });
    };

    const handleLoadButton = () => {
        setAchievements({ data: [], meta: null });
        fetchGameData(steamId);
    };

    const handleGameClick = (gameId: number) => {
        setSelectedGameId(gameId);
        fetchAchievementData(steamId, gameId);
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('u_id');
        if (userId !== null) {
            setSteamId(userId);
            fetchGameData(userId);
        }
    }, []);

    return (
        <>
            <div className="basis-1/3 flex flex-col bg-zinc-900 shadow-md z-10 p-6">
                <div className="flex flex-col h-full p-4 gap-8">
                    <div className="flex flex-row items-center justify-center gap-2">
                        <div className='rounded-full bg-blue-500 h-8 w-8'></div>
                        <div className="flex flex-col">
                            <p className="text-xl">MissingAchievements</p>
                            <p className="text-zinc-400 text-sm">Track your missing Steam achievements</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2 items-center">
                            <p className="text-white font-medium">SteamID64</p>
                            <input type="text" id="steam_id" className="flex-1 border rounded-lg p-2.5 text-zinc-800" placeholder="76561198049905672" required value={steamId} onChange={(e) => { setSteamId(e.target.value); }}></input>
                            <button type="button" className="text-white focus:ring-4 font-medium rounded-lg px-5 py-2.5 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-blue-800" onClick={handleLoadButton}>Load</button>
                        </div>
                        <div className="text-zinc-500 self-center">
                            - or -
                        </div>
                        <div className="self-center">
                            <button type="button" className="disabled:text-zinc-300 enabled:text-white focus:outline-none focus:ring-4 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 bg-zinc-800 enabled:hover:bg-zinc-700 focus:ring-zinc-700 border-zinc-700" onClick={handleSteamSignIn}>
                                Sign In With Steam
                            </button>
                        </div>
                    </div>
                    <div className="bg-zinc-800 h-full flex-grow-0 overflow-y-auto rounded-lg p-4">
                        {loadingGames ?
                            <Loading></Loading> :
                            <div className="flex flex-col gap-2 text-sm">
                                {gamesInfo.map(x => <Game key={x.id} handleClick={() => { handleGameClick(x.id); }} is_selected={x.id === selectedGameId} has_achievements={x.has_achievements} icon_url={x.icon_url} title={x.title}></Game>)}
                            </div>
                        }
                    </div>

                </div>
            </div>
            <div className="basis-2/3 bg-zinc-800">
                {loadingAchievements ? (
                    <Loading></Loading>
                ) : (
                    achievements.meta !== null ? (
                        <AchievementStatus status={achievements.meta}></AchievementStatus>
                    ) : (
                        <div className="flex flex-col gap-2 text-sm h-full overflow-y-auto p-8">
                            {achievements.data.map(x => (
                                <Achievement
                                    key={x.title}
                                    title={x.title}
                                    description={x.description}
                                    icon_url={x.icon}
                                    percent={x.percent}
                                ></Achievement>
                            ))}
                        </div>
                    )
                )}
            </div>
        </>
    );
}