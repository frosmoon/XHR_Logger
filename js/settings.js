function initializePage() {
  // Aggiungi un gestore di eventi al selettore "startup_mode"
  const startupModeSelect = document.querySelector('.startup_mode');
  startupModeSelect.addEventListener('change', () => {
    saveOption({
      name: 'startup_mode',
      value: startupModeSelect.value
    })
  });

  const log_from = document.querySelector('.log_from');
  log_from.addEventListener('change', () => {
    saveOption({
      name: 'log_from',
      value: log_from.value
    })
  });

  const log_level = document.querySelector('.log_level');
  const log_levels = ["Any", "Xhr", 200, 202, 204, 404, 500, 502, 503, 504, 401, 403, 302, 201, 301, 304, 400, 422];
  const file_extension = document.querySelector('.file_extension');
  const file_extensions = ["Any", "mp4", "mp3", "m3u8", "js", "html", "css", "pdf", "png", "jpg", "jpeg", "gif", "txt", "json"];


  for (let i = 0; i < file_extensions.length; i++) {
    const newOption = document.createElement('option');
    newOption.value = file_extensions[i]; // Imposta il valore dell'opzione
    newOption.textContent = file_extensions[i]; // Imposta il testo dell'opzione
    file_extension.appendChild(newOption);
  }


  for (let i = 0; i < log_levels.length; i++) {
    const newOption = document.createElement('option');
    newOption.value = log_levels[i]; // Imposta il valore dell'opzione
    newOption.textContent = log_levels[i]; // Imposta il testo dell'opzione
    log_level.appendChild(newOption);
  }



  file_extension.addEventListener('change', (e) => {
    saveOption({
      name: 'file_extension',
      value: getSelectedLogLevels(e.target.selectedOptions)
    })
    console.log('saving', getSelectedLogLevels(e.target.selectedOptions));
  });


  log_level.addEventListener('change', (e) => {
    saveOption({
      name: 'log_level',
      value: getSelectedLogLevels(e.target.selectedOptions)
    })
    console.log('saving', getSelectedLogLevels(e.target.selectedOptions));
  });

  const uninstallButton = document.getElementById('uninstall');
  uninstallButton.addEventListener('click', () => {
    var url = window.location.href;
    var url2 = new URL(url);
    var browser = 'chrome:' + '//' + 'extensions/?id=' + url2['hostname'] + (url2['port'] !== '' ? (':' + url2['port']) : '');
    chrome.tabs.create({
      url: browser
    })
  })
  loadSettings();
}

/**
 * Retrieves the selected log levels from the given options.
 *
 * @param {Array} opts - The options to retrieve selected log levels from.
 * @return {Array} An array of the selected log levels.
 */
function getSelectedLogLevels(opts) {
  const selectedOptions = Array.from(opts);
  const selectedValues = selectedOptions.map(option => option.value);
  return selectedValues;
}


/**
 * Saves an option.
 *
 * @param {Event} event - The event triggering the save option.
 * @return {undefined} - This function does not return a value.
 */
function saveOption(event) {
  postMessage('system', 'url');
  console.log(event);
  save({
    [event.name]: event.value
  });
}

/**
 * Loads the settings for the application.
 *
 * @return {Promise} A promise that resolves when the settings are loaded.
 */
function loadSettings() {

  const startupModeSelect = document.querySelector('.startup_mode');
  const log_level = document.querySelector('.log_level');
  const log_from = document.querySelector('.log_from');

  findSaved(["startup_mode", "log_level", "log_from"]).then(result => {
    if (result.startup_mode !== undefined) {
      startupModeSelect.value = result.startup_mode;
    }
    if (result.log_level !== undefined) {
      result.log_level.forEach(value => {
        const option = log_level.querySelector(`[value="${value}"]`);
        if (option) {
          option.selected = true;
        }
      });
    }
    if (result.log_from !== undefined) {
      log_from.value = result.log_from;
    }
  })
}


/**
 * Saves the given parameters to the local storage.
 *
 * @param {Object} params - The parameters to be saved.
 * @return {undefined} - Does not return any value.
 */
function save(params) {
  chrome.storage.local.set(params);
}


/**
 * Finds and retrieves data from the local storage.
 *
 * @param {Array} params - An array of parameters to search for in the local storage.
 * @return {Promise} A promise that resolves to the retrieved data from the local storage.
 */
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

function postMessage(action, data) {
  chrome.runtime.sendMessage({
    action: action,
    data: data
  }).then({});
}


document.addEventListener('DOMContentLoaded', initializePage);