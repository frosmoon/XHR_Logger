chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        save({
            onoff: "on",
            strict: false,
            adv: false,
            startup_mode: "on",
            url: "any",
            url2: "",
            log_from: "any",
            log_level: [],
            allowedExtensions: [],
            allowedStatusCodes: []
        });
    }

    chrome.contextMenus.create({
        id: "xhrloggerv4",
        title: "XHR Loger 4",
        contexts: ["page"],
    });
});
chrome.commands.onCommand.addListener((command) => {

    //console.log(`Command: ${command}`);
    switch (command) {
        case "open_xhr_main": {
            chrome.runtime.openOptionsPage() || chrome.tabs.create({
                url: "actions/options.html"
            });
            break;
        }
        case 'xhrloggeronoff': {
            save({
                onoff: on == true ? "off" : "on"
            });
            on = !on;
            break;
        }
    }
});
var on = true;
// Gestisci l'evento quando l'opzione del menu contestuale viene cliccata
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId == "xhrloggerv4") {
        // Apri la pagina delle opzioni in un nuovo tab
        chrome.tabs.create({
            url: "actions/options.html"
        });
    }
});

async function getUrl() {
    return new Promise((resolve, reject) => {
        findSaved(["startup_mode", "onoff", "file_extension", "log_from", "log_level", "url", "url2", "strict"]).then(result => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            if (result.onoff == "on") {
                on = true;
            } else {
                on = false;
            }
            if (result.startup_mode == undefined || result.startup_mode == null || result.startup_mode == '') {
                if (result.onoff == 'on') {
                    shouldStart = true;
                } else {
                    shouldStart = false;
                }
            } else if (result.startup_mode != "on") {
                if (result.onoff == 'on') {
                    shouldStart = true;
                } else {
                    shouldStart = false
                }
            } else {}





            if (result.startup_mode == "on") {
                shouldStart = true;
            }

            if (shouldStart != true) {
                resolve({
                    "shouldStart": shouldStart,
                    "auto_start": result.startup_mode == "on"
                });
            }
            allowedStatusCodes = result.log_level || [];
            allowedExtensions = result.file_extension || [];



            if (result.url2 == '' || result.url2 == undefined || result.url2 == null) {
                if (result.url == '' || result.url == undefined || result.url == null) {
                    save({
                        strict: false,
                        adv: true
                    });
                } else {
                    try {
                        const urls = new URL(result.url);

                        resolve({
                            url: urls.href,
                            strict: result.strict,
                            allowedStatusCodes: result.log_level,
                            allowedExtensions: result.file_extension,
                            log_from: result.log_from,
                            auto_start: result.startup_mode == "on"
                        });

                    } catch (err) {
                        /* const urlsd = `${result.url.replace((result.url.split('/'))[0],'*:')}`;
                         resolve({
                             url: urlsd,
                             strict: result.strict
                         });*/
                    }
                }
            } else {
                try {
                    const urls = new URL(result.url2);
                    resolve({
                        url: urls.href,
                        strict: result.strict,
                        allowedStatusCodes: result.log_level,
                        allowedExtensions: result.file_extension,
                        log_from: result.log_from,
                        auto_start: result.startup_mode == "on"
                    });
                } catch (err) {
                    /*  const urlsd = `${result.url2.replace((result.url2.split('/'))[0],'*:')}`;
                      resolve({
                          url: urlsd,
                          strict: result.strict
                      });*/
                }
            }
        });
    });
}


var url = "<all_urls>";
var array = [];
var allowedStatusCodes = [];
var allowedExtensions = [];

