/*
 * Refactored UI Logic – modular, readable, and easy to maintain
 * - Uses a namespaced module (B2CPage) to avoid globals
 * - Caches selectors and constants
 * - Replaces ad‑hoc URL parsing with URLSearchParams
 * - Defensive checks + early returns
 * - Keeps compatibility with jQuery-dependent DOM
 * - Supports delayed rendering via polling with a timeout fail-safe
 */

(() => {
    "use strict";

    // ==========================
    // Constants & Selectors
    // ==========================
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
        userInfo:"#userInfo",
        currentStep: "#currentStep",
        emailError: "#emailVerificationControl_error_message",
        attrLis: ".attr li",
        sendCodeBtn: "#emailVerificationControl_but_send_code",
    });
    const ElementMap = {
        "title": "Attribute.Salutation",
        "firstName": "Attribute.FirstName",
        "lastName": "Attribute.LastName",
        "role": "Attribute.PersonTitle",
        "professionalNumber": "Attribute.SCT_National_ID__c",
        "telephone": "Attribute.Phone",
        "speciality": "Attribute.SCT_Primary_Specialty__c",
        "profession": "Attribute.type",
        "localId": "Attribute.SCT_National_ID2__c"
    };
    const qs = (sel, ctx = document) => ctx.querySelector(sel);
    const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    const safeJSON = (str, fallback = null) => {
        try { return JSON.parse(str); } catch { return fallback; }
    };

    const getUrlParam = (param, url = window.location.href) => {
        try {
            const u = new URL(url);
            return u.searchParams.get(param);
        } catch { return null; }
    };

    const getReferrerParam = (param, ref = document.referrer) => {
        try {
            const u = new URL(ref);
            return u.searchParams.get(param);
        } catch { return null; }
    };

    const setDot = (node, ok) => {
        if (!node) return;
        node.src = ok ? ASSETS.success : ASSETS.failed;
        node.alt = ok ? "check-mark" : "cross-mark";
    };
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

                DCRPRocessor.Process();

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
    const DCRPRocessor = (() => {

        const Process = () => {
            var updateDCRRequest = GenerateUpdateRequest();
            console.log(updateDCRRequest);
        }
        const GenerateUpdateRequest = () => {
            var updateDCRBody = {};
            var queryparams = JSON.parse($(SELECTORS.queryParams).val());
            var userInfo = JSON.parse($(SELECTORS.userInfo).val());
            const formConfig = $.parseJSON($(SELECTORS.formConfig).val() || "{}");
            const step = formConfig?.steps?.[0];
            if (step && Array.isArray(step.fields)) {
                step.fields.forEach(function (UXField) {
                    const fieldId = uxField.name;
                    if (UXField.visible && UXField.fieldType != "custom") {
                        var backendPropName = ElementMap[fieldId];
                        if (!backendPropName) return;

                        var type = (UXField.type || "").toLowerCase();
                        switch (type) {
                            case "text":
                            case "dropdown":
                                value = $("$" + fieldId).val();
                                break;
                            case "checkbox":
                                value = $("$" + fieldId).is(":checked");
                                break;
                            default:
                                console.warn("Unknown field type", type);
                                value: null;
                        }
                        updateDCRBody[backendPropName] = value;
                        updateDCRBody["B2CId"] = userInfo.SCT_Azure_B2C_Id__c ?? "";
                        updateDCRBody["CountryCode"] = queryparams.countryCode ?? "";
                        updateDCRBody["ApplicationType"] = queryparams.applicationType ?? "HCP";
                        updateDCRBody["Attribute.PersonEmail"] = userInfo.PersonEmail ?? "";
                    }
                });
            }
            return updateDCRBody;
        };
        return { Process };
    })();
    // ==========================
    // Field loader (per-step)
    // ==========================
    const Fields = (() => {
        const hideAllAttrLis = () => {
            qsa(SELECTORS.attrLis).forEach((li) => { li.style.display = "none"; });
        };

        const applyUXField = (uxField) => {


            if (!uxField) return;

            const fieldId = uxField.name;
            const fieldAttr = `.${fieldId}_li`;
            const fieldAttrLabelId = `#${fieldId}_label`;
            try {


                // custom block
                if (uxField.fieldType === "custom" && uxField.visible) {
                    if (uxField.text != null) {
                        $(`#${uxField.name}`).text(uxField.text);
                    }
                    return;
                }

                if (uxField.visible) {
                    // required mark + SA_FIELDS back-compat
                    if (uxField.required && window.SA_FIELDS && Array.isArray(window.SA_FIELDS.AttributeFields)) {
                        const idx = window.SA_FIELDS.AttributeFields.findIndex((o) => o.ID === fieldId);
                        if (idx >= 0) {
                            window.SA_FIELDS.AttributeFields[idx].IS_REQ = true;
                            const $label = $(fieldAttrLabelId);
                            $label.text($label.text() + "*");
                        }
                    }

                    $(fieldAttr).show();

                    // Inject custom content
                    if (uxField.content && uxField.content.value !== undefined) {
                        const path = atob(uxField.content.path);
                        const html = decodeURIComponent(escape(atob(uxField.content.value)));
                        $(path).html(html);
                    }

                    // Dropdown options
                    if (uxField.type === "dropdown" && Array.isArray(uxField.options)) {
                        const $select = $(`select#${uxField.name}`);
                        $select.find("option:not(:first)").remove();

                        const sorted = [...uxField.options].sort((a, b) => String(a.key).localeCompare(String(b.key)));
                        sorted.forEach((opt) => {
                            $select.append($("<option></option>").attr("value", opt.value).text(opt.key));
                        });

                        if (uxField.SelectedIndex !== undefined) {
                            $select.find(`option:eq(${uxField.SelectedIndex})`).attr("selected", "selected");
                        }
                    }
                } else {
                    $(fieldAttr).hide();
                }
            }
            catch
            {
                console.log("Error loading Field:" + uxField.name);
            }
        };

        const load = () => {
            const currentStep = Number($(SELECTORS.currentStep).val() || 0);
            const formConfig = $.parseJSON($(SELECTORS.formConfig).val() || "{}");

            hideAllAttrLis();

            const step = formConfig?.steps?.[currentStep];
            if (step && Array.isArray(step.fields)) {
                step.fields.forEach(applyUXField);
            }
            HandleTabEvents(0);
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

        const ready = () => Boolean(window.pageReady) && $(SELECTORS.continueBtn).is(":visible");

        const tryInit = () => {
            if (!ready()) {
                if (Date.now() - startedAt > TIMEOUT_MS) {
                    clearInterval(handle);
                    // Soft fail: do nothing; page likely not in expected state.
                }
                return;
            }
            Fields.load();
            clearInterval(handle);
        };

        const start = () => {
            startedAt = Date.now();
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
})();
