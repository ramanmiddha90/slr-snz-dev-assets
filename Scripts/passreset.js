
// Ensure B2C API is available


(() => {
    "use strict";

    const SELECTORS = Object.freeze({
        continueBtn: "#continue",
        cancelBtn: "#cancel",
        customCancelBtn: "#customCancel",
        countryDropdown: "#country",
        passwordInput: "#newPassword",
        passwordStrength: ".passwordStrength",
        passwordStrengthFill: "#strength-fill",
        ruleLength: "#rule-length",
        ruleNumber: "#rule-number",
        ruleSpecial: "#rule-special",
        header: ".header",
        dots: ".dots span",
        queryParams: "#queryparams",
        formConfig: "#FormConfig",
        userInfo: "#userInfo",
        currentStep: "#currentStep",
        emailError: "#emailVerificationControl_error_message",
        attrLis: ".attr li",
        sendCodeBtn: "#emailVerificationControl_but_send_code",
    });
    const safeJSON = (str, fallback = null) => {
        try { return JSON.parse(str); } catch { return fallback; }
    };
    const qs = (sel, ctx = document) => ctx.querySelector(sel);
//function BindEvents() {
//    $("#btnConsent").click(function (e) {
//        $("#lbl_pitcherURLError").hide();
//        var portalURL = $("#passwordResetPortalUserURl").val();

//        if (portalURL != null && portalURL != undefined && portalURL != "")
//            window.location.replace(portalURL);
//        else {
//            var NoPitcherFoundMessage = GetTranslationBasedOnCode("S-003");
//            if (NoPitcherFoundMessage != undefined) {
//                $("#lbl_pitcherURLError").text(NoPitcherFoundMessage);
//            }
//            $("#lbl_pitcherURLError").show();

//            e.preventDefault();
//        }
//    });
//}
//function GetTranslationBasedOnCode(code) {
//    if ($("#ErrorMappings") != null) {
//        var UI_Locales = $.parseJSON($("#ErrorMappings").val());
//        UI_Locales.StatusMapping.forEach(function (error) {
//            if (error.Code != undefined && error.Code == code) {
//                message = error.Text;
//                return false;
//            }
//        });

//    }
//    return message;
//};
// ==========================
// Field loader (per-step)
// ==========================
const Fields = (() => {
   

    const applyUXField = (uxField) => {
        if (!uxField) return;

        const fieldId = uxField.name;
       
        try {
            // custom block
            if (uxField.fieldType === "custom") {
                const el = qs(`#${uxField.name}`);
                if (el && uxField.text != null) el.textContent = uxField.text;
                return;
            }

            
        } catch (e) {
            console.log("Error loading Field:", uxField && uxField.name, e);
        }
    };

    const load = () => {
        const formConfigEl = qs(SELECTORS.formConfig);
        const formConfig = formConfigEl ? safeJSON(formConfigEl.value, {}) : {};

        //hideAllAttrLis();

        const step = formConfig?.steps?.[0];
        if (step && Array.isArray(step.fields)) {
            step.fields.forEach(applyUXField);
        }

        // keep compatibility with external function
        if (typeof HandleTabEvents === "function") {
            try { HandleTabEvents(1); } catch (err) { console.warn("HandleTabEvents failed", err); }
        }
    };

    return { load };
})();
// ==========================
// Boot logic with polling (B2C rendering can be delayed)
// ==========================
const Boot = (() => {
    const POLL_MS = 50;
    const TIMEOUT_MS = 15000; // fail-safe
    let handle = null;
    let startedAt = 0;

    const continueBtnEl = () => qs(SELECTORS.continueBtn);

    const ready = () => {
        const el = continueBtnEl();
        return Boolean(window.pageReady) && el && isVisible(el);
    };

    const tryInit = () => {
        if (!ready()) {
            if (Date.now() - startedAt > TIMEOUT_MS) {
                clearInterval(handle);
                handle = null;
                // Soft fail: do nothing; page likely not in expected state.
            }
            return;
        }
        Fields.load();
        if (handle) {
            clearInterval(handle);
            handle = null;
        }
    };

    const start = () => {
        startedAt = Date.now();
        if (handle) clearInterval(handle);
        handle = setInterval(tryInit, POLL_MS);
    };

    return { start };
})();

// ==========================
// Public API (if needed elsewhere)
// ==========================
window.B2CPage = {
    Fields,
    Boot,
};

// Auto-start when DOM is ready (and still tolerate late rendering via polling)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", Boot.start);
} else {
    Boot.start();
}
}) ();