window.zomify = {
    //required	
    type: "zoomifytileservice",
    width: 15000,
    height: 13500,
    tilesUrl: "openseadragon/mymap/"
};

window.viewer = OpenSeadragon({
    id: "openseadragon1",
    prefixUrl: "openseadragon/images/",
    tileSources: zomify,
    maxZoomLevel: 50,
    gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: true
    }
});

const positionEl = document.querySelectorAll('.position')[0];

viewer.addHandler('open', function () {

    var tracker = new OpenSeadragon.MouseTracker({
        element: viewer.container,
        moveHandler: function (event) {
            let webPoint = event.position;
            let viewportPoint = viewer.viewport.pointFromPixel(webPoint);
            let imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);
            let zoom = viewer.viewport.getZoom(true);
            let imageZoom = viewer.viewport.viewportToImageZoom(zoom);

            let zomboidX = makePZCoord(imagePoint.x);
            let zomboidY = makePZCoord(imagePoint.y);
            let zomboidChunkX = Math.floor(zomboidX / 30);
            let zomboidChunkY = Math.floor(zomboidY / 30);
            
            positionEl.innerHTML = `Location: ${ zomboidX },${ zomboidY } (Chunk: ${ zomboidChunkX },${ zomboidChunkY })`;
        }
    });

});


const config = {
    allowEmpty: true,
    disableEditor: true,
    drawOnSingleClick: true
};

const annotorious = OpenSeadragon.Annotorious(viewer, config);

//annotorious.loadAnnotations('annotations.w3c.json');
annotorious.allowEmpty = true;

annotorious.on('createAnnotation', function (a) {
    //console.info(a.target.selector.value)
});

annotorious.on('createSelection', function (a) {
    console.info(a.target.selector.value)
    annotorious.saveSelected()
});

annotorious.on('updateAnnotation', function (a) {
    //console.info(a.target.selector.value)
});
