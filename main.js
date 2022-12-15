window.slider = new Slider('#safehouses-slider', {
    formatter: function(value) {
        return value;
    }
}).on('slide', reloadSafehouseOverlay);

function drawZones(coordinates, filetype = FILE_TYPE_PREFIX.MAP, color) {
    let lineArray = CreateLineArray(coordinates[filetype], filetype);
    let rectList = LineArrayToRectanglesArray(lineArray, filetype);
    drawRectangles(rectList, filetype, color);
}

function reloadSafehouseOverlay() {
    let text = getSafehousesTextarea().value;
    let marginValue = slider.getValue();

    Array.from(document.getElementsByClassName("safehouses_zone")).forEach((zoneElement) => {
        viewer.removeOverlay(zoneElement)
    })

    Array.from(document.getElementsByClassName("safehousesMargin_zone")).forEach((zoneElement) => {
        viewer.removeOverlay(zoneElement)
    })

    let reactArray = createRectanglesForSafehouses(text);
    let reactArrayWithMargin = createRectanglesForSafehouses(text, marginValue);
    
    window.safehousesAreas = reactArrayWithMargin;

    drawRectangles(reactArray, "safehouses_", "rgba(0,0,255,0.3)")
    drawRectangles(reactArrayWithMargin, "safehousesMargin_", "rgba(0,196,255,0.3)")

    console.log(reactArray)
}

function getSafehousesTextarea() {
    return document.getElementById("safehouses-text");
}

function saveSafehousesEdit() {
    let text = getSafehousesTextarea().value;
    localStorage.setItem("safehouses-text", text)
    reloadSafehouseOverlay()
}

function onSafehousesChange() {
    let text = getSafehousesTextarea().value;
    let coordinates = createRectanglesForSafehouses(text);
    document.getElementById("safehouses-preview").innerHTML = JSON.stringify(coordinates, null, 2) 
}

document.getElementById('setGameSaveFolder').addEventListener('click', async () => {
    toggleProgressbar(true, false);

    window.fileCoordinates = await getFileArray();
    drawZones(fileCoordinates, FILE_TYPE_PREFIX.MAP, "rgba(0, 255, 0, 0.25)");
    drawZones(fileCoordinates, FILE_TYPE_PREFIX.CHUNK, "rgba(255,213,0,0.25)");
    drawZones(fileCoordinates, FILE_TYPE_PREFIX.ZOMBIE, "rgba(232,0,0,0.25)");

    toggleProgressbar(false);
});

document.getElementById('setSafehouses').addEventListener('click', async () => {
    console.log("SAFE!!!");
    let oldSave = localStorage.getItem("safehouses-text");
    let textAreaElement = getSafehousesTextarea();

    if (oldSave) {
        textAreaElement.value = oldSave
        onSafehousesChange();
    }

    localStorage.setItem("safehouses-text", textAreaElement.value)
});

document.getElementById('ignoreAnnotationsCheckbox').addEventListener('click', async () => {
    let element = document.getElementById('ignoreAnnotationsCheckbox')
    let fieldset = document.getElementById('annotationsFieldset');

    fieldset.disabled = element.checked
});

Array.from(document.getElementsByClassName("zone-display-check")).forEach((zoneTypeElement) => {
    zoneTypeElement.addEventListener('click', async (event) => {
        console.log(event)
        console.log(zoneTypeElement.id)
        console.log(zoneTypeElement.checked)

        let filetype;
        let isSafehouse;

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
            case "check_Safehouses_show":
                isSafehouse = true;
                break;
        }

        if (isSafehouse) {
            toggleShowHideZone(`safehouses_zone`, zoneTypeElement.checked)
            toggleShowHideZone(`safehousesMargin_zone`, zoneTypeElement.checked)
        } else {
            toggleShowHideZone(`${filetype}zone`, zoneTypeElement.checked)
        }
    })
})

function toggleShowHideZone(zoneClass, shouldShow) {
    Array.from(document.getElementsByClassName(zoneClass)).forEach((zoneElement) => {
        zoneElement.style.display = shouldShow ? "" : "none";
    })
}

function hasFileCoordinate(x, y, filetype) {
    return window.fileCoordinates[filetype].some((coordinate) => coordinate.x == x && coordinate.y == y)
}

function hasCoordinate(x, y) {
    return FILE_TYPE_PREFIX_VALUES_ARRAY.some((filetype) => hasFileCoordinate(x, y, filetype))
}

