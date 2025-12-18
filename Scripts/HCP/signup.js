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
        passwordRefernceInput: "#newPasswordReference",
        passwordStrength: ".passwordStrength",
        passwordStrengthFill: "#strength-fill",
        ruleLength: "#rule-length",
        ruleNumber: "#rule-number",
        ruleSpecial: "#rule-special",
        header: ".header",
        dots: ".dots span",
        queryParams: "#queryparams",
        formConfig: "#FormConfig",
        currentStep: "#currentStep",
        emailError: "#emailVerificationControl_error_message",
        attrLis: ".attr li",
        sendCodeBtn: "#emailVerificationControl_but_send_code",
    });

    const ASSETS = Object.freeze({
        success: "https://slr-snz-dev-assets.pages.dev/objects/success.svg",
        failed: "https://slr-snz-dev-assets.pages.dev/objects/failed.svg",
    });

    // ==========================
    // Utilities
    // ==========================
    const qs = (sel, ctx = document) => ctx.querySelector(sel);
    const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    const setDisabled = ($el, disabled = true) => {
        if (!$el || !$el.length) return;
        $el.prop("disabled", disabled)
            .attr("aria-disabled", String(disabled))
            .toggleClass("disabled", disabled)
            .css("pointer-events", disabled ? "none" : "auto");
    };

    const byId = (id) => document.getElementById(id);

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

    // ==========================
    // Password Strength & Toggle
    // ==========================
    const Password = (() => {
        const validate = (pwd) => {
            const strengthFill = qs(SELECTORS.passwordStrengthFill);
            const ruleLength = qs(SELECTORS.ruleLength);
            const ruleNumber = qs(SELECTORS.ruleNumber);
            const ruleSpecial = qs(SELECTORS.ruleSpecial);

            let strength = 0;
            const lenOk = pwd.length >= 8 && pwd.length <= 16;
            if (lenOk) strength += 1;
            const numOk = /[0-9]/.test(pwd);
            if (numOk) strength += 1;
            const specialOk = /[!@#$%^&*()_\-+={}\[\]|\\:;"'<>,.?\/~`]/.test(pwd);
            if (specialOk) strength += 1;

            const width = (strength / 3) * 100;
            if (strengthFill) {
                // Base width
                strengthFill.style.width = (pwd.length && width === 0) ? "10%" : `${width}%`;
                // Color ramp
                if (pwd.length && width === 0) {
                    strengthFill.style.background = "#4D4D57";
                } else if (width > 33 && width <= 50) {
                    strengthFill.style.background = "#C63736";
                } else if (width < 75 && width > 50) {
                    strengthFill.style.background = "#CB862C";
                } else if (width >= 75) {
                    strengthFill.style.background = "#1A717A";
                }
            }

            setDot(ruleLength, lenOk);
            setDot(ruleNumber, numOk);
            setDot(ruleSpecial, specialOk);

            return lenOk && numOk && specialOk;
        };

        const addToggle = () => {
            const input = qs(SELECTORS.passwordInput);
            const passwordRefernceInput = qs(SELECTORS.passwordRefernceInput);
            if (!input) return;

            // avoid duplicates
            if (document.querySelector(".password-container")) {
                // ensure listener
                input.removeEventListener("input", onInput);
                input.addEventListener("input", onInput);
                return;
            }

            const container = document.createElement("div");
            container.className = "password-container";

            // Insert container before input and move input inside
            input.parentNode?.insertBefore(container, input);
            container.appendChild(input);

            const toggleBtn = document.createElement("span");
            toggleBtn.className = "toggle-password";
            toggleBtn.textContent = "👁"; // replace with SVG if needed
            toggleBtn.addEventListener("click", () => {
                input.type = input.type === "password" ? "text" : "password";
            });

            container.appendChild(toggleBtn);
           
            function onInput() {
                passwordRefernceInput.value = input.value;
                validate(input.value);
            }
            input.addEventListener("input", onInput);
        };

        return { validate, addToggle };
    })();

    // ==========================
    // Header & Steps
    // ==========================
    const Steps = (() => {
        const setHeader = (step) => {
            const $dots = $(SELECTORS.dots);
            const $header = $(SELECTORS.header);

            switch (Number(step)) {
                case 0:
                    $header.text("Choose your country!");
                    $dots.removeClass("active");
                    break;
                case 1:
                    Password.addToggle();
                    $(SELECTORS.passwordStrength).show().appendTo(".newPassword_li");
                    $dots.removeClass("active").eq(0).addClass("active");
                    break;
                case 2:
                    $header.text("Profile Information 2/3");
                    $dots.removeClass("active").eq(1).addClass("active");
                    break;
                case 3:
                    $header.text("Profile Information 3/3");
                    $dots.removeClass("active").eq(2).addClass("active");
                    break;
                default:
                    $dots.removeClass("active");
            }
        };

        return { setHeader };
    })();

    // ==========================
    // Countries
    // ==========================
    const Countries = (() => {
        const load = (countries) => {
            const dropdown = qs(SELECTORS.countryDropdown);
            if (!dropdown || !countries) return;
            Object.entries(countries).forEach(([name, code]) => {
                const option = document.createElement("option");
                option.value = String(code);
                option.textContent = String(name);
                dropdown.appendChild(option);
            });
        };

        return { load };
    })();

    // ==========================
    // Policy / UI arrangements
    // ==========================
    const UI = (() => {
        const setPolicy = () => {
            const $label = $("label[for='TnCPolicy_true']");
            const html =
                "<div>I have read and accept the  <a id='signup' target='_blank' href='https://prod.solar.sandoz.com/us-en/terms-of-use/'>Terms of Use</a> and Sandoz <a id='signup' target='_blank' href='https://prod.solar.sandoz.com/us-en/privacy-policy/'>Privacy Policy</a>.</div>";
            $label.html(html);
        };

        const arrange = () => {
            // Remove stale custom cancel
            if ($(SELECTORS.customCancelBtn).is(":visible")) {
                $(SELECTORS.customCancelBtn).remove();
            }

            // Insert fresh custom cancel next to continue
            $(SELECTORS.continueBtn).after("<button id='customCancel'>Cancel</button>");
            $(SELECTORS.customCancelBtn).text($(SELECTORS.cancelBtn).text());
            setPolicy();
        };

        const attachCancelHandler = () => {
            $(document).off("click", SELECTORS.customCancelBtn).on("click", SELECTORS.customCancelBtn, (e) => {
                e.preventDefault();
                const returnUrl = getUrlParam("return_url") || ""; // encoded FE URL

                const isSignIn = IsSignInFlow(); // Provided by hosting page (unchanged)
                const redirectURI = isSignIn ? getReferrerParam("redirect_uri") : getUrlParam("redirect_uri");
                const base = decodeURIComponent(redirectURI || "");

                const url = `${base}#error=access_denied&error_description=AAD_Custom_466:${returnUrl}`;
                window.location.replace(url);
                e.stopPropagation();
            });
        };

        return { arrange, attachCancelHandler };
    })();


    const LoadDDStyle = ((fieldId) => {

        try {
            $("select").each(function () {

                var idSelector = "#" + $(this).attr("id");
                var idSelectorLabel = idSelector + "_label";

                //if ($(this).attr("id") != "country")
                //    return;
                console.log('Select2 loaded!');
                // Initialize Select2
                $(idSelector).select2({
                    //placeholder: 'Select a country',
                    templateResult: formatOption,
                    templateSelection: formatOption,
                    dropdownParent: $('.DropdownSingleSelect')
                });

                // Custom option formatting (if data-icon exists)
                function formatOption(option) {
                    if (!option.id) return option.text;
                    const icon = $(option.element).data('icon');
                    return icon
                        ? $('<span><img src="' + icon + '" style="width:20px;height:14px;margin-right:8px;">' + option.text + '</span>')
                        : option.text;
                }

                // Dropdown open styling and positioning
                $(idSelector).on('select2:open', function () {
                    const $dropdown = $('.select2-dropdown');
                    const $container = $(idSelectorLabel);
                    const inputHeight = $container.find('.select2').outerHeight();

                    // Lock dropdown position
                    $dropdown.css({
                        position: 'absolute',
                        top: (inputHeight - 10) + 'px',
                        left: 0,
                        width: $container.find('.select2').outerWidth() + 'px'
                    });

                    // Observe style changes
                    const observer = new MutationObserver(() => {
                        $dropdown.css({
                            position: 'absolute',
                            top: (inputHeight - 10) + 'px',
                            left: 0,
                            width: $container.find('.select2').outerWidth() + 'px'
                        });
                    });
                    observer.observe($dropdown[0], { attributes: true, attributeFilter: ['style'] });

                    // Stop observing on close
                    $(idSelector).one('select2:closing', () => observer.disconnect());

                    // Add search icon if not present
                    const searchField = $('.select2-search__field');
                    if (!searchField.next('.search-icon').length) {
                        searchField.after('<span class="search-icon" style="position:absolute; right:15px; top:40%; transform:translateY(-50%); width:22px; height:22px; background:url(https://slr-snz-dev-assets.pages.dev/objects/search.svg) no-repeat center; background-size:22px;"></span>');
                        $('.select2-search').css('position', 'relative');
                    }

                    // Update placeholder and dropdown style
                    //searchField.attr('placeholder', 'Search your Country');
                    $('.select2-dropdown').css({
                        'border': '1px solid var(--grey-300)',
                        'border-radius': '8px',
                        'box-shadow': '0 2px 6px 0 rgba(0, 0, 0, 0.15)'
                    });

                    // Rotate arrow
                    $('.select2-selection__arrow').css('transform', 'rotate(180deg)');
                });

                // Reset arrow rotation on close
                $(idSelector).on('select2:close', function () {
                    $('.select2-selection__arrow').css('transform', 'rotate(0deg)');
                });
            });
        }
        catch {

        }

    });
    // ==========================
    // Configuration checks
    // ==========================
    const Config = (() => {
        const checkFormConfiguration = (queryParams, formConfig) => {
            const $continue = $(SELECTORS.continueBtn);
            const $sendCode = $(SELECTORS.sendCodeBtn);
            const $error = $(SELECTORS.emailError);

            const cc = (queryParams && queryParams.countryCode) || "";
            const hasCode = cc && cc !== "{OAUTH-KV:cc}";

            let configured = false;
            if (hasCode && formConfig && formConfig.countries) {
                for (const [name, code] of Object.entries(formConfig.countries)) {
                    if (String(cc).toUpperCase() === String(code).toUpperCase()) {
                        configured = true;
                        break;
                    }
                }
            }

            if (!configured) {
                setDisabled($continue, true);
                setDisabled($sendCode, true);
                $error.text("Invalid configuration for this country. Please check the configuration!").show();
            }
        };

        return { checkFormConfiguration };
    })();

    // ==========================
    // Field loader (per-step)
    // ==========================
    const Fields = (() => {
        const hideAllAttrLis = () => {
            qsa(SELECTORS.attrLis).forEach((li) => { li.style.display = "none"; });
        };

        const SetRequiredFields = () => {
            $('label.required').each(function () {

                // Replace the star with a span for styling
                var html = $(this).html().replace('*', '<span class="star">*</span>');
                $(this).html(html);

            });
        }

        const applyUXField = (uxField) => {


            if (!uxField) return;

            const attributeListId = $("#attributeList");
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
                            var html = $label.html().replace('*', '<span class="star">*</span>');
                            $label.html(html);
                        }
                    }

                    attributeListId.append($(fieldAttr));
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
            const queryParams = safeJSON($(SELECTORS.queryParams).val(), {});
            const currentStep = Number($(SELECTORS.currentStep).val() || 0);
            const formConfig = $.parseJSON($(SELECTORS.formConfig).val() || "{}");

            Steps.setHeader(currentStep);

            if (currentStep === 0) {
                Countries.load(formConfig.countries);
            }

            if (currentStep === 1) {
                Config.checkFormConfiguration(queryParams, formConfig);
            }

            if (currentStep === 2 || currentStep === 3) {
                hideAllAttrLis();
            }

            SetRequiredFields();
            const step = formConfig?.steps?.[currentStep];
            if (step && Array.isArray(step.fields)) {
                step.fields.forEach(applyUXField);
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

        const ready = () => Boolean(window.pageReady) && $(SELECTORS.continueBtn).is(":visible");

        const tryInit = () => {
            if (!ready()) {
                if (Date.now() - startedAt > TIMEOUT_MS) {
                    clearInterval(handle);
                    // Soft fail: do nothing; page likely not in expected state.
                }
                return;
            }

            UI.arrange();
            Fields.load();
            LoadDDStyle();
            UI.attachCancelHandler();
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
        Password,
        Steps,
        Countries,
        UI,
        Config,
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
