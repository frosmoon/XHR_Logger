/*
window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
});
*/

function getTabId() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({
            active: !0,
            currentWindow: !0
        }, async function (tabs) {
            resolve(tabs[0]);
        });
    });
}

function isBlocked(url) {
    var blockedProtocols = ['chrome-extension', 'edge', 'chrome'];
    var blockedUrls = ['newtab', 'extensions', 'about:blank', 'chrome.google.com'];
    try {
        var url2 = new URL(url);
        return blockedProtocols.includes(url2.protocol.split(':')[0]) || blockedUrls.includes(url2.host);
    } catch (err) {

    }
}

function enableAllDisabledInputsAndButtons() {
    const elementsToEnable = document.querySelectorAll('input:disabled, button:disabled');

    elementsToEnable.forEach((element) => {
        element.disabled = false;
    });
}
let tab;
getTabId()
    .then((Tab) => {
        enableAllDisabledInputsAndButtons();
        tab = Tab;
        return findSaved(["startup_mode", "url", "url2", "strict"]);
    })
    .then((result) => {

        const parsedUrl = parseUrl(tab.url);
        const urlP = parsedUrl.href;
        const inp = document.getElementById('inp');

        if (!result.url2) {
            inp.placeholder = urlP || '';
            if (result.url) {
                if (result.strict && !result.url.includes(parsedUrl.href.replace(urlP.split('/')[urlP.split('/').length - 1], '')) && !isBlocked(parsedUrl.origin)) {
                    inp.value = urlP || '';
                    document.getElementById('json').value = '';
                    chrome.storage.local.set({
                        url: urlP
                    }).then(() => {});
                    sendMessage('popup', 'refresh');
                    enableAllDisabledInputsAndButtons();
                } else if (!result.url.includes(parsedUrl.host) && !isBlocked(parsedUrl.origin)) {
                    sendMessage('popup', 'refresh');
                    document.getElementById('json').value = '';
                    chrome.storage.local.set({
                        url: urlP
                    }).then(() => {});
                    sendMessage('system', 'url');
                    enableAllDisabledInputsAndButtons();
                } else if (isBlocked(parsedUrl.origin)) {
                    blocked(inp);
                    return;
                }
            } else {
                if (!isBlocked(parsedUrl.origin)) {
                    save({
                        strict: false,
                        adv: true,
                    });
                    sendMessage('popup', 'refresh');
                    document.getElementById('json').value = [];
                    chrome.storage.local.set({
                        url: urlP
                    }).then(() => {});
                    sendMessage('system', 'url');
                    reload('window');
                    enableAllDisabledInputsAndButtons();
                } else {
                    blocked(inp);
                    return;
                }
            }
        } else {
            enableAllDisabledInputsAndButtons();
            inp.value = result.url2;
        }
    });

function hideMessage() {
    var message = document.getElementById("message");
    message.style.display = "none";
    message.innerHTML = "";
}

function showMessage(msg) {
    var message = document.getElementById("message");
    message.style.display = "block";
    message.innerHTML = msg;
}

function disableAllInputsAndButtons(msg) {
    showMessage(msg);
    const elementsToDisable = document.querySelectorAll('input, button');

    elementsToDisable.forEach((element) => {
        if (element.id !== "toggle-offE" && element.id !== "toggle-onE")
            element.disabled = true;
    });
}

function parseUrl(url) {
    try {
        if (url === '' || !url) {
            return;
        }

        return new URL(url);
    } catch (error) {
        const urls = url.split('/');
        const protocol = urls[0].replace(':', '');
        const hostAndPort = urls[2].split(':');
        const host = hostAndPort[0];
        const port = hostAndPort[1] || '';
        const path = '/' + urls.slice(3).join('/');
        const origin = `${protocol}://${host}${port ? `:${port}` : ''}`;

        return {
            protocol,
            host,
            port,
            path,
            origin,
        };
    }
}



function sendMessage(action, data) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: action,
            data: data
        }).then(resolve);
    });
}
var adv = true;

