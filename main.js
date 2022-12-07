function drawZones(coordinates, filetype = FILE_TYPE_PREFIX.MAP, color) {
    let lineArray = CreateLineArray(coordinates[filetype], filetype);
    let rectList = LineArrayToRectanglesArray(lineArray, filetype);
    drawRectangles(rectList, filetype, color);
}

document.getElementById('addToFolder').addEventListener('click', async () => {
    toggleProgressbar(true, false);

    let coordinates = await getFileArray();
    drawZones(coordinates, FILE_TYPE_PREFIX.MAP, "rgba(0, 255, 0, 0.25)");
    drawZones(coordinates, FILE_TYPE_PREFIX.CHUNK, "rgba(255,213,0,0.25)");
    drawZones(coordinates, FILE_TYPE_PREFIX.ZOMBIE, "rgba(232,0,0,0.25)");

    toggleProgressbar(false);
});

Array.from(document.getElementsByClassName("zone-display-check")).forEach((zoneTypeElement) => {
    zoneTypeElement.addEventListener('click', async (event) => {
        console.log(event)
        console.log(zoneTypeElement.id)
        console.log(zoneTypeElement.checked)

        let filetype;

        switch (zoneTypeElement.id) {
            case "check_Mapdata_show":
                filetype = FILE_TYPE_PREFIX.MAP
                break;
            case "check_Chunkdata_show":
                filetype = FILE_TYPE_PREFIX.CHUNK
                break;
            case "check_ZpopData_show":
                filetype = FILE_TYPE_PREFIX.ZOMBIE
                break;
        }

        Array.from(document.getElementsByClassName(`${filetype}zone`)).forEach((zoneElement) => {
            zoneElement.style.display = zoneTypeElement.checked ? "" : "none";
        })
    })
})


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
                            await directory.removeEntry(coordinateToFileName(i, j, FILE_TYPE_PREFIX.MAP));
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    if (deleteChunkData == true) {
                        try {
                            await directory.removeEntry(coordinateToFileName(i, j, FILE_TYPE_PREFIX.CHUNK));
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    if (deleteZPopData == true) {
                        try {
                            await directory.removeEntry(coordinateToFileName(i, j, FILE_TYPE_PREFIX.ZOMBIE));
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
    annotorious.clearAnnotations();

    drawZones(coordinates, FILE_TYPE_PREFIX.MAP, "rgba(0, 255, 0, 0.25)");
    drawZones(coordinates, FILE_TYPE_PREFIX.CHUNK, "rgba(255,213,0,0.25)");
    drawZones(coordinates, FILE_TYPE_PREFIX.ZOMBIE, "rgba(232,0,0,0.25)");

    toggleProgressbar(false);
});
