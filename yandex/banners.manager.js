let yellow = document.createElement('div'),
    red = document.createElement('div'),

    widthYellow = 0,
    heigthYellow = 0,
    leftYellow = 0,
    topYellow = 0,

    widthRed = 0,
    heigthRed = 0,
    searchBlock = 0,
    refreshSeconds = 35000,
    updateScreenDelaySeconds = 2000;

let widthYellowPx = 0,
    heightYellowPx = 0,
    mainIntervalId = 0,
    resizeWindowTimeoutId = 0,
    testBannerMode = false;

const blockWidthError = 0,
    blockHeigthError = 0;

let windowInnerWidth = 0;
let windowInnerHeight = 0;

let availableBlocks = [
    { "x": 160, "y": 600 },
    { "x": 240, "y": 400 },
    { "x": 240, "y": 600 },
    { "x": 300, "y": 300 },
    { "x": 300, "y": 500 },
    { "x": 300, "y": 600 },
    { "x": 300, "y": 250 },
    { "x": 320, "y": 50 },
    { "x": 320, "y": 100 },
    { "x": 336, "y": 280 },
    { "x": 728, "y": 90 },
    { "x": 970, "y": 90 },
    { "x": 970, "y": 250 },
    { "x": 1000, "y": 120 },
    { "x": -1, "y": 90 },
    { "x": -1, "y": 120 },
    { "x": -1, "y": 180 },
    { "x": -1, "y": 200 },
    { "x": -1, "y": 250 }
]

function calculateYellowPosition(bannerData) {
    heigthYellow = bannerData.size.y * 100;
    widthYellow = bannerData.size.x * 100;
    topYellow = bannerData.position.y * 100;
    leftYellow = bannerData.position.x * 100;

    return leftYellow, topYellow, heigthYellow, widthYellow;
}

const modificationYellowZone = (width, heigth, top, left) => {
    yellow.className = 'yellow';
    yellow.style.cssText =
        `
        z-index: 99;
        pointer-events: none;
        overflow: hidden;
        position: absolute;
        ${testBannerMode == true ? "background-color: rgba(251, 255, 0, 0.5);" : ""}
        top: ${top}%;
        left: ${left}%;
        height: ${heigth}%; 
        width: ${width}%; 
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: center;
        -ms-flex-pack: center;
        justify-content: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;`;

    document.body.append(yellow);

    widthYellow = width;
    heigthYellow = heigth;

    return yellow;
}

const getBlockSize = (placeWidth, placeHeigth, availableBlocks) => {
    let blocks = [];
    for (let i = 0; i < availableBlocks.length; i++) {
        let block = availableBlocks[i];
        if ((placeWidth + blockWidthError >= block.x || block.y == -1)
            && placeHeigth + blockHeigthError >= block.y) {
            blocks.push(block);
        }
    }
    let index = -1;
    let maxScore = 0;
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].x == -1) {
            blocks[i].x = placeWidth;
        }
        if (blocks[i].x * blocks[i].y > maxScore) {
            index = i;
            maxScore = blocks[i].x * blocks[i].y;
        }
    }
    return index == -1 ? null : searchBlock = blocks[index];
}

const updateBanner = () => {
    var yellowElement = document.getElementById(yellow.id);
    if (yellowElement != null && yellowElement.style.display == "flex") {
        RTBrefresh(yellow.id, red.id);
    }
}


const RTBrefresh = (blockId, render) => {
    var renderElement = document.getElementById(render);
    if (renderElement != null && renderElement.style.display == "none")
        return;

    window.yaContextCb.push(() => {
        Ya.Context.AdvManager.render({
            renderTo: render,
            blockId: blockId.replace("yandex_rtb_", "")
        })
    });
}

const resizeParam = () => {
    windowInnerWidth = window.innerWidth;
    windowInnerHeight = window.innerHeight;
    widthYellowPx = windowInnerWidth * (widthYellow / 100),
        heightYellowPx = windowInnerHeight * (heigthYellow / 100);
}


const modificationRedZone = () => {
    if(testBannerMode == true)
        red.style.backgroundColor = "red";

    red.style.width = searchBlock.width + "px";
    red.style.height = searchBlock.height + "px";
    red.className = 'red';
    yellow.appendChild(red);
}

window.addEventListener('resize', function (event) {
    resizeParam();
    getBlockSize(widthYellowPx, heightYellowPx, availableBlocks);
    modificationRedZone();

    clearTimeout(resizeWindowTimeoutId);
    resizeWindowTimeoutId = setTimeout(updateBanner, 0 + updateScreenDelaySeconds);
    startMainInterval();
}, true);

const closeBanner = (bannerData) => {
    let close = document.getElementById(bannerData.id);
    if (close == null || close.style == null)
        return;

    close.style.display = 'none';
    clearInterval(mainIntervalId);
}

const addIdBlocks = (bannerId) => {
    red.id = `render_${bannerId.id}`;
    yellow.id = bannerId.id;
}

function startMainInterval()
{
    clearInterval(mainIntervalId);
    mainIntervalId = setInterval(updateBanner, 0 + refreshSeconds);
}

function ShowNativeBanner(request) {
    if (request == null || request.jsonData == null) return;
    let bannerData = JSON.parse(request.jsonData);

    if (bannerData) {
        testBannerMode = bannerData.testBannerMode;
        calculateYellowPosition(bannerData);
        addIdBlocks(bannerData);
        modificationYellowZone(widthYellow, heigthYellow, leftYellow, topYellow);
        resizeParam();
        getBlockSize(widthYellowPx, heightYellowPx, availableBlocks);
        modificationRedZone();
        updateBanner();
        startMainInterval();
    }
}

function HideNativeBanner(request) {
    if (request == null || request.jsonData == null) return;
    let bannerData = JSON.parse(request.jsonData);

    closeBanner(bannerData);
}