const userID = document.getElementById('username');
const idForm = document.getElementById('idForm');
const gameForm = document.getElementById('gameForm');
const error = document.getElementById('error');
const fieldset = document.getElementById('fieldset');

const re = new RegExp('^([0-9]).{16}$');

idForm.addEventListener('submit', e => {
    if (!re.test(userID.value)) {
        e.preventDefault();
        userID.classList.add('is-invalid');
    } else {
        userID.classList.remove('is-invalid');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    let urlParams = new URLSearchParams(window.location.search);

    if (!urlParams.has('id')) {
        return;
    }
    param_id = urlParams.get('id');
    if (!re.test(param_id)) {
        return;
    }

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
        ajax.send();
    });
    console.log(ownedGames);

});