async function getFileArray(update = false) {
    let coords = {
        [FILE_TYPE_PREFIX.MAP]: [],
        [FILE_TYPE_PREFIX.CHUNK]: [],
        [FILE_TYPE_PREFIX.ZOMBIE]: []
    };

    try {
        if (!update) {
            directory = await window.showDirectoryPicker({
                startIn: 'desktop'
            });
        }

        viewer.clearOverlays();
        annotorious.clearAnnotations();

        let count = 0;
        for await (const entry of directory.values()) {
            if (entry.name.startsWith(FILE_TYPE_PREFIX.MAP)) {
                let currentCoord = getCoordFromMapName(entry.name);

                if (isNumeric(currentCoord.x)) {
                    coords[FILE_TYPE_PREFIX.MAP].push(currentCoord)
                }
            }

            if (entry.name.startsWith(FILE_TYPE_PREFIX.CHUNK)) {
                let currentCoord = getCoordFromChunkOrZombieFileName(entry.name, FILE_TYPE_PREFIX.CHUNK);

                if (isNumeric(currentCoord.x)) {
                    coords[FILE_TYPE_PREFIX.CHUNK].push(currentCoord)
                }
            }

            if (entry.name.startsWith(FILE_TYPE_PREFIX.ZOMBIE)) {
                let currentCoord = getCoordFromChunkOrZombieFileName(entry.name, FILE_TYPE_PREFIX.ZOMBIE);

                if (isNumeric(currentCoord.x)) {
                    coords[FILE_TYPE_PREFIX.ZOMBIE].push(currentCoord)
                }
            }
            count++;

            updateProgressBarWhenLoadingFiles(count)
        }

        return coords;
    } catch (e) {
        console.error(e);
        toggleProgressbar(false);
    }
}

function CreateLineArray(coords, filetype) {
    let lineArray = [];
    let lastCoordinate = new ChunkCoordinate(0, 0);
    let currentCoordinate = new ChunkCoordinate(0, 0);
    let w = 0;
    let h = 0
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let annotationName = "";
    let coordinateGap = (filetype === FILE_TYPE_PREFIX.CHUNK || filetype === FILE_TYPE_PREFIX.ZOMBIE) ? 30 : 1

    coords.sort((a, b) => {
        return a.x - b.x;
    });

    for (let i = 0; i < coords.length; i++) {
        annotationName = coords[i].x + "-" + coords[i].y;
        currentCoordinate = coords[i];

        if (currentCoordinate.x == lastCoordinate.x && currentCoordinate.y == parseInt(lastCoordinate.y, 10) + coordinateGap) {
            h = h + 10;
            endX = currentCoordinate.x;
            endY = currentCoordinate.y;
        } else if (startX <= 0) {
            startX = currentCoordinate.x;
            startY = currentCoordinate.y;
            endX = currentCoordinate.x;
            endY = currentCoordinate.y;
        } else {
            lineArray.push(new OverlayLine(startX, startY, endX, endY));
            startX = currentCoordinate.x;
            startY = currentCoordinate.y;
            endX = currentCoordinate.x;
            endY = currentCoordinate.y;
        }
        
        if (i === coords.length-1) {
            lineArray.push(new OverlayLine(startX, startY, endX, endY));
        }

        lastCoordinate = new ChunkCoordinate(currentCoordinate.x, currentCoordinate.y);
    }

    return lineArray;
}

function LineArrayToRectanglesArray(lineArray, filetype) {
    let rectList = [];
    let lastLine;
    let newRect = {};
    let line = lineArray[0];
    let linesToSearch = lineArray.length;
    let coordinateGap = (filetype === FILE_TYPE_PREFIX.CHUNK || filetype === FILE_TYPE_PREFIX.ZOMBIE) ? 30 : 1

    for (let i = 0; i < linesToSearch; i++) {
        if (!lastLine) {
            line = lineArray[0];
            newRect = new OverlayLine(line.startX, line.startY, line.endX, line.endY);
            lastLine = new OverlayLine(line.startX, line.startY, line.endX, line.endY);
        } else {
            let parsedLastLineStartX = parseInt(lastLine.startX, 10);
            let sameStartY = line.startY === lastLine.startY
            let sameEndY = line.endY === lastLine.endY

            if ((line.startX == (parsedLastLineStartX + coordinateGap)) && (sameStartY && sameEndY)) {
                newRect.endX = line.endX;
            } else if ((line.startX == (parsedLastLineStartX - coordinateGap)) && (sameStartY && sameEndY)) {
                newRect.startX = line.startX;
            } else {
                rectList.push(new OverlayLine(newRect.startX, newRect.startY, newRect.endX, newRect.endY));

                newRect.startX = line.startX;
                newRect.startY = line.startY;
                newRect.endX = line.endX;
                newRect.endY = line.endY;
            }
        }

        lastLine.startX = line.startX;
        lastLine.startY = line.startY;
        lastLine.endX = line.endX;
        lastLine.endY = line.endY;

        lineArray.shift();
        
        if (lineArray.length === 0) {
            rectList.push(new OverlayLine(newRect.startX, newRect.startY, newRect.endX, newRect.endY));
        }
        
        sortByDistance(lineArray, {x: lastLine.startX, y: lastLine.startY});
        line = lineArray[0];
    }

    return rectList;
}

function drawRectangles(rectList, filetype, color) {
    let count = 0;
    let zoneSize = (filetype === FILE_TYPE_PREFIX.CHUNK || filetype === FILE_TYPE_PREFIX.ZOMBIE) ? 30 : 1

    for (let currentRect of rectList) {
        let w = (currentRect.endX - parseInt(currentRect.startX, 10) + (zoneSize)) * 10;
        let h = (currentRect.endY - parseInt(currentRect.startY, 10) + (zoneSize)) * 10;
        addOverlay(viewer, count.toString(), filetype, color, currentRect.startX, currentRect.startY, w, h);
        count++;
    }

    console.log("Rectangles drawn: " + rectList.length);
}
