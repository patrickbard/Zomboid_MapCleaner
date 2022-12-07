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

    maxZoomLevel: 50
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

            positionEl.innerHTML = 'Location: ' + makePZCoord(imagePoint.x) + ',' + makePZCoord(imagePoint.y);
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

annotorious.on('updateAnnotation', function (a) {
    //console.info(a.target.selector.value)
});
