
// tabIndex =0 - PE
// tabIndex =1 - PR
var PE_POLICY = "B2C_1A_SOLAR_SANDOZID_PROD_PROFILE_EDIT";
var PR_POLICY = "B2C_1A_SOLAR_SANDOZID_PROD_PWRESET";
function HandleTabEvents(tabIndex = 1) {
    if (tabIndex == 1) {
        // Remove 'active' class from first tab and pane
        $('#myTab li').removeClass('active');
        $('.tab-pane').removeClass('active in');
        // Add 'active' to the second tab and pane
        $('#myTab li:eq(1)').addClass('active');
        $('#passwordReset').addClass('active in');
    }

    //user is on PE and set password reset tab clieck
    if (tabIndex == 0) {
        $("#passwrod-tab").click(function (e) {
            e.preventDefault();                      // Stop default
            e.stopImmediatePropagation(); // Stop internal B2C logic
            SetTabURL(PR_POLICY);
        });
    }
    else {
        //user is ON PR set PE click
        $("#home-tab").click(function (e) {
            e.preventDefault();                      // Stop default
            e.stopImmediatePropagation(); // Stop internal B2C logic
            SetTabURL(PE_POLICY);
        });
    }
}
function setQueryParam(value,defaultValue = "") {
    if (value == "" || value == null || value == undefined) {
        value = defaultValue
    }
    return value;
}
function SetTabURL(policy) {
    var queryparams = JSON.parse($("#queryparams").val());
    var countryCode = setQueryParam(queryparams.countryCode, "US");
    var return_url = queryparams.return_url ?? "";
    var regType = setQueryParam(queryparams.regType, "V1");
    var clientId = queryparams.clientId ?? "";
    var redirect_uri = queryparams.redirect_uri ?? "";

    var queryparams = new URLSearchParams(window.location.search);
    if (queryparams.has("redirect_uri")) {
        queryparams.set("p", policy);
        window.location.replace(window.location.origin + window.location.pathname + "?" + queryparams.toString())
    }
    else {
     
        var originURL = document.domain;
        var tenantName = originURL.replace(".b2clogin.com", "") + ".onmicrosoft.com";
        var passwordURL = "https://" + originURL + "/" + tenantName +
                            "/oauth2/v2.0/authorize?p=" + policy +"&client_id=" + clientId +
                            "&nonce=defaultNonce&redirect_uri=" + redirect_uri + "&scope=openid&response_type=id_token&UI_Locales=en&return_url=" + return_url +
                            "&countryCode=" + countryCode + "&regType=" + regType;
        window.location.replace(passwordURL);
    }
}
