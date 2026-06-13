
let settings = {
    difficulty: {
        bombAmount: {
            value: 4,
            default: 4,
            element: 'bomb-amount-inp'
        },
        lives: {
            value: 3,
            default: 3,
            element: 'lives-inp'
        },
        showLayerBombAmount: {
            value: true,
            default: true,
            element: 'bombs-on-layer-chbx'
        }
    },
    size: {
        width: {
            value: 5,
            default: 5,
            element: 'board-width-inp'
        },
        height: {
            value: 5,
            default: 5,
            element: 'board-height-inp'
        },
        layers: {
            value: 3,
            default: 3,
            element: 'board-layers-inp'
        }
    },
    colors: {
        grass: {
            value: '#306d53',
            default: '#306d53',
            element: 'color-grass-inp'
        },
        grassTileing: {
            value: '#171b45',
            default: '#171b45',
            element: 'tileing-color-grass-inp'
        },
        grassTileingOpacity: {
            value: 20,
            default: 20,
            element: 'tileing-opacity-grass-inp'
        },
        grassText: {
            value: '#ecf0f1',
            default: '#ecf0f1',
            element: 'sub-color-grass-inp'
        },
        grassFlag: {
            value: '#ea101b',
            default: '#ea101b',
            element: 'flag-color-grass-inp'
        },
        ground: {
            value: '#c9ad80',
            default: '#c9ad80',
            element: 'color-ground-inp'
        },
        groundTileing: {
            value: '#441745',
            default: '#441745',
            element: 'tileing-color-ground-inp'
        },
        groundTileingOpacity: {
            value: 25,
            default: 25,
            element: 'tileing-opacity-ground-inp'
        },
        groundText: {
            value: '#1a191b',
            default: '#1a191b',
            element: 'sub-color-ground-inp'
        },
        groundFlag: {
            value: '#ad0009',
            default: '#ad0009',
            element: 'flag-color-ground-inp'
        }
    }
}

let boardWidth;
let boardHeight;

let totalLayers;
let currentLayer;

let totalLives;
let currentLives;

let bombs;

let boardData;
let openTiles;
let flags;

function setupGameVariables() {
    boardWidth = settings.size.width.value;
    settings.size.height.value = boardWidth; // Because custome height is not implemented yet
    boardHeight = settings.size.height.value;

    totalLayers = settings.size.layers.value;
    currentLayer = 1;

    totalLives = settings.difficulty.lives.value;
    currentLives = settings.difficulty.lives.value;

    bombs = {
        all: settings.difficulty.bombAmount.value <= boardWidth*boardHeight*totalLayers ? settings.difficulty.bombAmount.value : boardWidth*boardHeight*totalLayers,
        layer: Array.from({ length: totalLayers }, () => 0),
        revealed: {
            all: 0,
            layer: Array.from({ length: totalLayers }, () => 0)
        }
    };

    boardData = Array.from({ length: totalLayers }, () => Array.from({ length: boardHeight }, () => Array.from({ length: boardWidth }, () => 0)));
    openTiles = Array.from({ length: totalLayers }, () => []); // Create empty arrays for each layer to track opened tiles

    flags = {
        total: {
            all: 0,
            layer: Array.from({ length: totalLayers }, () => 0)
        },
        layer: Array.from({ length: totalLayers }, () => []) // Create empty arrays for each layer to track flagged tiles
    };
}

function updateUI() {
    updateLayerDisplay();
    updateBombDisplay();
    updateLivesDisplay();
}

function updateLayerDisplay() {
    const layerElement = document.getElementById('current-layer');
    if (!layerElement) return;
    
    layerElement.textContent = `${currentLayer}/${totalLayers}`;

    if (currentLayer <= 1) document.getElementById('go-down-btn').disabled = true;
    else document.getElementById('go-down-btn').disabled = false;

    if (currentLayer >= totalLayers) document.getElementById('go-up-btn').disabled = true;
    else document.getElementById('go-up-btn').disabled = false;
}

function updateBombDisplay() {
    const bombAmountElement = document.getElementById('mines-left');
    if (!bombAmountElement) return;

    let text = `${bombs.all - flags.total.all - bombs.revealed.all}`;
    if (settings.difficulty.showLayerBombAmount.value) text += ` (${bombs.layer[currentLayer - 1] - flags.total.layer[currentLayer - 1] - bombs.revealed.layer[currentLayer - 1]})`;
    bombAmountElement.textContent = text;
}

function updateLivesDisplay() {
    const livestElement = document.getElementById('lives');
    if (!livestElement) return;

    let text = `${currentLives}/${totalLives}`;
    livestElement.textContent = text;
}