async function deleteData(x, y, filetype) {
    try {
        // if (hasFileCoordinate(x, y, filetype)) {
            // console.log(`Found file ${fileName}`)
            // await new Promise(resolve => setTimeout(resolve, 10));
        let fileName = coordinateToFileName(x, y, filetype);
        await directory.removeEntry(fileName);
        // }
    } catch (e) {
        console.error(e);
    }
}

async function deleteMapData(x, y) {
    await deleteData(x, y, FILE_TYPE_PREFIX.MAP);
}

async function deleteChunkData(x, y) {
    console.log(`Deleting chunk data at ${x/30}x${y/30}`)
    await deleteData(x, y, FILE_TYPE_PREFIX.CHUNK);
}

async function deleteZombiePopulationData(x, y) {
    console.log(`Deleting zombie population at ${x/30}x${y/30}`)
    await deleteData(x, y, FILE_TYPE_PREFIX.ZOMBIE);
}

async function checkChunkToDelete(area,
                                  shouldDeleteMapData,
                                  shouldDeleteChunkData,
                                  shouldDeleteZombieData,
                                  shouldKeepSafehouses,
                                  safehousesAreas) {
    let lastChunkContainSafehouse;
    let lastChunkX = 0;
    let lastChunkY = 0;
    let verificationsChunk = 0;
    let verificationsZombie = 0;
    let chunksVerified = 0;
    let filesChecked = 0;

    // for (let i = area.startX; i <= area.endX; i += 30) {
    //     let chunkX = Math.floor(i / 30) * 30;
    //
    //     // Loop to take care of chunks
    //     for (let j = area.startY; j <= area.endY; j += 30) {
    //         let chunkY = Math.floor(j / 30) * 30;
    //         chunksVerified++;
    //
    //         if (!hasFileCoordinate(chunkX, chunkY, FILE_TYPE_PREFIX.CHUNK) && !hasFileCoordinate(chunkX, chunkY, FILE_TYPE_PREFIX.ZOMBIE)) {
    //             continue;
    //         }
    //
    //         console.log(`\nChunk ${ chunkX/30 }x${ chunkY/30 } exists\n`);
    //
    //         if (shouldKeepSafehouses) {
    //             if (lastChunkContainSafehouse && (chunkX == lastChunkX && chunkY == lastChunkY)) {
    //                 continue;
    //             }
    //
    //             let isChunkContainSafehouse = safehousesAreas.some((safehouse) => isChunkContainArea(chunkX, chunkY, safehouse));
    //             lastChunkContainSafehouse = isChunkContainSafehouse
    //
    //             if (isChunkContainSafehouse) {
    //                 lastChunkX = chunkX;
    //                 lastChunkY = chunkY;
    //                 continue;
    //             }
    //         }
    //
    //         try {
    //             if (chunkX > lastChunkX || chunkY > lastChunkY) {
    //                 if (shouldDeleteChunkData === true) {
    //                     await deleteChunkData(chunkX, chunkY);
    //                 }
    //                 if (shouldDeleteZombieData === true) {
    //                     await deleteZombiePopulationData(chunkX, chunkY)
    //                 }
    //
    //                 lastChunkX = chunkX;
    //                 lastChunkY = chunkY;
    //             }
    //         } catch (e) {
    //             console.error(e)
    //         }
    //     }
    // }

    if (shouldDeleteChunkData) {
        for (const coordinate of window.fileCoordinates[FILE_TYPE_PREFIX.CHUNK]) {
            verificationsChunk++
            if (isInsideArea(area, coordinate.x, coordinate.y)) {
                chunksVerified++;

                if (shouldKeepSafehouses) {
                    if (lastChunkContainSafehouse && (coordinate.x == lastChunkX && coordinate.y == lastChunkY)) {
                        continue;
                    }

                    let isChunkContainSafehouse = safehousesAreas.some((safehouse) => isChunkContainArea(coordinate.x, coordinate.y, safehouse));
                    lastChunkContainSafehouse = isChunkContainSafehouse

                    if (isChunkContainSafehouse) {
                        lastChunkX = coordinate.x;
                        lastChunkY = coordinate.y;
                        continue;
                    }
                }

                try {
                    await deleteChunkData(coordinate.x, coordinate.y);
                } catch (e) {
                    console.error(e)
                }
            }
        }
    }

    if (shouldDeleteZombieData) {
        for (const coordinate of window.fileCoordinates[FILE_TYPE_PREFIX.ZOMBIE]) {
            verificationsZombie++
            if (isInsideArea(area, coordinate.x, coordinate.y)) {
                filesChecked++;

                if (shouldKeepSafehouses) {
                    if (lastChunkContainSafehouse && (coordinate.x == lastChunkX && coordinate.y == lastChunkY)) {
                        continue;
                    }

                    let isChunkContainSafehouse = safehousesAreas.some((safehouse) => isChunkContainArea(coordinate.x, coordinate.y, safehouse));
                    lastChunkContainSafehouse = isChunkContainSafehouse

                    if (isChunkContainSafehouse) {
                        lastChunkX = coordinate.x;
                        lastChunkY = coordinate.y;
                        continue;
                    }
                }

                try {
                    await deleteZombiePopulationData(coordinate.x, coordinate.y);
                } catch (e) {
                    console.error(e)
                }
            }
        }
    }

    console.log(`verificationsChunk: ${verificationsChunk}`)
    console.log(`verificationsZombie: ${verificationsZombie}`)
    console.log(`chunksVerified: ${chunksVerified}`)
    console.log(`filesChecked: ${filesChecked}`)
}

