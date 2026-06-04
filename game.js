const totalLayers = 3;
let currentLayer = 1;
let boardWidth = 5;
let boardHeight = 5;

let bombs = {
    all: 5,
    layer: Array.from({ length: totalLayers }, () => 0),
    revealed: {
        all: 0,
        layer: Array.from({ length: totalLayers }, () => 0)
    }
};

let boardData = Array.from({ length: totalLayers }, () => Array.from({ length: boardHeight }, () => Array.from({ length: boardWidth }, () => 0)));
let openTiles = Array.from({ length: totalLayers }, () => []); // Create empty arrays for each layer to track opened tiles

let flags = {
    total: {
        all: 0,
        layer: Array.from({ length: totalLayers }, () => 0)
    },
    layer: Array.from({ length: totalLayers }, () => []) // Create empty arrays for each layer to track flagged tiles
};

function updateUI() {
    updateLayerDisplay();
    updateBombDisplay();
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

    bombAmountElement.textContent = `${bombs.all - flags.total.all - bombs.revealed.all} (${bombs.layer[currentLayer - 1] - flags.total.layer[currentLayer - 1] - bombs.revealed.layer[currentLayer - 1]})`;
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
    const mineToggleRadio = document.getElementById('flag-toggle-mine');
    if (mineToggleRadio && mineToggleRadio.checked) {
        mineGrass(index);
    } else {
        placeFlag(index);
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
        //TODO: Handle mine click
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
        upperTileContent = isTileOpen(currentLayer + 1, i) || isTileFlagged(currentLayer + 1, i) ? getTileContent(i, currentLayer + 1, '-') : '?';
        lowerTileContent = isTileOpen(currentLayer - 1, i) || isTileFlagged(currentLayer - 1, i) ? getTileContent(i, currentLayer - 1, '-') : '?';

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
        while (getTileValue(layer, index) >= 100) { // Ensure random location is not a bomb
            index = Math.floor(Math.random() * ((boardWidth * boardHeight) - 1));
            layer = Math.floor(Math.random() * (totalLayers - 1)) + 1;
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

function initializeGame() {
    populateWithBombs();
    setupBoard();
    updateUI();
}

window.addEventListener('DOMContentLoaded', initializeGame);