function updateTilesToLayer() {
    const openTileIndexes = openTiles[currentLayer - 1];
    openTileIndexes.forEach(index => {
        const tileNumber = document.getElementById(`tile-number-${index}`);
        if (!tileNumber) return;
    });
}

function goUp() {
    if (currentLayer < totalLayers) {
        currentLayer += 1;
        updateUI();
        setupBoard();
    }
}

function goDown() {
    if (currentLayer > 1) {
        currentLayer -= 1;
        updateUI();
        setupBoard();
    }
}

function indexToCoordinates(index) {
    const x = index % boardWidth;
    const y = Math.floor(index / boardWidth);
    return { x, y };
}

function coordinatesToIndex(x, y) {
    return y * boardWidth + x;
}

function handleTileClick(index) {
    
    if (isTileOpen(currentLayer, index)) {
        const tile = document.getElementById(`tile-number-${index}`);
        if (!tile) return;
        const tileNumber = parseInt(tile.innerText);
        if (tileNumber == NaN) return;

        if (getAdjecentKnownBombs(index) >= tileNumber) openAdjecent(currentLayer, index);
    } else {
        const mineToggleRadio = document.getElementById('flag-toggle-mine');
        if (mineToggleRadio && mineToggleRadio.checked) {
            mineGrass(index);
        } else {
            placeFlag(index);
        }
    }

}

function handleTileRightClick(index, event) {
    if (event) {
        event.preventDefault();
    }
    
    const mineToggleRadio = document.getElementById('flag-toggle-mine');
    if (mineToggleRadio && mineToggleRadio.checked) {
        placeFlag(index);
    } else {
        mineGrass(index);
    }
}

function placeFlag(index) {
    if (isTileOpen(currentLayer, index)) return // Do nothing if it's already open
    const tileNumber = document.getElementById(`tile-number-${index}`);
    if (!tileNumber) return;

    const layerFlags = flags.layer[currentLayer - 1];
    const flagIndex = layerFlags.indexOf(index);

    if (flagIndex >= 0) {
        layerFlags.splice(flagIndex, 1);
        tileNumber.innerHTML = '';
        flags.total.all -= 1;
        flags.total.layer[currentLayer - 1] -= 1;
    } else {
        layerFlags.push(index);
        tileNumber.innerHTML = '<div class="flag"></div>';
        flags.total.all += 1;
        flags.total.layer[currentLayer - 1] += 1;
    }

    updateBombDisplay();
}

function mineGrass(index, layer = currentLayer) {
    if (isTileOpen(layer, index)) return // Do nothing if it's already open

    if (flags.layer[layer - 1].includes(index)) {
        return; // Do not open a flagged tile unless the flag is removed first
    }

    if (!openTiles[layer - 1].includes(index)) {
        openTiles[layer - 1].push(index);
    }

    const tileValue = getTileValue(layer, index);

    if (tileValue >= 100) {
        bombs.revealed.all += 1;
        bombs.revealed.layer[layer - 1] += 1;
        loseLives();
    }

    if (tileValue == 0) openAdjecent(layer, index); // Open all adjecent tiles

    if (layer == currentLayer) { // Only update board tiles if it is on the current layer
        const tileNumber = document.getElementById(`tile-number-${index}`);
        if (!tileNumber) return;

        const tileButton = tileNumber.closest('.tile');
        if (!tileButton) return;
            
        tileButton.classList.remove('grass');
        tileButton.classList.add('ground');

        tileNumber.innerHTML = getTileContent(index, layer, '', tileValue);
    }

    updateBombDisplay();
}

function openAdjecent(layer, index) {
    const { x, y } = indexToCoordinates(index);

    // Go through each tile around
    let nl = 0, nx = 0, ny = 0, ni = 0;
    for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
        nl = layer + offsetZ;
        if (nl < 1 || nl > totalLayers) continue; // Skip invalid layers

        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            nx = x + offsetX;
            if (nx < 0 || nx >= boardWidth) continue; // Skip invalid tiles

            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                ny = y + offsetY;
                if (ny < 0 || ny >= boardWidth) continue; // Skip invalid tiles

                ni = coordinatesToIndex(nx, ny);
                if (!isTileOpen(nl, ni)) mineGrass(ni, nl);
            }
        }
    }
}

