var IsMobilePlatform = false;

let cachedConfigFile = null;
let configUrl = '';
var showedRewardVideo = false;
var environment = {
    appId: "",
    payload: "",
    screen: {
        isFullscreen: false,
        orientation: {
            value: "",          // portrait, landscape
            isLock: false
        }
    },
    deviceInfo: {
        isTv: false,
        isTable: false,
        isMobile: false,
        isDesktop: false,
        deviceType: ""          // desktop, mobile, tablet, tv
    },
    browser: {
        languageCode: "",       // ru, en, tr and more...
        topLevelDomain: ""
    }
};
environment.browser.languageCode = navigator.language || navigator.userLanguage;

// Localization
var enabledDefaultLanguage = false;
var defaultLanguageCode = "en";

// Config
function LoadConfig(successCallback, errorCallback)
{
    if(configUrl == null || configUrl == "")
    {
        cachedConfigFile = "";
        if(successCallback != null)
            successCallback("");
        return;
    }
    
    if(cachedConfigFile != null)
    {
        successCallback(cachedConfigFile);
        return;
    }
    LoadStringFromUrl(configUrl, successCallback, errorCallback);
}

function CacheLoadedConfig(json)
{
    cachedConfigFile = json;
    console.log(cachedConfigFile);
}

function GetCachedGameConfig()
{
    return cachedConfigFile;
}

LoadConfig(CacheLoadedConfig);

function GetLoadingScreenLocalization()
{
    let langugages = [
        {
            lang: 'en',
            value: 'Loading'
        },
        {
            lang: 'ru',
            value: 'Загрузка'
        },
        {
            lang: 'tr',
            value: 'Yükleniyor'
        },
    ];

    var languageCode = GetLanguageCode();
    if(languageCode == null)
    {
        return {
            lang: '',
            value: ''
        }
    }
    let translated = langugages.find(lang => lang.lang == languageCode);
    if(translated == null)
        translated = langugages[0];
    return translated;
}

function SendSuccessMessage(request, parameters)
{
    if(request == null) return;
    BaseSendMessage(request.gameObjectName, request.successMethodName, parameters);
}

function SendFailedMessage(request, parameters)
{
    if(request == null) return;
    BaseSendMessage(request.gameObjectName, request.failedMethodName, JSON.stringify(parameters));
}

function SendClosedMessage(request)
{
    if(request == null) return;
    BaseSendMessage(request.gameObjectName, request.closedMethodName);
}


function BaseSendMessage(gameObjectName, functionName, parameters)
{
    if(unityInstance == null) return;
    if(parameters != null)
    {
        unityInstance.SendMessage(gameObjectName, functionName, parameters);
        return;
    }
    unityInstance.SendMessage(gameObjectName, functionName);
}

function WebRequestToObject(reqeust)
{
    return JSON.parse(reqeust);
}


window.onfocus = function()
{
    if(showedRewardVideo == true)
        return;

    SetFocusOnApp(true);
};

window.onblur = function()
{
    SetFocusOnApp(false);
};

function SetFocusOnApp(isFocus)
{
    BaseSendMessage('GameServices', 'FocusMode', isFocus == true ? 1 : 0);
}

function setElementByIdStyleType(id, type)
{
    var element = document.getElementById(id);
    if(element == null) return;
    if(element.style == null) return;
    element.style.display=type;
}

function GetEnvironmentJson()
{
    return JSON.stringify(environment);
}
