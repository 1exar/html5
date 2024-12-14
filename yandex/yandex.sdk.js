const enums = {
    BANNER_POS: {
        Top: 'Top',
        Bottom: 'Bottom',
        Left: 'Left',
        Right: 'Right',
        Center: 'Center',
        Fullscreen: 'Fullscreen'
    },
    MESSAGES : {
        NotInitPurchases: 'Purchases uninitialized!',
        UserNotLogged: 'The user is not logged in',
        LeaderboardsNotInit: 'Leaderboards not initialized'
    }
}

var sdk = null;
var player = null;
var payments = null;
var locStorage = null;
var leaderboards = null;

let yandexSdkInitializing = false;
let onInitializedCallbacks = [];

function StartPage()
{
    for(var key in enums.BANNER_POS)
    {
        try
        {
            document.getElementById(enums.BANNER_POS[key]).style.display='none';
        }
        catch (error) { }
    }
}

// Init Yandex SKD
function InitializeYandexGamesSdk()
{
    FetchYandexSDK(() => {
        console.log('--Success callback grom initialize YANDEX SDK')
    });
}

function FetchYandexSDK(callback)
{
    if (sdk != null)
    {
        callback();
        return;
    }

    if (callback != null)
    {
        onInitializedCallbacks.push(callback);
    }

    if (yandexSdkInitializing == true)
        return

    yandexSdkInitializing = true;
    YaGames.init()
        .then(_sdk => {
            sdk = _sdk;
            sdk.onEvent(sdk.EVENTS.HISTORY_BACK, () => BaseSendMessage('YandexEnvironmentManager', 'CallBack'));

            yandexSdkInitializing = false;

            onInitializedCallbacks.forEach(callback => callback());
            onInitializedCallbacks = [];

            YandexShowFullscrenAd();
            console.log("Initialized Yandex SDK");
        })
        .catch(console.log);
}

// User Authorization
function YandexAuthorizationUser(request)
{
    FetchYandexSDK(() => {
        console.log('---Fetched YANDEX SDK FROM GET USER')
        sdk.getPlayer({ scopes: JSON.parse(request.jsonData.toLowerCase()) }).then(_player =>
        {
            player = _player;
            SendSuccessMessage(request);
        }).catch(err =>
        {
            player = null;
            SendFailedMessage(request, JSON.stringify(err));
        });
    });
}

function initPlayer() {
    return sdk.getPlayer().then(_player => {
        player = _player;
        return player;
    });
}

function YandexShowAuthorizationDialog(request)
{
    FetchYandexSDK(() => {
        initPlayer().then(_player =>
        {
            if (_player.getMode() === 'lite')
            {
                sdk.auth.openAuthDialog().then(() =>
                {
                    initPlayer()
                        .then(() =>
                        {
                            SendSuccessMessage(request);
                        })
                        .catch(err =>
                        {
                            SendFailedMessage(request, 'Player is not authorized.');
                        });
                }).catch(err =>
                {
                    SendFailedMessage(request, 'Player is not authorized.');
                });

                return;
            }

            SendSuccessMessage(request);
        }).catch(err =>
        {
            SendFailedMessage(request, 'Player is not authorized.');
        });
    });
}