function getAdjecentKnownBombs(index, layer = currentLayer) {
    const { x, y } = indexToCoordinates(index);

    let adjecentKnownBombs = 0;

    // Go through each tile around
    let nl = 0, nx = 0, ny = 0, ni = 0;
    for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
        nl = layer + offsetZ;
        if (nl < 1 || nl > totalLayers) continue; // Skip invalid layers

        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            nx = x + offsetX;
            if (nx < 0 || nx >= boardWidth) continue; // Skip invalid tiles

            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                ny = y + offsetY;
                if (ny < 0 || ny >= boardWidth) continue; // Skip invalid tiles

                ni = coordinatesToIndex(nx, ny);
                if (flags.layer[nl - 1].includes(ni) || (isTileOpen(nl, ni) && isTileBomb(nl, ni))) adjecentKnownBombs++;
            }
        }
    }

    return adjecentKnownBombs;
}

function getTileValue(layer, index) {
    const { x, y } = indexToCoordinates(index);
    return getTileValueCords(layer, x, y);
}

function getTileValueCords(layer, x, y) {
    /*
     * >= 0 & < 100 = number of adjacent mines
     * >= 100 ..... = mine
     * -2 ......... = invalid layer
     * -3 ......... = invalid coordinates
     */
    if (layer < 1 || layer > totalLayers) return -2; // Invalid layer
    if (x < 0 || x >= boardWidth || y < 0 || y >= boardWidth) return -3; // Invalid coordinates
    const value = boardData[layer - 1][y][x];
    return value;
}

function getTileContent(index, layer = currentLayer, zeroContent = '', tileValue = null) {
    if (tileValue == null) tileValue = getTileValue(layer, index);

    if (isTileFlagged(layer, index)) return '<div class="flag"></div>'; // Flag
    else if (tileValue == 0) return zeroContent; // No adjacent mines
    else if (tileValue >= 100) return '<div class="mine"></div>'; // Mine
    else if (tileValue == -2) return ''; // Invalid layer
    else if (tileValue == -3) return ''; // Invalid coordinates
    else return tileValue.toString(); // Number of adjacent mines
}

function isTileOpen(layer, index) {
    if (layer < 1 || layer > totalLayers) return true; // Invalid layer (if its invalid its open as it is not blocked by grass)
    return openTiles[layer - 1].includes(index);
}

function isTileFlagged(layer, index) {
    if (layer < 1 || layer > totalLayers) return false; // Invalid layer
    return flags.layer[layer - 1].includes(index);
}

function isTileBomb(layer, index) {
    if (layer < 1 || layer > totalLayers) return false; // Invalid layer
    return getTileValue(layer, index) >= 100;
}

function updateSetting(newValue, settingKey, subSettingKey = null) {
    
    let setting = settings[settingKey];
    if (subSettingKey) setting = setting[subSettingKey];

    if (document.getElementById(setting.element).type == 'number') setting.value = parseFloat(newValue);
    else setting.value = newValue;

    // Special cases:
    console.log(subSettingKey, setting)
    if (subSettingKey == 'showLayerBombAmount') updateBombDisplay();

    updateSettingHtml(setting.element, newValue);
    saveSettingsToCookie();
}

function resetSetting(settingKey) {
    let setting = settings[settingKey];

    if (Object.hasOwn(setting, 'value')) {
        setting.value = setting.default;
        updateSettingHtml(setting.element, setting.default);
    } else {
        for (let subKey of Object.keys(setting)) {
            let subSetting = setting[subKey];
            subSetting.value = subSetting.default;
            updateSettingHtml(subSetting.element, subSetting.default);
        }
    }

    saveSettingsToCookie();
}

function mirrorHtmlToSettings() {
    for (let key of Object.keys(settings)) {
        let setting = settings[key];

        if (Object.hasOwn(setting, 'value')) {
            updateSettingHtml(setting.element, setting.value);
        } 
        else {
            for (let subKey of Object.keys(setting)) {
                let subSetting = setting[subKey];
                updateSettingHtml(subSetting.element, subSetting.value);
            }
        }
    }
}

function updateSettingHtml(elementId, value) {
    const element = document.getElementById(elementId);

    if (element.tagName == 'INPUT') {

        if (element.type == 'checkbox') element.checked = value;
        else element.value = value;

        let cssVariable = element.getAttribute('for-css');
        if (cssVariable) {
            const root = document.documentElement;
            switch (element.type) {
                case 'color':
                    root.style.setProperty(cssVariable, value);
                    break;
    
                case 'number':
                    root.style.setProperty(cssVariable, value + '%');
                    break;
            
                default:
                    break;
            }
        }
    }
}

function saveSettingsToCookie() {
    cookiefy('settings', settings, true);
}

function loadSettingsFromCookie() {
    let cookieSettings = getCookie('settings', true);

    if (cookieSettings && keysMatch(cookieSettings, settings)) {
        settings = cookieSettings;
    }
}

