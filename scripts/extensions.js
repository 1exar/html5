
function LoadStringFromUrl(url, successCallback, errorCallback)
{
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function () 
    {
        if(xobj.readyState == 4)
        {
            if (xobj.status == "200") 
            {
                if(successCallback != null)
                    successCallback(xobj.responseText);
            } else 
            {
                if(errorCallback != null)
                    errorCallback();
            }

        }
    };
    xobj.send(); 
}
