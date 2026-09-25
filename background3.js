chrome.runtime.onInstalled.addListener(function () {
    console.log('installed');
});

console.log('bg.js');

async function getUrl() {
    return new Promise((resolve, reject) => {
        findSaved(["url", "strict"]).then(result => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            try {
                //console.log(result.url);
                const urls = new URL(result.url);
                /*resolve({
                    url: `*://${urls.host}/*`,
                    strict: result.strict
                });*/
                resolve({
                    url: urls.href,
                    strict: result.strict
                });
            } catch (err) {
                const urlsd = `${result.url.replace((result.url.split('/'))[0],'*:')}`;
                resolve({
                    url: urlsd,
                    strict: result.strict
                });
            }
        });
    });
}


var url = "<all_urls>";
var array = [];

function parseUrl(url) {
    try {
        return new URL(url);
    } catch (error) {
        console.log(error,url);
        var paths = '';
        var urls = url.split('');
        return {
            protocol: urls[0].replace(':', ''),
            host: urls[1],
            port: urls[2],
            path: url.split(urls.length)[0],
            origin: url.split(urls.length)[0],
            //fullHost: (urls['origin'] || urls['protocol'] + '://' + urls['host'] + ':' + urls['port']) + '/'
        };
    }
}

async function findSaved(params) {
    if (params.length <= 0) return false;
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(params, (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result);
        });
    });
}

async function init() {
    try {
        const result = await getUrl();
        defaulUrl = result.url;
        strict = result.strict;
        let urlobj = parseUrl(defaulUrl);
        if (strict === true) {
            urlInfo = urlobj['href'].replace(defaulUrl.split('/')[defaulUrl.split('/').length - 1], '');
        } else {
            urlInfo = urlobj.host;
        }
        console.log(urlInfo);
        url = urlInfo;
        thisHost = urlobj.host;
        console.log(defaulUrl, url);
        startWebRequest();
    } catch (error) {
        console.error("Errore durante l'ottenimento dell'URL:", error);
    }
}

function startWebRequest() {
    chrome.webRequest.onCompleted.addListener(function (details) {
        const isDuplicate = array.some((item) => item.url === details.url);

        if (!details.url.includes(defaulUrl) && details.url.includes(url)) {
            if (!isBlocked(details.url)) {
                if (!isDuplicate) {
                    array.push({
                        type: details.type,
                        url: details.url,
                        status: details.statusCode,
                    });
                    updateArray('updateArray', array);
                }
            }
        }
    }, {
        urls: [defaulUrl || url],
    });
}

init();

function isBlocked(url) {
    var blockedProtocols = ['chrome-extension'];
    var blockedUrls = [];
    try {
        var url2 = new URL(url);
        return blockedProtocols.includes(url2.protocol.split(':')[0]) || blockedUrls.includes(url2.host);
    } catch (err) {

    }
}

function updateArray(action, array, tabId = 0) {
    postMessage(action, array);
}

function postMessage(action, data) {
    chrome.runtime.sendMessage({
        action: action,
        data: data
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'popup') {
        if (request.data === 'open') {
            updateArray('updateArray', array);
            sendResponse('open');
        }
        if (request.data === 'refresh') {
            array = [];
            updateArray('updateArray', array);
            console.log('refresh');
            sendResponse('open');
        }
        if (request.data === 'force_update') {
            updateArray('updateArray', array);
            console.log('force_update');
            sendResponse('open');
        }
    }
    if (request.action === 'system') {
        if (request.data === 'url') {
            getUrl().then((result) => {
                defaulUrl = result.url;
                strict = result.strict;
                let urlobj = parseUrl(defaulUrl);
                if (strict === true) {
                    urlInfo = urlobj['href'].replace(defaulUrl.split('/')[defaulUrl.split('/').length - 1], '');
                } else {
                    urlInfo = urlobj.host;
                }
                console.log(urlInfo);
                url = urlInfo;
                thisHost = urlobj.host;
            });
            sendResponse('url');
        }
    }
    return true;
});