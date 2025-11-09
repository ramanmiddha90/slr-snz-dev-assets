//signin.html;
(function onPageReady() {
    var intervalHandle = setInterval(
        function () {
            if (window.pageReady) {
                var policyPrefix = "B2C_1A_SLR_SNZ";
                var SNZPolicy = "SNZ_LOGIN";
                var SwissRXPolicy = "SWISSRX_LOGIN";
                var HandleSpinnerEvents = function () {
                    var targetNode = document.getElementById('claimVerificationServerError');
                    //debugger;
                    var observer = new MutationObserver(function () {
                        if (targetNode.style.display != 'none') {
                            LoadSpinner(false);
                            //username and password text not shown in self asserted that is the reason to handle it using obserables
                            if ($("#claimVerificationServerError").text().includes("username or password provided")) {
                                $("#claimVerificationServerError").text("Es konnte kein Konto für die angegebene Benutzer-ID gefunden werden.");
                            }
                        }
                    });
                    observer.observe(targetNode, { attributes: true, attributeFilter: ['style'] });
                };
                function LoadSpinner(showLoader) {
                    if (showLoader == true) {
                        document.getElementById('loader-backdrop').style.display = 'flex';
                    }
                    else {
                        document.getElementById('loader-backdrop').style.display = 'none';
                    }
                }
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

                function setQueryParam(value, defaultValue = "") {
                    if (value == "" || value == null || value == undefined) {
                        value = defaultValue
                    }
                    return value;
                }
                function LoadFields() {
                    try {
                        var formConfig = $.parseJSON($("#FormConfig").val());
                        formConfig.steps[0].fields.forEach(function (UXField) {
                            if (UXField.fieldType == "custom" && UXField.visible) {
                                if (UXField.text != null) {
                                    $("#" + UXField.name).text(UXField.text);
                                }
                            }
                        });
                    }
                    catch {

                    }
                }
                function ConfigureRedirectURL(policy) {
                    var queryparams = JSON.parse($("#queryparams").val());
                    var countryCode = setQueryParam(queryparams.countryCode, "");
                    var applicationType = setQueryParam(queryparams.applicationType, "MIAC");
                    var return_url = queryparams.return_url ?? "";
                    var clientId = queryparams.clientId ?? "";
                    var redirect_uri = queryparams.redirect_uri ?? "";
                    var UILanguage = queryparams.UILanguage ?? "EN";
                    var queryparams = new URLSearchParams(window.location.search);
                    var originURL = document.domain;
                    var tenantName = originURL.replace(".b2clogin.com", "") + ".onmicrosoft.com";
                    var redirectURL = "https://" + originURL + "/" + tenantName +
                        "/oauth2/v2.0/authorize?p=" + policy + "&client_id=" + clientId +
                        "&nonce=defaultNonce&redirect_uri=" + redirect_uri + "&scope=openid&response_type=id_token&return_url=" + return_url +
                        "&cc=" + countryCode + "&at=" + applicationType + "&UI_Locales=" + UILanguage;

                    return redirectURL;

                }
                var BindEvent = function () {
                    $("#SNZ_LOGIN").click(function (event) {
                        var policyName = policyPrefix + "_" + SNZPolicy;
                        var queryparams = new URLSearchParams(window.location.search);
                        queryparams.set("p", policyName);
                        window.location.search = queryparams.toString();
                    });
                    $("#SWISSRX_LOGIN").click(function (event) {
                        var policyName = policyPrefix + "_" + SwissRXPolicy;
                        var queryparams = new URLSearchParams(window.location.search);
                        queryparams.set("p", policyName);
                        window.location.search = queryparams.toString();
                    });
                    $("#resetPassword").click(function (event) {
                        window.location = ConfigureRedirectURL("B2C_1A_SOLAR_Prod_PWRESET");
                    });

                    $("#signup").click(function (event) {
                        window.location = ConfigureRedirectURL("B2C_1A_SLR_SNZ_SIGNUP");
                    });
                };
                var SetIDPs = function () {
                    try {
                        if ($("#FieldInfo") != null && $("#FieldInfo") != undefined) {
                            var fieldInfo = $.parseJSON($("#FieldInfo").val());
                            var isSSOVisible = false;
                            if (fieldInfo.IDPs != null && fieldInfo.IDPs != undefined) {
                                fieldInfo.IDPs.forEach(function (UXField) {
                                    var IDPSelector = "#" + UXField.Id;

                                    if (UXField.Is_Visible) {
                                        isSSOVisible = true;
                                        $(IDPSelector).show();
                                    }
                                    else {
                                        $(IDPSelector).hide();
                                    }
                                });
                            }
                            if (!isSSOVisible) {
                                $(".socialIdps").remove();                            }
                        }
                    }
                    catch {

                    }
                }
                function hasMicrosoftValidationErrors() {
                    // Select all potential error containers
                    const errorElements = document.querySelectorAll('.error.itemLevel, .error.pageLevel, #alert');

                    for (const el of errorElements) {
                        if (el.offsetParent !== null && el.offsetHeight > 0) {
                            return true; // Error is actually visible
                        }
                    }
                    return false; // No visible errors
                }

                document.getElementById("continue").addEventListener("click", function (event) {
                    // Delay a moment to allow B2C to apply error classes
                    setTimeout(() => {
                        if (!hasMicrosoftValidationErrors()) {
                            LoadSpinner(true);
                        }
                    }, 400); // slight delay so DOM updates
                });
                var setCustomLabels = function () {
                    if ($("#api"))
                        $("#api > .intro:eq(0) ").before("<div class='pageheader intropageheader intro'><p id='intropageheader_lbl'>Login</p></div>");
                    LoadFields();
                    // SetIDPs();
                    $("#customCancel").text($("#cancel").text())

                   
                };
                var continuteButton = document.getElementById('continue');
                if (continuteButton && $("#continue").is(':visible')) {

                    if ($("#CurrentSignInStatus")) {
                        $("#CurrentSignInStatus").val("NF");
                    }
                    if ($("#customCancel") && $("#customCancel").is(':visible')) {
                        $("#customCancel").remove();
                    }

                    $("#continue").after("<button id='customCancel'>Cancel</button>");
                    $(".password_li").filter(":last").append("<div class='forgot-password center-height'><a id='resetPassword' href='javascript:undefined'>Forgot your password?</a></div>");

                    setCustomLabels();

                    $("#customCancel").click(function () {
                        //debugger;
                      
                        var redirectURL = GetParameterValues('return_url'); //Encoded value FE URL
                        if (redirectURL == null)
                            redirectURL = "";
                        //microsoft redirecturl
                        var redirectURI = GetParameterValues('redirect_uri');
                        //var url = decodeURIComponent(redirectURI) + "#error=" + errorCode + ":" + redirectURL;
                        var url = decodeURIComponent(redirectURI) + "#error=access_denied&error_description=AAD_Custom_461:" + redirectURL;
                        window.location.replace(url);


                    });

                    HandleSpinnerEvents();
                    BindEvent();
                    clearInterval(intervalHandle);


                }
            }
        }, 50);
}());