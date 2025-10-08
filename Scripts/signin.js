//signin.html;
(function onPageReady() {
    var intervalHandle = setInterval(
        function () {
            if (window.pageReady) {
                var policyPrefix = "B2C_1A_SLR_SNZ";
                var SNZPolicy = "SNZ_LOGIN";
                var SwissRXPolicy = "SWISSRX_LOGIN";
                var SetInvitationElements = function () {

                    $("#signInName").on("change paste keyup", function () {
                        //console.log($(this).val());
                        // $("#CurrentSignInStatus").val("NF");
                        // $("#invitationCode").hide();
                    });

                    var targetNode = document.getElementById('claimVerificationServerError');
                    //debugger;
                    $("#divInvitationCode").hide();
                    var observer = new MutationObserver(function () {
                        if (targetNode.style.display != 'none') {
                            //debugger;
                         /*   console.log("claimVerificationServerError");*/
                            if ($("#claimVerificationServerError").text().includes("username or password provided")) {
                               
                                $("#claimVerificationServerError").text(GetTranslationBasedOnCode("S-001"));
                            }
                            var errorCode = GetCancelCodeBasedOnMessage();
                            $("#attributeList").after($("#claimVerificationServerError"))
                            if (errorCode == "461") {
                                $("#invitationCode").val("");
                                $("#invitationCode").show();
                                //$("#claimVerificationServerError").after($("#invitationCode"));
                                $("#CurrentSignInStatus").val("AI");
                            }

                        }
                        else {
                            /* $("#CurrentSignInStatus").val("NF");*/
                            //$("#invitationCode").hide();
                        }
                    });
                    observer.observe(targetNode, { attributes: true, attributeFilter: ['style'] });
                };

                function SetUILabels() {
                    try {
                        if ($("#ErrorMappings") != null) {

                            var UI_Locales = $.parseJSON($("#ErrorMappings").val());
                            UI_Locales.StatusMapping.forEach(function (UIElementConfig) {
                                if (UIElementConfig.Type && UIElementConfig.Type == "label") {
                                    //code is id
                                    var currentElement = $("#" + UIElementConfig.Code);
                                    if (currentElement) {
                                        currentElement.html(UIElementConfig.Text);
                                    }

                                }
                            });
                        }
                    }
                    catch {

                    }
                }
                function GetTranslationBasedOnCode(code) {
                    var message = $("#claimVerificationServerError")?.text();
                    if ($("#ErrorMappings") != null) {

                        var UI_Locales = $.parseJSON($("#ErrorMappings").val());

                        UI_Locales.StatusMapping.forEach(function (error) {

                            if (error.Code != undefined && error.Code == code) {
                                message = error.Text;
                                return false;
                            }
                        });

                    }
                    return message;
                };
                function GetCancelCodeBasedOnMessage() {
                    var errorCode = 999;
                    if ($("#ErrorMappings") != null) {

                        var UI_Locales = $.parseJSON($("#ErrorMappings").val());
                        var currentErrorMessage = $("#claimVerificationServerError")?.text();
                        if (currentErrorMessage) {

                            UI_Locales.StatusMapping.forEach(function (error) {

                                if (error.Message != undefined && error.Message == currentErrorMessage) {
                                    errorCode = error.Code;
                                    return false;
                                }
                            });
                        }
                    }
                    return errorCode;
                };
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
                function ConfigureRedirectURL(policy) {
                    var queryparams = JSON.parse($("#queryparams").val());
                    var countryCode = setQueryParam(queryparams.countryCode, "");
                    var applicationType = setQueryParam(queryparams.applicationType, "MIAC");
                    var return_url = queryparams.return_url ?? "";
                    var regType = setQueryParam(queryparams.regType, "V1");
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

                        //var queryparams = new URLSearchParams(window.location.search);
                        //queryparams.set("p", "B2C_1A_SOLAR_SANDOZID_PROD_SIGNUP");
                        //window.location.search = queryparams.toString();
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
                var setCustomLabels = function () {
                    if ($("#api"))
                        $("#api > .intro:eq(0) ").before("<div class='pageheader intropageheader intro'><p id='intropageheader_lbl'>Login</p></div>");
                    SetUILabels();
                    // SetIDPs();
                    $("#customCancel").text($("#cancel").text())

                   
                };
                var continuteButton = document.getElementById('continue');
                if (continuteButton && $("#continue").is(':visible')) {

                    //AddPasswordResetLink();
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
                        var errorCode = GetCancelCodeBasedOnMessage();
                        var redirectURL = GetParameterValues('return_url'); //Encoded value FE URL
                        if (redirectURL == null)
                            redirectURL = "";
                        //microsoft redirecturl
                        var redirectURI = GetParameterValues('redirect_uri');
                        //var url = decodeURIComponent(redirectURI) + "#error=" + errorCode + ":" + redirectURL;
                        var url = decodeURIComponent(redirectURI) + "#error=access_denied&error_description=AAD_Custom_" + errorCode + ":" + redirectURL;
                        window.location.replace(url);


                    });

                    // SetInvitationElements();
                    BindEvent();
                    clearInterval(intervalHandle);


                }
            }
        }, 50);
}());