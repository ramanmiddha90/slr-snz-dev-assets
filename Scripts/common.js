
// tabIndex =0 - PE
// tabIndex =1 - PR
var PE_POLICY = "B2C_1A_SLR_SNZ_PE";
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
    var countryCode = queryparams.countryCode;
    var return_url = queryparams.return_url ?? "";
    var applicationType = queryparams.applicationType ?? "HCP";
    var clientId = queryparams.clientId ?? "";
    var redirect_uri = queryparams.redirect_uri ?? "";
    var UI_Locales = queryparams.userLanguage ?? "en";
    var queryString = new URLSearchParams(window.location.search);
    if (queryString.has("redirect_uri")) {
        queryString.set("p", policy);
        window.location.replace(window.location.origin + window.location.pathname + "?" + queryString.toString())
    }
    else {
     
        var originURL = document.domain;
        var tenantName = originURL.replace(".b2clogin.com", "") + ".onmicrosoft.com";
        var passwordURL = "https://" + originURL + "/" + tenantName +
                            "/oauth2/v2.0/authorize?p=" + policy +"&client_id=" + clientId +
            "&nonce=defaultNonce&redirect_uri=" + redirect_uri + "&scope=openid&response_type=id_token&UI_Locales=" + UI_Locales +"&return_url=" + return_url +
            "&cc=" + countryCode + "&at=" + applicationType;
        window.location.replace(passwordURL);
    }
}