function parseUrl(url) {
    try {
        return new URL(url);
    } catch (error) {
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
var strict = false;
var defaulUrl,
    urlInfo, fullurl, started = false,
    shouldStart = false;

/**
 * Executes the start process.
 *
 * @return {boolean} Returns false if the start process should not be executed, otherwise returns true.
 */
function start() {
    getUrl().then((result) => {
        if (result.shouldStart == false) {
            started = false;
            //console.log('the reason -: should start', result.shouldStart);
            //console.log('removing listener');
            chrome.webRequest.onCompleted.removeListener(webRequestListener);

            postMessage("shouldStart", {
                "shouldStart": false,
                "auto_start": result.auto_start
            });
            return false;
        }
        postMessage("shouldStart", {
            "shouldStart": true,
            "auto_start": result.auto_start
        });

        //console.log('Starting normally');

        defaulUrl = result.url;
        strict = result.strict;
        let urlobj = parseUrl(defaulUrl);
        fullurl = urlobj['href'];
        if (result.log_from == 'fixed') {
            if (strict == true) {
                // Se strict è true, usa solo la directory dell'URL predefinito
                urlInfo = defaulUrl.split('/')[0] + '//' + defaulUrl.split('/')[2];
            } else {
                // Altrimenti, usa l'URL completo del tab corrente
                urlInfo = urlobj['origin'];
            }
        } else if (result.log_from == 'any') {
            urlInfo = 'any';
        }

        /*
        console.log('urlInfo', urlInfo);
        console.log('fullurl', fullurl);
        console.log('strict', strict);
        console.log('defaulUrl', defaulUrl);
        console.log('urlobj', urlobj);
        console.log('array', array);
        console.log('allowedStatusCodes', allowedStatusCodes);
        console.log('log_from', result.log_from);
        console.log('url', url);
        */
        /*
         if(result.log_from == 'fixed'){
             urlInfo = fullurl;
         } else if(result.log_from == 'all'){
             urlInfo = urlobj['origin'];
         }
         if (strict == true) {
             urlInfo = urlobj['href'].replace(defaulUrl.split('/')[defaulUrl.split('/').length - 1], '');
         } else {
             urlInfo = urlobj.protocol + '//' + urlobj.host;
         }
         */
        url = urlInfo;
    });

    if (!started || !chrome.webRequest.onCompleted.hasListener(webRequestListener)) {
        chrome.webRequest.onCompleted.addListener(webRequestListener, {
            urls: [defaulUrl || url == "any" ? "<all_urls>" : url]
        });
        started = true;
    }
    if (!chrome.webRequest.onErrorOccurred.hasListener(webRequestListener)) {
        chrome.webRequest.onErrorOccurred.addListener(webRequestListener, {
            urls: [defaulUrl || url == "any" ? "<all_urls>" : url]
        });
    }
}

start();


function getFileExtensionFromUrl2(url) {
    // Get the path part of the URL
    const path = new URL(url).pathname;

    // Use regex to extract the file extension
    const match = /\.\w+$/i.exec(path);

    // Check if a match is found and return the extension (excluding the dot)
    return match ? match[0].slice(1) : null;
}

function getFileExtensionFromUrl(url) {
    const fname = new URL(url).pathname.split('/').pop();
    return fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2);
}

function webRequestListener(details) {
    const isDuplicate = array.some((item) => item.url == details.url);

    if (!isBlocked(details.url)) {
        if (!isDuplicate) {
            if ((allowedStatusCodes == null || allowedStatusCodes.length <= 0) || (allowedStatusCodes != null && (allowedStatusCodes.includes("Any") || allowedStatusCodes.includes(details.statusCode.toString())))) {
                if ((allowedExtensions == null || allowedExtensions.length <= 0) || (allowedExtensions != null && (allowedExtensions.includes("Any") || allowedExtensions.includes(getFileExtensionFromUrl(details.url))))) {
                    if (url != 'any') {
                        console.log("Va bene.");
                        if (details.url.includes(url) && details.url != fullurl) {
                            array.push({
                                type: details.type,
                                url: details.url,
                                status: details.statusCode
                            });
                            updateArray('updateArray', array);
                        } else {
                            //console.log('specific doesnt match: ', url, details.url);
                        }
                    } else {
                        array.push({
                            type: details.type,
                            url: details.url,
                            status: details.statusCode
                        });
                        updateArray('updateArray', array);
                    }

                } else {
                    console.log('not allowed file extension', details.url.split('.')[details.url.split('.').length - 1], allowedExtensions);
                }
            } else {
                console.log('not allowed status code', details.statusCode, allowedStatusCodes);
            }

        } else {
            console.log('duplicate');
        }
    } else {
        console.log('blocked', details.url);
    }
}

function isBlocked(url) {
    var blockedProtocols = ['chrome-extension', 'chrome', 'edge'];
    var blockedUrls = ['newtab', 'extensions', 'about:blank', 'chrome.google.com'];
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
    }).then({});
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == 'popup') {
        if (request.data == 'open') {
            start();
            updateArray('updateArray', array);
            sendResponse('open');
        }
        if (request.data == 'refresh') {
            array = [];
            updateArray('updateArray', array);
            sendResponse('refresh');
        }
        if (request.data == 'force_update') {
            updateArray('updateArray', array);
            sendResponse('open');
        }
    }
    if (request.action == 'system') {
        if (request.data == 'url') {
            array = [];
            start();
            sendResponse('url');
        }
    }
    sendResponse({
        received: true
    });
    return true;
});


function save(data) {
    chrome.storage.local.set(data, function () {
        //console.log("Default settings saved");
    });
}