async function checkMapToDelete(area,
                                shouldDeleteMapData,
                                shouldDeleteChunkData,
                                shouldDeleteZombieData,
                                shouldKeepSafehouses,
                                safehousesAreas,
                                areasToProcess,
                                currentAreaBeingProcessed) {
    let filesToCheck = window.fileCoordinates[FILE_TYPE_PREFIX.MAP].length
    let verifications = 0;
    let filesChecked = 0;

    // for (let i = area.startX; i <= area.endX; i++) {
    //     for (let j = area.startY; j <= area.endY; j++) {
    //         verifications++;
    //
    //         if (!hasFileCoordinate(i, j, FILE_TYPE_PREFIX.MAP)) {
    //             continue;
    //         }
    //
    //         filesChecked++;
    //
    //         if (shouldKeepSafehouses) {
    //             let isInsideSafehouse = safehousesAreas.some((safehouse) => isInsideArea(safehouse, i, j));
    //
    //             if (isInsideSafehouse) {
    //                 continue;
    //             }
    //         }
    //
    //         try {
    //             await deleteMapData(i, j);
    //         } catch (e) {
    //             console.error(e)
    //         }
    //     }
    //     updateProgressBarWhenRemovingFiles(filesToCheck, filesChecked, areasToProcess, currentAreaBeingProcessed)
    // }

    for (const coordinate of window.fileCoordinates[FILE_TYPE_PREFIX.MAP]) {
        verifications++
        if (isInsideArea(area, coordinate.x, coordinate.y)) {
            filesChecked++;

            if (shouldKeepSafehouses) {
                let isInsideSafehouse = safehousesAreas.some((safehouse) => isInsideArea(safehouse, coordinate.x, coordinate.y));

                if (isInsideSafehouse) {
                    continue;
                }
            }

            try {
                await deleteMapData(coordinate.x, coordinate.y);
            } catch (e) {
                console.error(e)
            }

            updateProgressBarWhenRemovingFiles(filesToCheck, filesChecked, areasToProcess, currentAreaBeingProcessed)
        }
    }

    console.log(`verifications: ${verifications}`)
    console.log(`filesChecked: ${filesChecked}`)
}

async function deleteDataInsideArea(area,
                                    shouldDeleteMapData,
                                    shouldDeleteChunkData,
                                    shouldDeleteZombieData,
                                    shouldKeepSafehouses,
                                    safehousesAreas,
                                    areasToProcess,
                                    currentAreaBeingProcessed) {
    let timeStart = performance.now();

    await checkChunkToDelete(area,
        shouldDeleteMapData,
        shouldDeleteChunkData,
        shouldDeleteZombieData,
        shouldKeepSafehouses,
        safehousesAreas);

    let timeEnd = performance.now();
    console.log(`checkChunkToDelete took ${timeEnd-timeStart}`)
    
    if (shouldDeleteMapData) {
        let timeStart = performance.now();

        await checkMapToDelete(area,
            shouldDeleteMapData,
            shouldDeleteChunkData,
            shouldDeleteZombieData,
            shouldKeepSafehouses,
            safehousesAreas,
            areasToProcess,
            currentAreaBeingProcessed);

        let timeEnd = performance.now();
        console.log(`checkMapToDelete took ${timeEnd-timeStart}`)
    }
}

