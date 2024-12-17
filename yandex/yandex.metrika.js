//-- Yandex.Metrika counter --
let yandexMetrikaId = 1111111;
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

ym(yandexMetrikaId, "init", {
    clickmap:true,
    trackLinks:true,
    accurateTrackBounce:true
});

// -- Metrika Helper --
function sendEventToMetrika(eventName) {
    if (typeof ym !== 'undefined') {
        console.log(`Send goal: ${eventName}`);
        ym(yandexMetrikaId,'reachGoal', eventName);
        return;
    }
    console.log('---METRIKA NOT FOUND---');
}


//-- Timer --
function pageTimer()
{
    let seconds = 0;
    let isActiveTab = true;

    function timerTick() {
        if (isActiveTab) {
            seconds++;

            if(seconds % 30 == 0)
            {
                var sendEvent = `TimeOnPage${seconds}`;
                sendEventToMetrika(sendEvent);
            }
        }
    }

    let timerId = setInterval(timerTick, 1000);

    window.addEventListener('blur', function() {
        isActiveTab = false;
    });

    window.addEventListener('focus', function() {
        isActiveTab = true;
    });
}

pageTimer();
