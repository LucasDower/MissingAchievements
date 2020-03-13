const userID = document.getElementById('username');
const userID2 = document.getElementById('username2');
const idForm = document.getElementById('idForm');
const gameForm = document.getElementById('gameForm');
const error = document.getElementById('error');
const select = document.getElementById('select');
const container = document.getElementById('container');

const temp = d => `<div class="media mb-3">
<img src="${d.icon}" class="mr-3" alt="...">
<div class="media-body">
  <h5 class="mt-0">${d.name}</h5>
  ${d.desc}
</div>
</div>`;

const re = new RegExp('^([0-9]).{16}$');

idForm.addEventListener('submit', e => {
    if (!re.test(userID.value)) {
        e.preventDefault();
        userID.classList.add('is-invalid');
    } else {
        userID.classList.remove('is-invalid');
    }
});

select.addEventListener('change', e => {
    let urlParams = new URLSearchParams(window.location.search);

    if (!urlParams.has('u_id')) {
        console.log('a');
        e.preventDefault();
        return;
    }
    param_id = urlParams.get('u_id');
    if (!re.test(param_id)) {
        console.log('b');
        e.preventDefault();
        return;
    }

    userID2.value = param_id;
    gameForm.submit();
});

document.addEventListener('DOMContentLoaded', async () => {
    let urlParams = new URLSearchParams(window.location.search);

    if (!urlParams.has('u_id')) {
        return;
    }
    param_id = urlParams.get('u_id');
    if (!re.test(param_id)) {
        return;
    }

    /*
    let ownedGames = await new Promise((res, rej) => {
        const ajax = new XMLHttpRequest();
        ajax.open("GET", `https://us-central1-missingachievements.cloudfunctions.net/getOwnedGames?id=${param_id}`);
        ajax.onload = function () {
            if (this.status == 200) {
                res(JSON.parse(this.responseText));
            } else {
                res([]);
            }
        };
        ajax.onerror = rej;
        ajax.send
        ();
    });
    */

    let ownedGames = [{ 'appid': 12345, 'name': 'Tyranny' }, { 'appid': 23456, 'name': 'Terraria' }];
    console.log(ownedGames);
    if (ownedGames.length == 0) {
        select.disabled = true;
        return;
    }

    for (let i = 0; i < ownedGames.length; i++) {
        var option = document.createElement('option');
        option.value = ownedGames[i].appid;
        option.text = ownedGames[i].name;
        select.add(option);
    }
    select.disabled = false;
    if (!urlParams.has('g_id')) {
        console.log('a');
        return;
    }

    let game_id = urlParams.get('g_id');

    /*
    let user_locked = await new Promise((res, rej) => {
        const ajax = new XMLHttpRequest();
        ajax.open("GET", `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${game_id}&key=${api_key}&steamid=${param_id}`);
        ajax.onload = function () {
            if (this.status == 200) {
                res(JSON.parse(this.responseText));
            } else {
                res([]);
            }
        };
        ajax.onerror = rej;
        ajax.send
        ();
    });
    */

    let user_locked = `{"playerstats":{"steamID":"76561198049905672","gameName":"Halo: The Master Chief Collection","achievements":[{"apiname":"1_0_LIFE_STORY","achieved":0,"unlocktime":0},{"apiname":"1_1_JUST_GETTING_STARTED","achieved":1,"unlocktime":1575508065},{"apiname":"1_2_BALAHOS_MOST_WANTED","achieved":1,"unlocktime":1575761085},{"apiname":"1_3_THE_ONE_PERCENT","achieved":1,"unlocktime":1575942532},{"apiname":"1_4_SPOILSPORT","achieved":1,"unlocktime":1575943717},{"apiname":"1_5_GOING_BANANAS","achieved":0,"unlocktime":0},{"apiname":"1_6_HUNTERS_HUNTED","achieved":0,"unlocktime":0},{"apiname":"1_7_CHECKMATE","achieved":0,"unlocktime":0},{"apiname":"1_8_I_WAS_WONDERING_WHAT_WOULD_BREAK_FIRST","achieved":0,"unlocktime":0},{"apiname":"1_9_PEST_CONTROL","achieved":0,"unlocktime":0},{"apiname":"1_10_THANKS_A_KILLION","achieved":0,"unlocktime":0},{"apiname":"1_11_MEDAL_COMPLETIONIST","achieved":0,"unlocktime":0},{"apiname":"1_12_THE_GUARDIANS_ARE_COMING","achieved":0,"unlocktime":0},{"apiname":"1_13_BITE_THE_HAND","achieved":1,"unlocktime":1575413272},{"apiname":"1_14_MYSTERY_ACHIEVEMENT","achieved":1,"unlocktime":1583461798},{"apiname":"1_15_WHERE_AM_I?","achieved":1,"unlocktime":1575506051},{"apiname":"1_16_I_GOT_THIS","achieved":1,"unlocktime":1576428656},{"apiname":"1_17_TEMPERED_BLADE","achieved":1,"unlocktime":1575753973},{"apiname":"1_18_FORGED_IN_FIRE","achieved":0,"unlocktime":0},{"apiname":"1_19_SAMPLE_PLATE","achieved":0,"unlocktime":0},{"apiname":"1_20_I_DABBLE_IN_SLAYING","achieved":0,"unlocktime":0},{"apiname":"1_21_STICK_WITH_IT_A_LITTLE_LONGER","achieved":1,"unlocktime":1575415160},{"apiname":"1_22_VETERAN","achieved":0,"unlocktime":0},{"apiname":"1_23_WAR_HERO","achieved":0,"unlocktime":0},{"apiname":"1_24_LEGEND","achieved":0,"unlocktime":0},{"apiname":"1_25_LORE_MASTER","achieved":0,"unlocktime":0},{"apiname":"1_26_YOUR_JOURNEY_BEGINS","achieved":1,"unlocktime":1575413272},{"apiname":"1_27_LASO_MASTER","achieved":0,"unlocktime":0},{"apiname":"1_28_PILLAR_OF_AUTUMN","achieved":1,"unlocktime":1583541749},{"apiname":"1_29_HALO","achieved":0,"unlocktime":0},{"apiname":"1_30_TRUTH_AND_RECONCILIATION","achieved":1,"unlocktime":1583465721},{"apiname":"1_31_THE_SILENT_CARTOGRAPHER","achieved":1,"unlocktime":1583468481},{"apiname":"2_0_ASSAULT_ON_THE_CONTROL_ROOM","achieved":1,"unlocktime":1583473035},{"apiname":"2_1_343_GUILTY_SPARK","achieved":0,"unlocktime":0},{"apiname":"22_15_JORGE_CANT_HAVE_ALL_THE_BIG_GUNS","achieved":1,"unlocktime":1575769219},{"apiname":"22_16_IM_SORRY_DAVE","achieved":1,"unlocktime":1575412281},{"apiname":"22_17_WORKERS_COMPENSATION","achieved":0,"unlocktime":0},{"apiname":"22_18_CAPACIOUS_CARTOGRAPHY","achieved":0,"unlocktime":0},{"apiname":"22_19_REQUIESCAT_IN_PACE","achieved":0,"unlocktime":0},{"apiname":"22_20_RUN_AND_GUNNED","achieved":1,"unlocktime":1575752878},{"apiname":"22_21_GAME_BREAKER","achieved":1,"unlocktime":1576226239},{"apiname":"22_22_BECAUSE_IT_WASNT_HARD_ENOUGH","achieved":0,"unlocktime":0},{"apiname":"22_23_CLASSIC_COMPLETION","achieved":1,"unlocktime":1576229613},{"apiname":"22_24_CONFUSED_CALLOUTS","achieved":1,"unlocktime":1575506594},{"apiname":"22_25_COLLECTION_ELIGIBILITY_CONFIRMED","achieved":1,"unlocktime":1576438824},{"apiname":"22_26_MIND_THE_SKILL_GAP","achieved":1,"unlocktime":1575766177},{"apiname":"22_27_EASY_TO_OVERLOOK","achieved":1,"unlocktime":1575413940},{"apiname":"22_28_NEW_WAYS_TO_SAVE_A_BUCK","achieved":1,"unlocktime":1575775179}],"success":true}}`;
    user_locked = JSON.parse(user_locked);

    user_locked = user_locked.playerstats.achievements
        .filter(x => x.achieved == 0)
        .map(x => x.apiname);

    /*
    let user_locked = await new Promise((res, rej) => {
        const ajax = new XMLHttpRequest();
        ajax.open("GET", `http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${game_id}`);
        ajax.onload = function () {
            if (this.status == 200) {
                res(JSON.parse(this.responseText));
            } else {
                res([]);
            }
        };
        ajax.onerror = rej;
        ajax.send
        ();
    });
    */

    let details = [{ name: 'Lucas', desc: 'blah blah', icon: ''}, { name: 'Calum', desc: 'blah blah', icon: ''}];
    for (let d of details) {
        console.log(d);
        container.innerHTML += temp(d);
    }

});