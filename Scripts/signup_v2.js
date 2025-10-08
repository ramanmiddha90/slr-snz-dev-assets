(function onPageReady() {
    var SIGN_IN_POLICY = "B2C_1A_SOLAR_LOGIN";
  
    var intervalHandle = setInterval(
        function () {
            if (window.pageReady) {
                function GetParameterValues(param) {
                    var url = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
                    for (var i = 0; i < url.length; i++) {
                        var urlparam = url[i].split('=');
                        if (urlparam[0].toUpperCase() == param.toUpperCase()) {
                            return urlparam[1];
                        }

                    }
                    return null;
                };

                function GetRedirectURLFromReferrer(param) {
                    var url = document.referrer.slice(document.referrer.indexOf('?') + 1).split('&');
                    for (var i = 0; i < url.length; i++) {
                        var urlparam = url[i].split('=');
                        if (urlparam[0].toUpperCase() == param.toUpperCase()) {
                            return urlparam[1];
                        }

                    }
                    return null;
                }


                function loadFields() {

                    var fieldInfo = $.parseJSON($("#FieldInfo").val());
                    fieldInfo.Fields_Info.forEach(function (UXField) {
                        var fieldAttr = "." + UXField.Id + "_li";
                        var requiredFieldAttr = "." + UXField.Id + "_required_li";
                        var requiredFieldId = "#" + UXField.Id + "_required";
                        console.log(requiredFieldAttr);
                        if (UXField.Is_Visible) {
                            if (UXField.Is_Req && $(requiredFieldAttr) != null && $(requiredFieldAttr) != undefined && $(requiredFieldAttr).length > 0) {
                                $(fieldAttr).hide();
                                $(requiredFieldAttr).show();
                            }
                            else {
                                $(fieldAttr).show();
                                if ($(requiredFieldAttr).length > 0) {
                                    $(requiredFieldAttr).hide();
                                    if (UXField.InputType == "Dropdown") {
                                        //if dropdwon set default index 1
                                        $(requiredFieldId).get(0).selectedIndex = 1;
                                    }
                                    else {
                                        $(requiredFieldId).val("na");
                                    }
                                }
                            }
                        }
                        else {
                            $(fieldAttr).hide();
                            if ($(requiredFieldAttr).length > 0) {
                                $(requiredFieldAttr).hide();
                                if (UXField.InputType == "Dropdown") {
                                    //if dropdwon set default index 1
                                    $(requiredFieldId).get(0).selectedIndex = 1;
                                }
                                else {
                                    $(requiredFieldId).val("na");
                                }
                            }
                        }
                    });
                }
                function setFieldValues() {
                    var fieldInfo = $.parseJSON($("#FieldInfo").val());
                    fieldInfo.Fields_Info.forEach(function (UXField) {
                        if (UXField.Is_Visible) {
                            var fieldAttr = "#" + UXField.Id;
                            var requiredFieldAttr = "#" + UXField.Id + "_required";

                            if (UXField.Is_Req && $(requiredFieldAttr).is(':visible')) {
                                if (UXField.InputType == "Dropdown") {
                                    $(fieldAttr).val($(requiredFieldAttr).val());
                                    //if dropdwon set default index 1
                                    $(fieldAttr).get(0).selectedIndex = $(requiredFieldAttr).get(0).selectedIndex;
                                }
                                else {
                                    $(fieldAttr).val($(requiredFieldAttr).val());
                                }

                            }
                            else {
                                if ($(requiredFieldAttr).length > 0) {
                                    if (UXField.InputType == "Dropdown") {
                                        //if dropdwon set default index 1
                                        $(requiredFieldAttr).get(0).selectedIndex = 1;
                                    }
                                    else {
                                        $(requiredFieldAttr).val("na");
                                    }
                                }
                            }
                        }
                    });
                }

                function IsSignInFlow() {
                    if (window.location.href.includes(SIGN_IN_POLICY))
                        return true;

                    return false;
                }
                function setUIElements() {

                    if ($("#customCancel") && $("#customCancel").is(':visible')) {
                        $("#customCancel").remove();
                    }
                    if ($("#customContinue") && $("#customContinue").is(':visible')) {
                        $("#customContinue").remove();
                    }

                    $("#continue").after("<button id='customCancel'>Cancel</button>");


                    $("#continue").after("<button id='customContinue'>Continue</button>");
                    $("#continue").hide();
                    $("#customCancel").text($("#cancel").text())
                    $("#customContinue").text($("#continue").text())
                }
                function AttachCancelEvent() {
                    $("#customCancel").click(function (e) {
                        var returnUrl = GetParameterValues('return_url'); //Encoded value FE URL
                        if (returnUrl == null)
                            returnUrl = "";
                        var redirectURI = "";
                        if (IsSignInFlow()) {
                            redirectURI = GetRedirectURLFromReferrer('redirect_uri');
                        }
                        else {
                             redirectURI = GetParameterValues('redirect_uri');
                         
                        }
                        var url = decodeURIComponent(redirectURI) + "#error=access_denied&error_description=AAD_Custom_466:" + returnUrl;
                        window.location.replace(url);
                        e.stopPropagation();
                    });
                }
                var continuteButton = document.getElementById('continue');
                if (continuteButton && $("#continue").is(':visible')) {

                    loadFields();
                    setUIElements();
                    AttachCancelEvent();

                    $("#customContinue").click(function (e) {
                        setFieldValues();
                        $("#continue").click();
                    });
                    clearInterval(intervalHandle);
                }
            }
        }, 50);
}());