// Purchases
function YandexInitializePurchases(request)
{
    sdk.getPayments({ signed: request.jsonData }).then(_payments =>
    {
        payments = _payments;
        SendSuccessMessage(request);
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

function YandexPurchase(request)
{
    if(payments == null)
    {
        SendFailedMessage(request, enums.MESSAGES.NotInitPurchases);
        return;
    }
    window.onblur();
    payments.purchase({ id: request.jsonData }).then(purchase =>
    {
        SendSuccessMessage(request);
    }).catch(err =>
    {
        console.log(JSON.stringify(request));
        SendFailedMessage(request, err);
        window.onfocus();
    })
}

function YandexGetPurchasedProducts(request)
{
    if(payments == null)
    {
        SendFailedMessage(request, enums.MESSAGES.NotInitPurchases);
        return;
    }
    payments.getPurchases().then(purchases =>
    {
        SendSuccessMessage(request,  JSON.stringify({ products: purchases }));
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    })
}

function YandexGetPurchaseCatalog(request)
{
    if(payments == null)
    {
        SendFailedMessage(request, enums.MESSAGES.NotInitPurchases);
        return;
    }
    payments.getCatalog().then(products =>
    {
        SendSuccessMessage(request,  JSON.stringify({ products: products }));
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

const showInterstitialEvent = "ShowInterstitial";
const showRewardVideoEvent = "ShowRewardVideo";
var showedInterstitial = 0;
var getRewardedCount = 0;


// Ads
let showInterstitialRequest = null;
function YandexShowInterstitialAd(request)
{
    showInterstitialRequest = request;
    YandexShowFullscrenAd();
}

function YandexShowFullscrenAd()
{
    if(sdk == null || sdk.adv == null)
        return;

    sdk.adv.showFullscreenAdv({
        callbacks: {
            onOpen: function()
            {
                SendSuccessMessage(showInterstitialRequest);
                showedInterstitial++;
                sendEventToMetrika(`${showInterstitialEvent}${showedInterstitial}`);
            },
            onClose: function(wasShown)
            {
                SendClosedMessage(showInterstitialRequest);
            },
            onError: function(err)
            {
                var errorMessage = '-YaSDK: Failed show Yandex fullscreen ad: '+err;
                SendFailedMessage(showInterstitialRequest, errorMessage);
                showInterstitialRequest = null;
            }
        }
    })
}

let rewardRequest = null;
function YandexShowRewardVideo(request)
{
    if(rewardRequest != null || showedRewardVideo == true)
    {
        console.log('-It is not possible to show the video ad block for the reward yet, since it is already being shown.');
        return;
    }

    rewardRequest = request;
    if(sdk == null || sdk.adv == null)
    {
        FailedShowRewardVideo('-sdk or sdk.adv equal of null!');
        return;
    }

    sdk.adv.showRewardedVideo({
        callbacks: { onOpen: () =>
            {
                showedRewardVideo = true;
            },
            onRewarded: () =>
            {
                SendSuccessMessage(rewardRequest);
                getRewardedCount++;
                sendEventToMetrika(`${showRewardVideoEvent}${getRewardedCount}`);
            },
            onClose: () => {
                SendClosedMessage(rewardRequest);
                showedRewardVideo = false;
                rewardRequest = null;
            },
            onError: (err) => {
                FailedShowRewardVideo('-Reward video: failed show reward video. ' + err);
            }
        }
    })
}

function FailedShowRewardVideo(errorMessage)
{
    var errorMessage = '-Reward video: failed show reward video. ' + err;
    SendFailedMessage(rewardRequest, errorMessage);

    showedRewardVideo = false;
    rewardRequest = null;
}

function YandexShowBanner(request)
{
    if(request == null || request.jsonData == null)
    {
        SendFailedMessage(request, '-Failed show banner block. Request equal of null.');
        return;
    }

    ShowNativeBanner(request);

    var bannerData = JSON.parse(request.jsonData);
    if (document.getElementById(bannerData.id).style.display == "flex")
    {
        SendSuccessMessage(request);
        return;
    }
    SendFailedMessage(request, `-Banner is not showed: ${bannerData.id}`);
}

function YandexHideBanner(request)
{
    if(request == null || request.jsonData == null)
    {
        SendFailedMessage(request, '-Failed show banner block. Request equal of null.');
        return;
    }

    HideNativeBanner(request);

    var bannerData = JSON.parse(request.jsonData);
    var bannerdElement = document.getElementById(bannerData.id);
    if (bannerdElement != null || bannerdElement.style != null || bannerdElement.style.display == "none")
    {
        SendSuccessMessage(request);
        return;
    }
    SendFailedMessage(request, `-Banner is not hided: ${bannerData.id}`);
}

function YandexShowStickyBanner()
{
    sdk.adv.showBannerAdv();
}

function YandexHideStickyBanner()
{
    sdk.adv.hideBannerAdv();
}

// Storage
function YandexGetData(request)
{
    if(player == null)
    {
        SendFailedMessage(request, enums.MESSAGES.UserNotLogged);
        return;
    }
    var requestData = JSON.parse(request.jsonData);
    player.getData(requestData.keys).then(data =>
    {
        var result = GetKeysValuesArrays(data);
        SendSuccessMessage(request, JSON.stringify(result));
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

function YandexSetData(request)
{
    if(player == null)
    {
        SendFailedMessage(request, enums.MESSAGES.UserNotLogged);
        return;
    }
    var data = KeysValuesToObject(JSON.parse(request.jsonData));
    player.setData(data).then(() => //(data, true)
    {
        SendSuccessMessage(request);
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

function YandexSetStats(request)
{
    if(player == null)
    {
        SendFailedMessage(request, enums.MESSAGES.UserNotLogged);
        return;
    }
    var stats = KeysValuesToObject(JSON.parse(request.jsonData));
    player.setStats(stats).then(() =>
    {
        SendSuccessMessage(request);
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

function YandexGetStats(request)
{
    if(player == null)
    {
        SendFailedMessage(request, enums.MESSAGES.UserNotLogged);
        return;
    }
    var requestData = JSON.parse(request.jsonData);
    player.getStats(requestData.keys).then(stats =>
    {
        var result = GetKeysValuesArrays(stats);
        SendSuccessMessage(request, JSON.stringify(result));
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

function YandexIncrementStats(request)
{
    if(player == null)
    {
        SendFailedMessage(request, enums.MESSAGES.UserNotLogged);
        return;
    }
    var increments = KeysValuesToObject(JSON.parse(request.jsonData));
    player.incrementStats(increments).then(() =>
    {
        SendSuccessMessage(request);
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

function KeysValuesToObject(keyPairs)
{
    var stats = {};
    for(var i = 0 ; i < keyPairs.keys.length; i++)
        stats[keyPairs.keys[i]] = keyPairs.values[i];
    return stats;
}

function GetKeysValuesArrays(obj)
{
    var keys = [];
    var values = [];
    for(var key in obj)
        if(obj.hasOwnProperty(key))
        {
            keys.push(key);
            values.push(obj[key]);
        }
    return {
        keys: keys,
        values: values
    }
}


// Leaderboards
function YandexInitializeLeaderboards(request)
{
    sdk.getLeaderboards().then(_lb =>
    {
        leaderboards = _lb;
        SendSuccessMessage(request);
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

function YandexGetLeaderboardInfo(request)
{
    if(player == null)
    {
        SendFailedMessage(request, enums.MESSAGES.UserNotLogged);
        return;
    }
    if(leaderboards == null)
    {
        SendFailedMessage(request, enums.MESSAGES.LeaderboardsNotInit);
        return;
    }

    leaderboards.getLeaderboardDescription(request.jsonData).then(res =>
    {
        SendSuccessMessage(request, JSON.stringify(res));
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

function YandexSetLeaderboardScore(request)
{
    if(player == null)
    {
        SendFailedMessage(request, enums.MESSAGES.UserNotLogged);
        return;
    }
    if(leaderboards == null)
    {
        SendFailedMessage(request, enums.MESSAGES.LeaderboardsNotInit);
        return;
    }

    var requestData = JSON.parse(request.jsonData);
    if(requestData.extraData == null)
        leaderboards.setLeaderboardScore(requestData.leaderboardName, requestData.score);
    else
        leaderboards.setLeaderboardScore(requestData.leaderboardName, requestData.score, requestData.extraData);

    SendSuccessMessage(request);
}

function YandexLeaderboardPlayer(request)
{
    if(player == null)
    {
        SendFailedMessage(request, enums.MESSAGES.UserNotLogged);
        return;
    }
    if(leaderboards == null)
    {
        SendFailedMessage(request, enums.MESSAGES.LeaderboardsNotInit);
        return;
    }

    leaderboards.getLeaderboardPlayerEntry(request.jsonData).then(res =>
    {
        SendSuccessMessage(request, JSON.stringify(res));
    }).catch(err =>
    {
        var message = err.code != null ? err.code : JSON.stringify(err);
        SendFailedMessage(request, message);
    });
}

function YandexGetLeaderboard(request)
{
    if(player == null)
    {
        SendFailedMessage(request, enums.MESSAGES.UserNotLogged);
        return;
    }
    if(leaderboards == null)
    {
        SendFailedMessage(request, enums.MESSAGES.LeaderboardsNotInit);
        return;
    }

    var requestData = JSON.parse(request.jsonData);
    leaderboards.getLeaderboardEntries(requestData.leaderboardId, requestData.parameters).then(res =>
    {
        SendSuccessMessage(request, JSON.stringify(res));
    }).catch(err =>
    {
        SendFailedMessage(request, err);
    });
}

// Envorinment
function InitializeEnvironment(request)
{
    FetchYandexSDK(() => {
        var environmentJson = GetYandexEnvironmentJson();
        SendSuccessMessage(request, environmentJson);
    });
}

function GetYandexEnvironmentJson()
{
    if(sdk == null)
    {
        console.log('--SDK is equal of null');
        return;
    }

    environment.appId = sdk.environment.app.id;
    if(sdk.environment != null)
    {
        if(sdk.environment.payload != null)
            environment.payload = sdk.environment.payload;

        if(sdk.environment.browser != null)
            environment.browser.languageCode = sdk.environment.browser.lang;

        if(sdk.environment.i18n != null)
        {
            environment.browser.topLevelDomain = sdk.environment.i18n.tld;
            environment.browser.languageCode = sdk.environment.i18n.lang;
        }
    }

    if(sdk.screen != null)
    {
        environment.screen.isFullscreen = sdk.screen.fullscreen;
        if(sdk.screen.orientation != null
            && sdk.screen.orientation.value
            && sdk.screen.orientation.lock)
        {
            environment.screen.orientation.value = sdk.screen.orientation.value;
            environment.screen.orientation.isLock = sdk.screen.orientation.lock;
        }
    }

    if(sdk.deviceInfo != null)
    {
        environment.deviceInfo.isTv = sdk.deviceInfo.isTV();
        environment.deviceInfo.isTable = sdk.deviceInfo.isTablet();
        environment.deviceInfo.isDesktop = sdk.deviceInfo.isDesktop();

        environment.deviceInfo.deviceType = sdk.deviceInfo.type;
    }
    console.log(`---Invironment: ${JSON.stringify(environment)}`)
    return  JSON.stringify(environment);
}

function YandexExitFromGame()
{
    console.log('-Start exit from game');
    sdk.dispatchEvent(sdk.EVENTS.EXIT);
}


var useYandexCheckAppAddToFavorite = 0;
// Add lable to desktop 
function YandexCheckAppAddToFavorite(request)
{
    if(sdk == null)
    {
        console.log('-Yandex SDK is null or empty for call YandexCheckAppAddToFavorite().');
        return;
    }
    useYandexCheckAppAddToFavorite ++;
    console.log(`=== Use: ${useYandexCheckAppAddToFavorite}`);

    sdk.shortcut.canShowPrompt().then(prompt =>
    {
        console.log(`=== Use YandexCheckAppAddToFavorite === ${prompt}`);
        SendSuccessMessage(request, prompt.canShow == true ? 1 : 0);
    });
}

function YandexAppAddToFavorites(request)
{
    if(sdk == null)
    {
        console.log('-Yandex SDK is null or empty for call YandexAppAddToFavorites().');
        return;
    }

    sdk.shortcut.showPrompt().then(result =>
    {
        SendSuccessMessage(request, result.outcome === 'accepted' ? 1 : 0);
    });
}

var useYandexCheckAvailableRateTheApp = 0;
// Rate the app
function YandexCheckAvailableRateTheApp(request)
{
    if(sdk == null || sdk.feedback == null)
    {
        console.log('-Yandex SDK is null or empty for call YandexCheckAvailableRateTheApp()');
        return;
    }

    useYandexCheckAvailableRateTheApp++;
    console.log(`=== Use YandexCheckAvailableRateTheApp === ${useYandexCheckAvailableRateTheApp}`);

    sdk.feedback.canReview()
        .then(({ value, reason }) =>
        {
            console.log(`=== YandexCheckAvailableRateTheApp === Value: ${value}, Reason: ${reason}`);
            var result = GetResultRateApp(value, reason);
            SendSuccessMessage(request, JSON.stringify(result));
        });
}

function YandexRateTheApp(request)
{
    if(sdk == null || sdk.feedback == null)
    {
        console.log('-Yandex SDK is null or empty for call YandexRateTheApp()');
        return;
    }

    sdk.feedback.canReview().then(({ value, reason }) =>
    {
        if (value)
        {
            sdk.feedback.requestReview().then(({ feedbackSent }) =>
            {
                var result = GetResultRateApp(value, feedbackSent == true ? "THE_APP_IS_RATED" : "THE_APP_IS_NOT_RATED");
                SendSuccessMessage(request, JSON.stringify(result));

                console.log('-Show feedback window: ' + feedbackSent);
            });
            return;
        }

        var result = GetResultRateApp(false, reason);
        SendSuccessMessage(request, JSON.stringify(result));
    });
}

function GetResultRateApp(value, reason)
{
    // bool value;
    // string reason = "NONE" || "NO_AUTH" || "GAME_RATED" || "REVIEW_ALREADY_REQUESTED" 
    // || "REVIEW_WAS_REQUESTED" || "UNKNOWN" || "THE_APP_IS_RATED" || "THE_APP_IS_NOT_RATED"
    return {
        canShow: value,
        reason: reason
    };
}

function YandexCallGameReady()
{
    console.log('CALL GAME READY');
    sdk.features?.LoadingAPI?.ready();
}


StartPage();
