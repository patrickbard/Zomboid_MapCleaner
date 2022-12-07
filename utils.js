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

function addOverlay(myViewer, annotationName, x, y, w, h) {
    let rect = myViewer.viewport.imageToViewportRectangle(x * 10, y * 10, w, h);
    let element = document.createElement("div");

    element.id = annotationName;
    element.style.color = "rgba(0, 255, 0, 0.25)";
    element.style.background = "rgba(0, 255, 0, 0.25)";

    this.viewer.addOverlay(element, rect);
    //console.log("ADDED OVERLAY")
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

function coordinateToFileName(x, y, filetype) {
    if (filetype == "M") {
        return "map_" + x + "_" + y + ".bin";
    } else if (filetype == "C") {
        let cx = Math.floor(x / 30)
        let cy = Math.floor(y / 30)
        return "chunkdata_" + cx + "_" + cy + ".bin";
    } else if (filetype == "Z") {
        let cx = Math.floor(x / 30)
        let cy = Math.floor(y / 30)
        return "zpop_" + cx + "_" + cy + ".bin";
    }
}

function toggleProgressbar(state) {
    if (state) {
        document.getElementById("overlay").style.display = "block";
        //document.getElementById("wrapper").classList.remove("d-none");
    } else {
        document.getElementById("overlay").style.display = "none";
        //document.getElementById("wrapper").classList.add("d-none");
    }
}

function updateProgressBar(FilesToCheck, filesChecked, AreasToClear, areasCleared) {
    CurrentProgress = Math.floor(filesChecked / FilesToCheck * 100)
    MainProgress = Math.floor(areasCleared / AreasToClear * 100)
    MainProgressbar = document.getElementById("OverallprogressBar")
    CurrentprogressBar = document.getElementById("CurrentprogressBar")
    MainProgressbar.innerText = "Areas cleared " + areasCleared + "/" + AreasToClear;
    CurrentprogressBar.innerText = "Current Area " + CurrentProgress + "%";
    CurrentprogressBar.style.width = CurrentProgress + "%";
    MainProgressbar.style.width = MainProgress + "%";
}
