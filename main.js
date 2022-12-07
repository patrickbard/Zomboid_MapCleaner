document.getElementById('addToFolder').addEventListener('click', async () => {
    toggleProgressbar(true, false);

    let coordinates = await getFileArray();
    let lineArray = CreateLineArray(coordinates);
    let rectList = LineArrayToRectanglesArray(lineArray);
    drawRectangles(rectList);

    toggleProgressbar(false);
});

document.getElementById('test').addEventListener('click', async () => {
    let annotationsList = annotorious.getAnnotations();

    let deleteMapData = document.getElementById('chk_Mapdata').checked;
    let deleteChunkData = document.getElementById('chk_Chunkdata').checked;
    let deleteZPopData = document.getElementById('chk_ZpopData').checked;

    if (deleteMapData == false && deleteChunkData == false && deleteZPopData == false) {
        alert("Select at least one filetype to Delete")
        return
    }

    toggleProgressbar(true);
    let currentAreaBeingCleared = 1;
    let areasToClear = annotationsList.length;

    for (let an of annotationsList) {
        let rectInfo = annotationCoordToPZCoord(an.target.selector.value)
        let filesToCheck = (rectInfo.endX - rectInfo.startX) * (rectInfo.endY - rectInfo.startY) + 1
        let filesChecked = 0;

        for (let i = rectInfo.startX; i < rectInfo.endX; i++) {
            for (let j = rectInfo.startY; j < rectInfo.endY; j++) {
                filesChecked++;
                try {
                    if (deleteMapData == true) {
                        try {
                            await directory.removeEntry(coordinateToFileName(i, j, "M"));
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    if (deleteChunkData == true) {
                        try {
                            await directory.removeEntry(coordinateToFileName(i, j, "C"));
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    if (deleteZPopData == true) {
                        try {
                            await directory.removeEntry(coordinateToFileName(i, j, "Z"));
                        } catch (e) {
                            console.error(e);
                        }
                    }
                } catch (e) {
                    console.error(e)
                }
            }
            updateProgressBarWhenRemovingFiles(filesToCheck, filesChecked, areasToClear, currentAreaBeingCleared)
        }
        currentAreaBeingCleared++;
    }

    let coordinates = await getFileArray(true);
    viewer.clearOverlays();
    let lineArray = CreateLineArray(coordinates);
    let rectList = LineArrayToRectanglesArray(lineArray);

    drawRectangles(rectList);
    toggleProgressbar(false);
});
