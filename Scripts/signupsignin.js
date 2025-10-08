
(function onPageReady() {
    var intervalHandle = setInterval(
        function () {
            if (window.pageReady) {

                var SetInvitationElements = function () {

                    $("#signInName").on("change paste keyup", function () {
                        //console.log($(this).val());
                        $("#CurrentSignInStatus").val("NF");
                        $("#invitationCode").hide();
                    });

                    var targetNode = document.getElementById('claimVerificationServerError');
                    //debugger;
                    $("#divInvitationCode").hide();
                    var observer = new MutationObserver(function () {
                        if (targetNode.style.display != 'none') {
                            //debugger;

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
                    observer.observe(targetNode, { attributes: true, childList: true });
                };

                function GetTextBasedOnCode(code, defaultValue) {
                    var message = defaultValue;
                    try {
                        if ($("#ErrorMappings") != null) {

                            var UI_Locales = $.parseJSON($("#ErrorMappings").val());

                            UI_Locales.StatusMapping.forEach(function (error) {

                                if (error.Code == code) {
                                    message = error.Message;
                                    return false;
                                }
                            });
                        }
                    }
                    catch {
                        return message;
                    }
                    return message;
                }
                function GetCancelCodeBasedOnMessage() {
                    var errorCode = 999;
                    if ($("#ErrorMappings") != null) {

                        var UI_Locales = $.parseJSON($("#ErrorMappings").val());
                        var currentErrorMessage = $("#claimVerificationServerError")?.text();
                        if (currentErrorMessage) {

                            UI_Locales.StatusMapping.forEach(function (error) {

                                if (error.Message == currentErrorMessage) {
                                    errorCode = error.Code;
                                    return false;
                                }
                            });
                        }
                    }
                    return errorCode;
                };


                function AddPasswordResetLink() {

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
                var continuteButton = document.getElementById('continue');

                var SetMockSignInDetails = function () {
                    var SignInName_Field = $("#signInName");
                    var Password_Field = $("#password");
                    SignInName_Field.hide();
                    Password_Field.hide();
                    SignInName_Field.val("mockuser@novartis.com");
                    Password_Field.val("novartis@mock")
                };

                var BindIDPEvent = function () {
                    $("#NovartisExchange").click(function (event) {
                        $("#IDPName").val("Novartis");
                        SetMockSignInDetails();
                        $("#continue").click();
                    });
                };
             
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

                    var forgortPassMesage = GetTextBasedOnCode('lbl_ForgotPassword', "Forgot your password?")
                    console.log(forgortPassMesage);
                    $("#resetPassword").text(forgortPassMesage);
                    $("#customCancel").text($("#cancel").text())
                    $("#resetPassword").click(function (event) {
                        window.location.href = "https://ciamtest01.b2clogin.com/ciamtest01.onmicrosoft.com/oauth2/v2.0/authorize?p=B2C_1A_PWRESET&client_id=29e8b168-9946-4c79-89d3-215c9f55cff7&nonce=defaultNonce&redirect_uri=https%3A%2F%2Fjwt.ms&scope=openid&response_type=id_token&prompt=login";
                    });
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

                    SetInvitationElements();
                    BindIDPEvent();
                    clearInterval(intervalHandle);
                }
            }
        }, 50);
}());