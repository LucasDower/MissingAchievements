const userID = document.getElementById('username');
const userID2 = document.getElementById('username2');
const idForm = document.getElementById('idForm');
const gameForm = document.getElementById('gameForm');
const error = document.getElementById('error');
const select = document.getElementById('select');
const gameName = document.getElementById('gameName');
const container = document.getElementById('container');
const spinner = document.getElementById('spinner');
const u_id_re = new RegExp('^([0-9]).{16}$');
const g_id_re = new RegExp('^[0-9]{1,}$');

const temp = d => `<div class="card m-3 border-0">
<div class="card-body shadow p-3 bg-white rounded">
    <div class="media">
        <img src="${d.icon}" class="mr-3 rounded" alt="...">
        <div class="media-body">
            <h5 class="mt-0 mb-0">${d.display_name}</h5>
            ${d.desc || "(No desc)"}
            <div class="progress rounded-pill">
                <div class="progress-bar rounded-pill" role="progressbar" style="width: ${d.percent}%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
                    ${d.percent}%
                </div>
            </div>
        </div>
    </div>
</div>
</div>`;

const profile = d =>
    `<div class="card m-3 border-0">
    <div class="card-body" style="background-color:#f0f0f0;">
        <div class="row">
            <img src="${d.avatar}"
                width="100" height="100" class="mb-2 mx-auto rounded-circle shadow" alt="">
        </div>
        <div class="row d-flex justify-content-center">
            <h3 class="m-0">${d.name}</h3>
        </div>
        <div class="row d-flex justify-content-center">
            <p class="mb-2 text-muted">${d.game}</p>
        </div>
        <div class="row d-flex justify-content-center">
            <span class="badge m-1 badge-pill badge-success">${d.unlocked} achieved</span>
            <span class="badge m-1 badge-pill badge-primary">${d.locked} unlockable</span>
            <span class="badge m-1 badge-pill badge-danger">${d.unobtainable} unobtainable</span>
        </div>
        <div class="mx-auto progress rounded-pill mt-2" style="width:75%">
            <div class="progress-bar bg-success" role="progressbar" style="width: ${d.unlocked * 100 / d.total}%"
                aria-valuemin="0" aria-valuemax="100"></div>
            <div class="progress-bar bg-primary" role="progressbar" style="width: ${d.locked * 100 / d.total}%"
                aria-valuemin="0" aria-valuemax="100"></div>
            <div class="progress-bar bg-danger" role="progressbar" style="width: ${d.unobtainable * 100 / d.total}%"
                aria-valuemin="0" aria-valuemax="100"></div>
        </div>
    </div>
</div>`;


idForm.addEventListener('submit', e => {
    if (!re.test(userID.value)) {
        e.preventDefault();
        userID.classList.add('is-invalid');
    } else {
        userID.classList.remove('is-invalid');
    }
});

select.addEventListener('change', e => {
    let u_id = testParameter('u_id', u_id_re);

    if (!u_id) {
        e.preventDefault();
        return;
    }

    userID2.value = u_id;
    gameName.value = select.options[select.selectedIndex].innerHTML;
    gameForm.submit();
});

async function callCloudFunction(url) {
    return await new Promise((res, rej) => {
        const ajax = new XMLHttpRequest();
        ajax.open("GET", url);
        ajax.onload = function () {
            if (this.status == 200) {
                res(JSON.parse(this.responseText));
            } else {
                res({});
            }
        };
        ajax.onerror = rej;
        ajax.send();
    });
}

function testParameter(key, regex) {
    let urlParams = new URLSearchParams(window.location.search);

    if (!urlParams.has(key)) {
        return false;
    }
    let value = urlParams.get(key);
    if (!regex.test(value)) {
        return false;
    }
    return value;
}

document.addEventListener('DOMContentLoaded', async () => {

    let u_id = testParameter('u_id', u_id_re);
    let g_id = testParameter('g_id', g_id_re);

    if (u_id && g_id) {

        spinner.classList.remove('hidden');

        let missingAchievements = await callCloudFunction(`https://europe-west2-missingachievements.cloudfunctions.net/getMissingAchievements?u_id=${u_id}&g_id=${g_id}`);
        if (missingAchievements === {}) {
            spinner.classList.add('hidden');
            return;
        }

        let urlParams = new URLSearchParams(window.location.search);
        let p = missingAchievements.stats;
        if (urlParams.has('g_name')) {
            p.game = urlParams.get('g_name');
        }
        p.total = p.locked + p.unlocked + p.unobtainable;
        container.innerHTML += profile(p);

        for (let r of missingAchievements.achievements) {
            r.percent = r.percent.toFixed(2);
            container.innerHTML += temp(r);
        }

        spinner.classList.add('hidden');
    }

    if (u_id) {
        spinner.classList.remove('hidden');

        let ownedGames = await callCloudFunction(`https://europe-west2-missingachievements.cloudfunctions.net/getOwnedGames?u_id=${u_id}`);
        if (ownedGames === {}) {
            spinner.classList.add('hidden');
            return;
        }
        ownedGames = ownedGames.games;

        for (let i = 0; i < ownedGames.length; i++) {
            var option = document.createElement('option');
            option.value = ownedGames[i].appid;
            option.text = ownedGames[i].name;
            select.add(option);
        }

        if (ownedGames.length > 0) {
            select.disabled = false;
        }

        spinner.classList.add('hidden');
    }


});