function updateJson(data) {
    if (adv === false) {
        jsonTextArea.value = getUrlsFromData(data);
    } else {
        document.getElementById('json').value = data;
    }
    array = data;
}

function copyToClipboard() {
    // Select the text field
    var copyText = document.getElementById("json");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
}

// Add an event listener to receive messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "updateArray") {
        // Update the popup content
        var jsons = JSON.stringify(message.data)

        var jsons2 = JSON.parse(jsons);
        updateJson(jsons);
        document.getElementById('count').innerText = jsons2.length + " logs!";

    } else if (message.action === "shouldStart") {
        if (message.data.shouldStart == false) {
            disableAllInputsAndButtons("Extension is off.");
        } else if (message.data.shouldStart == true)
            enableAllDisabledInputsAndButtons();

        if (message.data.auto_start == true) {
            document.getElementById('on_offE').style.display = 'none';
        } else if (message.data.auto_start == false) {
            document.getElementById('on_offE').style.display = 'block';
        }
    }
    sendResponse({
        received: true
    });
    return true;
});
var array = [];
var simpleArray = [];

function save(params) {
    chrome.storage.local.set(params);
}

function reload(c) {
    if (isBlocked(tab.url)) {
        return;
    }
    switch (c) {
        case 'self': {
            window.location.reload();
            break;
        }
        case 'window': {
            //window.location.reload();
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                function: function () {
                    window.location.reload();
                }
            });
            break;
        }
        case 'all': {
            //window.location.reload();
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                function: function () {
                    window.location.reload();
                }
            });
            window.location.reload();
            break;
        }
    }
}
var jsonTextArea = null;
document.addEventListener('DOMContentLoaded', () => {
    var inputElement = document.getElementById('inp');
    document.getElementById('smb').addEventListener('click', (arg) => {
        const dataToSaveI = inputElement.value.trim();
        if (!isBlocked(dataToSaveI) && dataToSaveI != '') {
            reload('window');

            const dataToSave = {
                "url2": dataToSaveI
            };
            chrome.storage.local.set(dataToSave).then(() => {
                //document.getElementById('json').style.display = 'block';
            });

            sendMessage('system', 'url');

            // Rimuovi la classe "invalid" e "shake" se l'input è valido
            inputElement.classList.remove('invalid', 'shake');
            updateJson([]);
            hideMessage();
        } else {
            //blocked(inputElement);
            showMessage("Input empty!");
        }
    });

    document.getElementById('copy').addEventListener('click', copyToClipboard);
    jsonTextArea = document.getElementById('json');

    sendMessage('popup', 'open');

    document.getElementById('refresh').addEventListener('click', () => {
        if (!tab)
            return;
        if (!isBlocked(tab.url)) {
            sendMessage('popup', 'refresh').then(() => {
                jsonTextArea.value = '';
                reload('window');
            });
        }
    });
    document.getElementById('clear').addEventListener('click', () => {
        jsonTextArea.value = '';
        sendMessage('popup', 'refresh');
    });

    findSaved(["startup_mode", "onoff", 'strict', 'adv']).then((result) => {
        toggle({
            id1: 'toggle-on',
            id2: 'toggle-off'
        }, result.strict);

        toggle({
            id1: 'toggle-on2',
            id2: 'toggle-off2'
        }, result.adv);
        adv = result.adv;

        if (result.startup_mode === 'off') {
            document.getElementById('on_offE').style.display = 'block';
        } else {
            document.getElementById('on_offE').style.display = 'none';
        }
        toggle({
            id1: 'toggle-onE',
            id2: 'toggle-offE'
        }, result.onoff === 'off');
    });

    var tgs = document.getElementsByClassName('toggle');
    for (let i = 0; i < tgs.length; i++) {
        tgs[i].addEventListener('change', (e) => {
            switch (tgs[i].getAttribute('name')) {
                case 'fetch': {
                    save({
                        'strict': e.target.value === "true" ? true : false
                    });
                    break;
                }
                case 'adv': {
                    if (e.target.value === "false") {
                        jsonTextArea.value = getUrlsFromData(array);
                    } else {
                        jsonTextArea.value = array;
                    }
                    adv = e.target.value === "true" ? true : false;
                    save({
                        'adv': e.target.value === "true" ? true : false
                    });
                    break;
                }

                case 'onon': {
                    sendMessage('popup', 'open');
                    save({
                        'onoff': e.target.value === "false" ? "on" : "off"
                    });
                    if (e.target.value === "false")
                        clearError();
                    break;
                }
            }
        });
    }


    const toggleButton = document.getElementById('toggleButton');
    const resultsDiv = document.getElementById('results');

    toggleButton.addEventListener('click', () => {
        if (jsonTextArea.style.display === 'none') {
            // Passa alla visualizzazione JSON
            jsonTextArea.style.display = 'block';
            resultsDiv.style.display = 'none';
            toggleButton.textContent = 'Visualizza Risultati';
            //jsonTextArea.value = formatJSON(data);
        } else {
            // Passa alla visualizzazione dei risultati
            jsonTextArea.style.display = 'none';
            resultsDiv.style.display = 'block';
            toggleButton.textContent = 'Visualizza JSON';
            displayResults(resultsDiv, array);
        }
    });
    document.getElementById('toggle-onE');

    /* document.onkeyup = (e) => {
         console.log(e.key);
         if (e.altKey && e.shiftKey && e.key === 'g') {
             console.log('alt + shift + g');
             toggle({
                 id1: 'toggle-onE',
                 id2: 'toggle-offE'
             }, document.getElementById('toggle-onE').value === 'off');
             save({
                 onoff: document.getElementById('toggle-onE').value === "false"
             });
         }
     }*/
});

