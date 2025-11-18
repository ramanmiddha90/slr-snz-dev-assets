/*
 * Refactored UI Logic – jQuery removed, modular, readable, and easy to maintain
 * - No jQuery dependency
 * - Caches selectors and constants
 * - Uses URL/URLSearchParams and safe JSON parsing
 * - Defensive checks + early returns
 * - Keeps compatibility with existing globals (SA_FIELDS, ASSETS, HandleTabEvents)
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
        userInfo: "#userInfo",
        currentStep: "#currentStep",
        emailError: "#emailVerificationControl_error_message",
        attrLis: ".attr li",
        sendCodeBtn: "#emailVerificationControl_but_send_code",
    });

    const AttributeMap = {
        "title": "Salutation",
        "firstName": "FirstName",
        "lastName": ".LastName",
        "role": "PersonTitle",
        "professionalNumber": "SCT_National_ID__c",
        "telephone": "Phone",
        "speciality": "SCT_Primary_Specialty__c",
        "profession": "type",
        "localId": "SCT_National_ID2__c"
    };

    // Short DOM helpers
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

    // Element show/hide helpers
    const showElem = (el) => { if (!el) return; el.style.display = ""; };
    const hideElem = (el) => { if (!el) return; el.style.display = "none"; };
    const setDisplayBySelector = (selector, show = true, ctx = document) => {
        qsa(selector, ctx).forEach(el => el.style.display = show ? "" : "none");
    };
    const isVisible = (el) => {
        if (!el) return false;
        // visible if in document and not display:none and not visibility:hidden and has non-zero size or visible via CSS
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
        // offsetParent covers display:none; for fixed/absolute elements offsetParent may be null so also check bounding rect
        const rect = el.getBoundingClientRect();
        return (rect.width > 0 && rect.height > 0) || el.offsetParent !== null;
    };

    const setDot = (node, ok) => {
        if (!node) return;
        if (!window.ASSETS) return; // defensive if ASSETS not available
        node.src = ok ? ASSETS.success : ASSETS.failed;
        node.alt = ok ? "check-mark" : "cross-mark";
    };

    // Reads form field value by id, handles inputs/selects/checkboxes
    const getFieldValueById = (id) => {
        const el = qs("#" + id);
        if (!el) return undefined;
        if (el.type === "checkbox" || el.type === "radio") return el.checked;
        return el.value;
    };

    // ==========================
    // Validation
    // ==========================
    const validateFields = () => {
        if (!window.SA_FIELDS || !Array.isArray(window.SA_FIELDS.AttributeFields)) {
            // nothing to validate against; assume valid
            return true;
        }
        let allFieldValid = true;
        window.SA_FIELDS.AttributeFields.forEach(field => {
            if (field.IS_REQ === true) {
                const value = getFieldValueById(field.ID);
                if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
                    console.warn("invalid value for field:", field.ID);
                    allFieldValid = false;
                }
            }
        });
        return allFieldValid;
    };

    // ==========================
    // MutationObserver (attach handlers once form and buttons exist)
    // ==========================
    const observer = new MutationObserver((mutations, obs) => {
        const form = qs("form");
        const cancelBtn = qs(SELECTORS.cancelBtn);
        const continueBtn = qs(SELECTORS.continueBtn) || qs('button[type="submit"]');

        if (form && continueBtn) {
            const lblUpdateMsg = qs("#lblUpdateMessage");
            if (lblUpdateMsg) hideElem(lblUpdateMsg);

            obs.disconnect();

            const cancelHandler = (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
            };

            const handler = (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();

                if (!validateFields()) {
                    const reqMissing = qs("#requiredFieldMissing");
                    if (reqMissing) showElem(reqMissing);
                    return;
                }

                console.log("profile update request started");

                DCRPRocessor.Process();

                //call ajax api call here
                console.log("All checks passed. Resuming B2C submission...");
            };

            continueBtn.addEventListener('click', handler, { capture: true });
            if (cancelBtn) cancelBtn.addEventListener('click', cancelHandler, { capture: true });
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // ==========================
    // DCR Processor
    // ==========================
    const DCRPRocessor = (() => {
        const Process = () => {
            const updateDCRRequest = GenerateUpdateRequest();
            console.log(JSON.stringify(updateDCRRequest));
        };

        const GenerateUpdateRequest = () => {
            const updateDCRBody = {};
            const Attribute = {};

            const qpEl = qs(SELECTORS.queryParams);
            const uiEl = qs(SELECTORS.userInfo);
            const formConfigEl = qs(SELECTORS.formConfig);

            const queryparams = qpEl ? safeJSON(qpEl.value, {}) : {};
            const userInfo = uiEl ? safeJSON(uiEl.value, {}) : {};
            const formConfig = formConfigEl ? safeJSON(formConfigEl.value, {}) : {};

            const step = formConfig?.steps?.[0];
            if (step && Array.isArray(step.fields)) {
                step.fields.forEach((UXField) => {
                    const fieldId = UXField.name;
                    if (UXField.visible && UXField.fieldType !== "custom") {
                        const backendPropName = AttributeMap[fieldId];
                        if (!backendPropName) return;

                        let value = null;
                        const type = String(UXField.type || "").toLowerCase();
                        switch (type) {
                            case "text":
                            case "dropdown":
                                value = getFieldValueById(fieldId);
                                break;
                            case "checkbox":
                                const el = qs("#" + fieldId);
                                value = el ? !!el.checked : false;
                                break;
                            default:
                                console.warn("Unknown field type", type);
                                value = null;
                        }
                        Attribute[backendPropName] = value;
                    }
                });
            }

            updateDCRBody["Attribute"] = Attribute;
            updateDCRBody["B2CId"] = (userInfo && userInfo.SCT_Azure_B2C_Id__c) ? userInfo.SCT_Azure_B2C_Id__c : "";
            updateDCRBody["CountryCode"] = queryparams.countryCode ?? "";
            updateDCRBody["ApplicationType"] = queryparams.applicationType ?? "HCP";
            updateDCRBody["Attribute.PersonEmail"] = userInfo.PersonEmail ?? "";

            return updateDCRBody;
        };

        return { Process };
    })();

    // ==========================
    // Field loader (per-step)
    // ==========================
    const Fields = (() => {
        const hideAllAttrLis = () => {
            setDisplayBySelector(SELECTORS.attrLis, false);
        };

        const applyUXField = (uxField) => {
            if (!uxField) return;

            const fieldId = uxField.name;
            const fieldAttr = `.${fieldId}_li`;
            const fieldAttrLabelId = `#${fieldId}_label`;

            try {
                // custom block
                if (uxField.fieldType === "custom" && uxField.visible) {
                    const el = qs(`#${uxField.name}`);
                    if (el && uxField.text != null) el.textContent = uxField.text;
                    return;
                }

                if (uxField.visible) {
                    // required mark + SA_FIELDS back-compat
                    if (uxField.required && window.SA_FIELDS && Array.isArray(window.SA_FIELDS.AttributeFields)) {
                        const idx = window.SA_FIELDS.AttributeFields.findIndex((o) => o.ID === fieldId);
                        if (idx >= 0) {
                            window.SA_FIELDS.AttributeFields[idx].IS_REQ = true;
                            const label = qs(fieldAttrLabelId);
                            if (label) label.textContent = label.textContent + "*";
                        }
                    }

                    setDisplayBySelector(fieldAttr, true);

                    // Inject custom content
                    if (uxField.content && uxField.content.value !== undefined) {
                        try {
                            const path = atob(uxField.content.path);
                            const html = decodeURIComponent(escape(atob(uxField.content.value)));
                            const container = qs(path);
                            if (container) container.innerHTML = html;
                        } catch (err) {
                            console.warn("Failed to inject custom content for", uxField.name, err);
                        }
                    }

                    // Dropdown options
                    if (uxField.type === "dropdown" && Array.isArray(uxField.options)) {
                        const select = qs(`select#${uxField.name}`);
                        if (select) {
                            // remove all options except first
                            const options = Array.from(select.options);
                            options.forEach((opt, i) => {
                                if (i > 0) select.removeChild(opt);
                            });

                            const sorted = [...uxField.options].sort((a, b) => String(a.key).localeCompare(String(b.key)));
                            sorted.forEach((opt) => {
                                const option = document.createElement("option");
                                option.value = opt.value;
                                option.textContent = opt.key;
                                select.appendChild(option);
                            });

                            if (uxField.SelectedIndex !== undefined && select.options[uxField.SelectedIndex]) {
                                select.selectedIndex = uxField.SelectedIndex;
                            }
                        }
                    }
                } else {
                    setDisplayBySelector(fieldAttr, false);
                }
            } catch (e) {
                console.log("Error loading Field:", uxField && uxField.name, e);
            }
        };

        const load = () => {
            const currentStepEl = qs(SELECTORS.currentStep);
            const formConfigEl = qs(SELECTORS.formConfig);

            const currentStep = currentStepEl ? Number(currentStepEl.value || 0) : 0;
            const formConfig = formConfigEl ? safeJSON(formConfigEl.value, {}) : {};

            hideAllAttrLis();

            const step = formConfig?.steps?.[currentStep];
            if (step && Array.isArray(step.fields)) {
                step.fields.forEach(applyUXField);
            }

            // keep compatibility with external function
            if (typeof HandleTabEvents === "function") {
                try { HandleTabEvents(0); } catch (err) { console.warn("HandleTabEvents failed", err); }
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
})();