function keysMatch(obj1, obj2) {
    if ((typeof obj1 === 'object' && !Array.isArray(obj1)) && (typeof obj2 === 'object' && !Array.isArray(obj2))) {

        const keysObj1 = Object.keys(obj1);
        if (keysObj1.length != Object.keys(obj2).length) return false;

        for (let key of keysObj1) {
            if (!Object.hasOwn(obj2, key)) return false;

            const valObj1 = obj1[key];
            const valObj2 = obj2[key];

            if (!keysMatch(valObj1, valObj2)) return false;
        }
    }

    return true;
}


function cookiefy(cookieName, value, json = false) {
    let cookieValue;
    if (json) cookieValue = JSON.stringify(value);
    else cookieValue = value;

    document.cookie = `${cookieName}=${cookieValue}`;
}

function getCookie(cookieName, json = false) {
    const cookieMatch = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
    
    if (cookieMatch) {
        const decodedValue = cookieMatch[2];
        if (!decodedValue || decodedValue == 'undefined') return null;

        let val;
        if (json) val = JSON.parse(decodedValue);
        else val = decodedValue;

        return val;
    }

    return null;
}


function loseLives(amount = 1) {
    currentLives -= amount;
    updateLivesDisplay();

    if (currentLives <= 0) loseGame();
}

function loseGame() {
    //TODO
    console.log('You lost...');
}

function winGame() {
    //TODO
    console.log('You won!');
}


function setupBoard() {
    const board = document.querySelector('.board');
    const boardInner = document.querySelector('.board-inner');
    if (!boardInner || !board) return;

    board.style.setProperty('--column-count', boardWidth);

    let html = '';
    let tileOpened = false, tileContent = '', upperTileContent = '', lowerTileContent = '';
    for (let i = 0; i < boardWidth * boardWidth; i++) {
        tileOpened = isTileOpen(currentLayer, i);
        tileContent = tileOpened || isTileFlagged(currentLayer, i) ? getTileContent(i) : '';
        upperTileContent = isTileOpen(currentLayer + 1, i) || isTileFlagged(currentLayer + 1, i) ? getTileContent(i, currentLayer + 1, '-') : '??';
        lowerTileContent = isTileOpen(currentLayer - 1, i) || isTileFlagged(currentLayer - 1, i) ? getTileContent(i, currentLayer - 1, '-') : '??';

        html += `
            <button class="tile ${tileOpened ? 'ground' : 'grass'}" onClick="handleTileClick(${i})" oncontextmenu="handleTileRightClick(${i}, event)">
                <span class="tile-tiny-info-number tile-above-number" id="tile-above-${i}">${upperTileContent}</span>
                <span class="tile-number" id="tile-number-${i}">${tileContent}</span>
                <span class="tile-tiny-info-number tile-under-number" id="tile-under-${i}">${lowerTileContent}</span>
            </button>
        `;
    }
    boardInner.innerHTML = html;
}

function populateWithBombs() {
    boardData = Array.from({ length: totalLayers }, () => Array.from({ length: boardHeight }, () => Array.from({ length: boardWidth }, () => 0)));
    bombs.layer = Array.from({ length: totalLayers }, () => 0);

    let index = 0, layer = 0;
    for (let i = 0; i < bombs.all; i++) {
        index = Math.floor(Math.random() * ((boardWidth * boardHeight) - 1));
        layer = Math.floor(Math.random() * (totalLayers - 1)) + 1;
        
        let maxAttempts = 100;
        while (getTileValue(layer, index) >= 100 && maxAttempts > 0) { // Ensure random location is not a bomb
            index = Math.floor(Math.random() * ((boardWidth * boardHeight) - 1));
            layer = Math.floor(Math.random() * (totalLayers - 1)) + 1;
            maxAttempts--;
        }

        const { x, y } = indexToCoordinates(index);
        increaseValue(layer, x, y, 100);
        bombs.layer[layer - 1] += 1;

        // Go through each tile around
        for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
            if (layer + offsetZ < 1 || layer + offsetZ > totalLayers) continue // Skip invalid layers

            for (let offsetX = -1; offsetX <= 1; offsetX++) {
                if (x + offsetX < 0 || x + offsetX >= boardWidth) continue // Skip invalid tiles

                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    if (y + offsetY < 0 || y + offsetY >= boardWidth) continue // Skip invalid tiles

                    increaseValue(layer + offsetZ, x + offsetX, y + offsetY);
                }
            }
        }
    }
}

function increaseValue(layer, x, y, value = 1) {
    boardData[layer - 1][y][x] += value;
}


function restartGame() {
    initializeGame();
}


function initializeGame() {
    loadSettingsFromCookie();
    setupGameVariables();
    mirrorHtmlToSettings();
    populateWithBombs();
    setupBoard();
    updateUI();
}

window.addEventListener('DOMContentLoaded', initializeGame);