async function deleteDataInsideAnnotations(annotationsList,
                                           shouldDeleteMapData,
                                           shouldDeleteChunkData,
                                           shouldDeleteZombieData,
                                           shouldKeepSafehouses,
                                           safehousesAreas,
                                           areasToProcess,
                                           currentAreaBeingProcessed) {
    console.log(`Will delete data for ${annotationsList.length} annotations`)

    for (let an of annotationsList) {
        let area = annotationCoordToPZCoord(an.target.selector.value)

        await deleteDataInsideArea(area,
                                   shouldDeleteMapData,
                                   shouldDeleteChunkData,
                                   shouldDeleteZombieData,
                                   shouldKeepSafehouses,
                                   safehousesAreas,
                                   areasToProcess,
                                   currentAreaBeingProcessed);

        console.log("Finished deleting data for this annotation")
        currentAreaBeingProcessed++;
    }

    console.log("Finished deleting data for all annotations")
}

function isInsideArea(area, x, y) {
    let checkForX = x >= area.startX && x <= area.endX;
    let checkForY = y >= area.startY && y <= area.endY;

    return checkForX && checkForY
}

function isChunkContainArea(chunkStartX, chunkStartY, area) {
    let chunkArea = new OverlayLine(chunkStartX, chunkStartY, chunkStartX + 30, chunkStartY + 30)

    let checkForX = chunkArea.startX < area.endX && chunkArea.endX > area.startX;
    let checkForY = chunkArea.startY < area.endY && chunkArea.endY > area.startY;

    return checkForX && checkForY;
}

document.getElementById('test').addEventListener('click', async () => {
    let annotationsList = annotorious.getAnnotations();

    let shouldKeepSafehouses = document.getElementById('keepSafehousesCheckbox').checked;
    let shouldIgnoreAnnotations = document.getElementById('ignoreAnnotationsCheckbox').checked;
    let shouldAnnotationsKeepData = document.getElementById('annotationsKeepRadio').checked;
    let shouldAnnotationsDeleteData = document.getElementById('annotationsDeleteRadio').checked;

    let shouldDeleteMapData = document.getElementById('chk_Mapdata').checked;
    let shouldDeleteChunkData = document.getElementById('chk_Chunkdata').checked;
    let shouldDeleteZPopData = document.getElementById('chk_ZpopData').checked;

    if (shouldDeleteMapData == false && shouldDeleteChunkData == false && shouldDeleteZPopData == false) {
        alert("Select at least one filetype to Delete")
        return
    }

    toggleProgressbar(true);
    let currentAreaBeingProcessed = 1;
    let areasToProcess = annotationsList.length;

    if (shouldIgnoreAnnotations) {
        let wholeMapArea = new OverlayLine(-500, -500, 2200, 2000);
        await deleteDataInsideArea(wholeMapArea,
                                   shouldDeleteMapData,
                                   shouldDeleteChunkData,
                                   shouldDeleteZPopData,
                                   shouldKeepSafehouses,
                                   window.safehousesAreas,
                                   areasToProcess,
                                   currentAreaBeingProcessed)
    } else {
        if (shouldAnnotationsKeepData) {
            if (shouldKeepSafehouses) {
                console.log("[1] Considering annotations, annotations keep data, keeping safehouses")
            } else {
                console.log("[1] Considering annotations, annotations keep data, not keeping safehouses")
            }
        } else if (shouldAnnotationsDeleteData) {
            await deleteDataInsideAnnotations(
                    annotationsList,
                    shouldDeleteMapData,
                    shouldDeleteChunkData,
                    shouldDeleteZPopData,
                    shouldKeepSafehouses,
                    window.safehousesAreas,
                    areasToProcess,
                    currentAreaBeingProcessed);
        }
    }

    window.fileCoordinates = await getFileArray(true);
    viewer.clearOverlays();
    annotorious.clearAnnotations();

    drawZones(fileCoordinates, FILE_TYPE_PREFIX.MAP, "rgba(0, 255, 0, 0.25)");
    drawZones(fileCoordinates, FILE_TYPE_PREFIX.CHUNK, "rgba(255,213,0,0.25)");
    drawZones(fileCoordinates, FILE_TYPE_PREFIX.ZOMBIE, "rgba(232,0,0,0.25)");

    toggleProgressbar(false);
});
