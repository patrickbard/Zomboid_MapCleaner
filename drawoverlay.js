async function getFileArray(update = false) {
    let coords = [];

    try {
        if (!update) {
            directory = await window.showDirectoryPicker({
                startIn: 'desktop'
            });
        }

        let count = 0;

        for await (const entry of directory.values()) {
            if (entry.name.startsWith("map_")) {
                let currentCoord = getCoordFromMapName(entry.name);

                if (isNumeric(currentCoord.x)) {
                    coords.push(currentCoord)
                }
            }
        }
        return coords;
    } catch (e) {
        console.error(e);
    }
}

function CreateLineArray(coords) {
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

    coords.sort((a, b) => {
        return a.x - b.x;
    });

    for (let i = 0; i < coords.length; i++) {
        annotationName = coords[i].x + "-" + coords[i].y;
        currentCoordinate = coords[i];

        if (currentCoordinate.x == lastCoordinate.x && currentCoordinate.y == parseInt(lastCoordinate.y, 10) + 1) {
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

        lastCoordinate = new ChunkCoordinate(currentCoordinate.x, currentCoordinate.y);
    }

    return lineArray;
}

function LineArrayToRectanglesArray(lineArray) {
    let rectList = [];
    let lastLine;
    let newRect = {};
    let line = lineArray[0];
    let linesToSearch = lineArray.length;

    for (let i = 0; i < linesToSearch; i++) {
        if (!lastLine) {
            line = lineArray[0];
            newRect = new OverlayLine(line.startX, line.startY, line.endX, line.endY);
            lastLine = new OverlayLine(line.startX, line.startY, line.endX, line.endY);
        } else {
            let parsedLastLineStartX = parseInt(lastLine.startX, 10);
            let sameStartY = line.startY === lastLine.startY
            let sameEndY = line.endY === lastLine.endY

            if ((line.startX === (parsedLastLineStartX + 1)) && (sameStartY && sameEndY)) {
                newRect.endX = line.endX;
            } else if ((line.startX === (parsedLastLineStartX - 1)) && (sameStartY && sameEndY)) {
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
        sortByDistance(lineArray, {x: lastLine.startX, y: lastLine.startY});
        line = lineArray[0];
    }

    return rectList;
}

function drawRectangles(rectList) {
    let count = 0;
    
    for (let currentRect of rectList) {
        let w = (currentRect.endX - parseInt(currentRect.startX, 10) + 1) * 10;
        let h = (currentRect.endY - parseInt(currentRect.startY, 10) + 1) * 10;
        //console.log(`adding rect ${currentRect.startX},${currentRect.startY},${w},${h}`);
        addOverlay(viewer, count.toString(), currentRect.startX, currentRect.startY, w, h);
        count++;
    }
    //console.log("Rectangles drawn: " + rectList.length);
}
