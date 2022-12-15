let directory;

class ChunkCoordinate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class OverlayLine {
    constructor(startX, startY, endX, endY) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
    }
}

const FILE_TYPE_PREFIX = {
    MAP: "map_",
    CHUNK: "chunkdata_",
    ZOMBIE: "zpop_",
};

const FILE_TYPE_PREFIX_VALUES_ARRAY = Object.values(FILE_TYPE_PREFIX);

const getFileType = (val) => Object.entries(FILE_TYPE_PREFIX).find(([_, value]) => value === val)[0];

function makePZCoord(coord) {
    let roundedString = Math.floor(coord).toString();
    let newLength = roundedString.length - 1;

    return roundedString.slice(0, newLength)
}

function getCoordFromMapName(mapName) {
    mapName = mapName.replace("map_", "");
    mapName = mapName.replace(".bin", "");
    const array = mapName.split("_");

    return new ChunkCoordinate(array[0], array[1]);
}

function getCoordFromChunkOrZombieFileName(fileName, filetype) {
    fileName = fileName.replace(filetype, "");
    fileName = fileName.replace(".bin", "");
    const array = fileName.split("_");

    return new ChunkCoordinate(array[0] * 30, array[1] * 30);
}

function addOverlay(myViewer, annotationName, filetype, color, x, y, w, h) {
    let zoneOffset = 10
    let rect = myViewer.viewport.imageToViewportRectangle(x * zoneOffset, y * zoneOffset, w, h);
    let element = document.createElement("div");

    element.id = `${ filetype }${ annotationName }`;
    element.className = `${filetype}zone`;
    element.style.color = color;
    element.style.background = color;

    this.viewer.addOverlay(element, rect);
}

const sortByDistance = (coordinates, point) => {
    const sorter = (a, b) => distance(a, point) - distance(b, point);
    coordinates.sort(sorter);
};

const distance = (coordinate1, coordinate2) => {
    const x = coordinate2.x - coordinate1.startX;
    const y = coordinate2.y - coordinate1.startY;

    return Math.sqrt((x * x) + (y * y));
};

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function annotationCoordToPZCoord(annotationCoordinate) {
    annotationCoordinate = annotationCoordinate.replace("xywh=pixel:", "");
    const array = annotationCoordinate.split(",");

    let startX = parseInt(array[0].slice(0, array[0].indexOf(".") - 1), 10);
    let startY = parseInt(array[1].slice(0, array[1].indexOf(".") - 1), 10);

    let endX = startX + Math.floor(array[2].slice(0, array[2].indexOf(".")) / 10)
    let endY = startY + Math.floor(array[3].slice(0, array[3].indexOf(".")) / 10)

    return {startX: startX, startY: startY, endX: endX, endY: endY}
}

function coordinateToFileName(x, y, filetypePrefix) {
    if (getFileType(filetypePrefix) != null) {
        let cx = x;
        let cy = y;

        if (filetypePrefix === FILE_TYPE_PREFIX.CHUNK || filetypePrefix === FILE_TYPE_PREFIX.ZOMBIE) {
            cx = Math.floor(x / 30)
            cy = Math.floor(y / 30)
        }

        return `${ filetypePrefix }${ cx }_${ cy }.bin`;
    }
}

function toggleProgressbar(state, all = true) {
    let overlayElement = document.getElementById("overlay")
    let progressElements = document.getElementsByClassName("progress")

    if (state) {
        overlayElement.style.display = "block"
        
        if (!all) {
            for (const element of progressElements) {
                if (element.id !== "OverallProgress") {
                    element.style.display = "none"
                }
            }
        }

        let progressBarLegendElement = document.getElementById("OverallProgressBarLegend")
        progressBarLegendElement.innerText = "Loading...";
    } else {
        for (const element of progressElements) {
            element.style.display = ""
        }

        overlayElement.style.display = "none";
    }
}

function genericProgressBarUpdate(elementId, processed, total = 0, options) {
    let progressBarElement = document.getElementById(elementId)
    let progressBarLegendElement = document.getElementById(`${ elementId }Legend`)

    progressBarLegendElement.innerText = options.legend || "Processed";
    progressBarElement.innerText = `${processed}`
    progressBarElement.style.width = `100%`;

    if (total > 0) {
        let progress = Math.floor(processed / total * 100)
        progressBarElement.innerText = `${progress}%`
        progressBarElement.style.width = `${progress}%`;

        if (options) {
            progressBarElement.innerText = options.displayAsPercent
                ? options.messageFormat.format(progress)
                : options.messageFormat.format(processed, total);
        }
    }
}


function updateProgressBarWhenRemovingFiles(filesToCheck, filesChecked, areasToClear, areasCleared) {
    let optionsOverall = {
        legend: "Areas cleared",
        messageFormat: "{0}/{1}",
        displayAsPercent: false
    }
    let optionsCurrent = {
        legend: "Current Area",
        messageFormat: "{0}%",
        displayAsPercent: true
    }

    genericProgressBarUpdate("OverallProgressBar", areasCleared, areasToClear, optionsOverall)
    genericProgressBarUpdate("CurrentProgressBar", filesChecked, filesToCheck, optionsCurrent)
}

function updateProgressBarWhenLoadingFiles(filesToCheck, filesChecked) {
    let options = {
        legend: "Files read",
        messageFormat: "{0}/{1}",
        displayAsPercent: false
    }

    genericProgressBarUpdate("OverallProgressBar", filesToCheck, filesChecked, options)
}


function createRectanglesForSafehouses(safehousesText, margin = 0) {
    let lines = safehousesText.split(/\n/);
    let rectanglesArray = [];

    for (const line of lines) {
        let coordinates = line.split(/[xX,-\/\s]/);
        let startX = parseInt(coordinates[0])
        let startY = parseInt(coordinates[1])
        let endX = parseInt(coordinates[2])
        let endY = parseInt(coordinates[3])
        
        if (isNumeric(startX) && isNumeric(startY) && isNumeric(endX) && isNumeric(endY)) {
            let overlayLine = new OverlayLine(startX, startY, endX, endY);
            
            if (margin > 0) {
                overlayLine = new OverlayLine(startX-margin, startY-margin, endX+margin, endY+margin);
            }
            
            rectanglesArray.push(overlayLine);
        }
    }
    
    return rectanglesArray;
}

String.prototype.format = function() {
    let args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};
