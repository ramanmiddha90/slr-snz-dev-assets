(function onPageReady() {

    var intervalHandle = setInterval(
        function () {
            if (window.pageReady) {
                var continuteButton = document.getElementById('continue');
                if (continuteButton && $("#continue").is(':visible')) {

                    LoadFields();
                    SetUIElements();

                    $("#customContinue").click(function (e) {
                        setFieldValues();
                        $("#continue").click();
                    });
                    clearInterval(intervalHandle);
                }
            }
        }, 50);
}());


function GetParameterValues(param) {
    if (document.referrer != undefined) {
        var url = document.referrer.slice(document.referrer.indexOf('?') + 1).split('&');
        for (var i = 0; i < url.length; i++) {
            var urlparam = url[i].split('=');
            if (urlparam[0].toUpperCase() == param.toUpperCase()) {
                return urlparam[1];
            }

        }
    }
    var currentURL = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < currentURL.length; i++) {
        var currentURLParams = currentURL[i].split('=');
        if (currentURLParams[0].toUpperCase() == param.toUpperCase()) {
            return currentURLParams[1];
        }

    }
    return null;
};

function SetUIElements() {
    HandleTabEvents(0);
    $("#btnConsent").click(function (e) {
        $("#lbl_pitcherURLError").hide();
        var portalURL = $("#passwordResetPortalUserURl").val();

        if (portalURL != null && portalURL != undefined && portalURL != "")
            window.location.replace(portalURL);
        else {
            $("#lbl_pitcherURLError").show();
            e.preventDefault();
        }
    });
}
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function GenreateUpdateDCRRequest() {
    var fieldInfo = $.parseJSON($("#FieldInfo").val());
    var updateDCRBody = {};
    //read config fields and check which is visible and set those value only
    var Attribute = {};
    fieldInfo.Fields_Info.forEach(function (UXField) {
        var attributeID = "#" + UXField.Id;
        //attribute name is not blank and not undefined
        if (UXField.Is_Visible && UXField.AttributeName != undefined && UXField.AttributeName != "") {
            //type is also defined
            if (UXField.InputType != undefined) {
                var attrValue = "";
                attrValue = $(attributeID).val();
                if (attrValue != "" && attrValue != null) {
                    Attribute[UXField.AttributeName] = attrValue;
                }
            }
        }

    });
    var queryparams = JSON.parse($("#queryparams").val());
    updateDCRBody["AccountId"] = queryparams.scoutUserAccountId ?? "";
    updateDCRBody["CountryCode"] = queryparams.countryCode ?? "";
    updateDCRBody["SignupType"] = queryparams.regType ?? "V1";
    updateDCRBody["CorrelationId"] = generateGUID();
    updateDCRBody["CommandType"] = "UpdateAccount";
    Attribute["PersonEmail"] = queryparams.email ?? "";
    updateDCRBody["Attribute"] = Attribute;
    console.log(JSON.stringify(updateDCRBody));
    return updateDCRBody;
}
function SubmitDCR() {

    const continueBtn = document.querySelector('#continue')
        || document.querySelector('button[type="submit"]');

    var accessToken = $("#AccessToken").val();
    const headers = {
        'Authorization': 'Bearer' + accessToken
    };
    var updateDCRRqequest = GenreateUpdateDCRRequest();
    console.log(accessToken);
    if (accessToken != undefined && accessToken != ""
        && updateDCRRqequest != null && updateDCRRqequest != undefined) {

        var url = "https://auf-solar-dev-westeurope-01.azurewebsites.net/api/prod/solar/ProcessDCRFunction";
        makeApiCall(url, 'POST', headers, updateDCRRqequest)
            .then(data => {
                console.log('POST Data:', data);
                $("#lblPESuccess").show();

            })
            .catch(error => {
                console.error('Error in POST request:', error);
                $("#lblPESuccess").show();
                $("#lblPESuccess").css("color", 'red');
                $("#lblPESuccess").text("Unable to submit the request due to some internal error. Please try again!")
            });
    }
}

function LoadFields() {

    var fieldInfo = $.parseJSON($("#FieldInfo").val());
    fieldInfo.Fields_Info.forEach(function (UXField) {
        var fieldAttr = "." + UXField.Id + "_li";
        var fieldAttrLabelId = "#" + UXField.Id + "_label";

        if (UXField.Is_Visible) {
            if (UXField.Is_Req) {
                let objIndex = SA_FIELDS.AttributeFields.findIndex(
                    (obj) => obj.ID == UXField.Id
                );
                if (objIndex >= 0) {
                    //Update object's name property.
                    SA_FIELDS.AttributeFields[objIndex].IS_REQ = true;
                    $(fieldAttrLabelId).text($(fieldAttrLabelId).text() + "*");
                }
            }
            else {
                $(fieldAttr).show();

            }
        }
        else {
            $(fieldAttr).hide();
        }
    });
}



const observer = new MutationObserver(function (mutations, obs) {
    const form = document.querySelector('form');
    const cancelBtn = document.querySelector('#cancel');
    const continueBtn = document.querySelector('#continue')
        || document.querySelector('button[type="submit"]');

    if (form && continueBtn) {

        $("#lblUpdateMessage").hide();
     
        obs.disconnect();

        const cancelHandler = function (e) {
            e.preventDefault();                      // Stop default
            e.stopImmediatePropagation(); // Stop internal B2C logic
        }

        // Replace default click behavior
        const handler = function (e) {
            e.preventDefault();                      // Stop default
            e.stopImmediatePropagation();            // Stop internal B2C logic
            //Native HTML validation
            if (!form.checkValidity()) {
                form.reportValidity(); // show field-level errors
                return;
            }
            console.log("profile update request started");

            SubmitDCR();

            //call ajax api call here
            console.log("All checks passed. Resuming B2C submission...");
        };
        // Attach your handler using capture
        continueBtn.addEventListener('click', handler, true);
        cancelBtn.addEventListener('click', cancelHandler, true);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