function clearError() {
    var message = document.getElementById("message");
    if (message != null) {
        message.style.display = "none";
        message.innerHTML = "";
    }
}

function blocked(inp) {
    inp.classList.add('invalid');
    // Aggiungi la classe "shake" per attivare l'effetto di shake
    inp.classList.add('shake');
    setTimeout(() => {
        inp.classList.remove('shake');
    }, 1000);
    disableAllInputsAndButtons();
    errorMsg(`<div class="error">Blocked url &lt;${inp.placeholder}>.</div>`);
}

function getUrlsFromData(data) {
    //return data.map(item => item.url);
    data = JSON.parse(data);
    let arr = [];
    for (let i = 0; i < data.length; i++) {
        arr.push(data[i].url);
    }
    return JSON.stringify(arr);
}

function formatJSON(data) {
    return JSON.stringify(data, null, 2);
}

function errorMsg(msg) {
    var message = document.getElementById("message");
    message.style.display = "block";
    message.innerHTML = msg;
}

function getColorForStatus(status) {
    if (status === '200') {
        return 'green';
    } else if (status === '404') {
        return 'red';
    }
    // Aggiungi altri casi per altri stati, se necessario
    return 'black'; // Colore predefinito
}

function getColorForExtension(url) {
    const extensions = {
        'png': 'blue',
        'jpg': 'orange',
        'css': 'purple',
        // Aggiungi altre estensioni e colori desiderati
    };
    const extension = url.split('.').pop().toLowerCase();
    return extensions[extension] || 'black'; // Colore predefinito
}

function displayResults(resultsDiv, data) {
    resultsDiv.innerHTML = '';
    data.forEach(item => {
        const div = document.createElement('div');
        div.textContent = item.url;
        div.style.color = getColorForStatus(item.status);
        div.style.backgroundColor = getColorForExtension(item.url);
        resultsDiv.appendChild(div);
    });
}

function toggle(id, toggles) {
    document.getElementById(id.id1).checked = toggles === true ? false : true;
    document.getElementById(id.id2).checked = toggles;
}


async function findSaved(params) {
    if (params.length < 1)
        return false;
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(params, (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result);
        });
    });
}