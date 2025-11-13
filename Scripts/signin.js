'use strict';

// signin.js — modern, robust rewrite for Azure AD B2C custom page
// - Removes jQuery dependency (pure DOM APIs)
// - Defensive checks around optional elements / JSON blobs
// - Clear helpers, consistent naming, early exits
// - Cleans up observers and intervals to avoid leaks
// - Keeps behavior parity with the provided script

(function initSignInPage() {
    /*** ───────────────────────── Helpers ───────────────────────── ***/
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const exists = (el) => el instanceof Element;
    const isVisible = (el) => !!el && el.offsetParent !== null && el.offsetHeight > 0 && getComputedStyle(el).display !== 'none';

    const parseJsonFromInput = (inputId) => {
        const el = document.getElementById(inputId);
        if (!exists(el)) return null;
        try { return JSON.parse(el.value || el.textContent || ''); } catch { return null; }
    };

    const byDefault = (value, fallback = '') => (value === undefined || value === null || value === '') ? fallback : value;

    const showSpinner = (show) => {
        const backdrop = document.getElementById('loader-backdrop');
        if (!exists(backdrop)) return;
        backdrop.style.display = show ? 'flex' : 'none';
    };

    const moveAfter = (node, ref) => {
        if (!exists(node) || !exists(ref) || node === ref) return;
        ref.insertAdjacentElement('afterend', node);
    };

    const getQueryParam = (key) => new URLSearchParams(window.location.search).get(key);

    const setQueryParam = (key, value) => {
        const params = new URLSearchParams(window.location.search);
        params.set(key, value);
        // Preserve hash if present
        const hash = window.location.hash || '';
        window.location.search = params.toString() + hash;
    };

    const buildAuthorizeUrl = (policy) => {
        // Expect a JSON blob with inbound params in a hidden input #queryparams
        const inbound = parseJsonFromInput('queryparams') || {};

        const countryCode = byDefault(inbound.countryCode, '');
        const applicationTy = byDefault(inbound.applicationType, 'HCP');
        const returnUrl = byDefault(inbound.return_url, '');
        const clientId = byDefault(inbound.clientId, '');
        const redirectUri = byDefault(inbound.redirect_uri, '');
        const uiLang = byDefault(inbound.userLanguage, 'EN');

        const originHost = document.domain; // e.g., contoso.b2clogin.com
        const tenantName = originHost.replace('.b2clogin.com', '') + '.onmicrosoft.com';

        const params = new URLSearchParams({
            p: policy,
            client_id: clientId,
            nonce: 'defaultNonce',
            redirect_uri: redirectUri,
            scope: 'openid',
            response_type: 'id_token',
            return_url: returnUrl,
            cc: countryCode,
            at: applicationTy,
            UI_Locales: uiLang
        });

        return `https://${originHost}/${tenantName}/oauth2/v2.0/authorize?${params.toString()}`;
    };

    const replaceServerErrorIfMatches = () => {
        const errorEl = document.getElementById('claimVerificationServerError');
        if (!exists(errorEl) || !isVisible(errorEl)) return;

        // When Microsoft renders a username/password error, swap to configured message M-0001 if present
        const text = (errorEl.textContent || '').toLowerCase();
        if (text.includes('username or password provided')) {
            const custom = getMessageByCode('M-0001');
            if (custom) errorEl.innerHTML = custom;
        }

        // Ensure error appears after #attributeList
        const attrList = document.getElementById('attributeList');
        if (exists(attrList)) moveAfter(errorEl, attrList);
    };

    const getMessageByCode = (code) => {
        const formConfig = parseJsonFromInput('FormConfig');
        if (!formConfig?.messages?.length) return $('#claimVerificationServerError')?.textContent || '';

        const msg = formConfig.messages.find((m) => m?.code === code);
        return msg?.value || $('#claimVerificationServerError')?.textContent || '';
    };

    const renderCustomFields = () => {
        const formConfig = parseJsonFromInput('FormConfig');
        if (!formConfig?.steps?.length) return;
        const step0Fields = formConfig.steps[0]?.fields || [];

        step0Fields.forEach((field) => {
            if (field.fieldType === 'custom' && field.visible && field.text != null && field.name) {
                const target = document.getElementById(field.name);
                if (exists(target)) target.textContent = String(field.text);
            }
        });
    };

    const configureIdpsVisibility = () => {
        const info = parseJsonFromInput('FieldInfo');
        if (!info?.IDPs) return;

        let anyVisible = false;
        info.IDPs.forEach((idp) => {
            const el = document.getElementById(idp.Id);
            if (!exists(el)) return;

            if (idp.Is_Visible) {
                anyVisible = true;
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });

        if (!anyVisible) $$('.socialIdps').forEach((el) => el.remove());
    };

    const hasMsValidationErrors = () => {
        const candidates = $$('.error.itemLevel, .error.pageLevel, #alert');
        return candidates.some((el) => isVisible(el));
    };

    /*** ───────────────────── UI bootstrapping ───────────────────── ***/
    const setCustomLabels = () => {
        const api = document.getElementById('api');
        if (exists(api)) {
            const intro = api.querySelector('.intro');
            if (intro) intro.insertAdjacentHTML('beforebegin', "<div class='pageheader intropageheader intro'><p id='intropageheader_lbl'>Login</p></div>");
        }

        renderCustomFields();
        // configureIdpsVisibility(); // Uncomment if you need to manage IDP visibility dynamically

        const cancel = document.getElementById('cancel');
        const customCancel = document.getElementById('customCancel');
        if (exists(cancel) && exists(customCancel)) customCancel.textContent = cancel.textContent || 'Cancel';
    };

    const wireBehavior = (policyPrefix, policyMap) => {
        // SNZ / SwissRX buttons simply swap the 'p' policy in querystring
        const snzBtn = document.getElementById('SNZ_LOGIN');
        const swissBtn = document.getElementById('SWISSRX_LOGIN');

        if (exists(snzBtn)) snzBtn.addEventListener('click', () => setQueryParam('p', `B2C_1A_SOLAR_SANDOZID_PROD_SNZ_LOGIN`));
        if (exists(swissBtn)) swissBtn.addEventListener('click', () => setQueryParam('p', `B2C_1A_SOLAR_SANDOZID_PROD_SWISSRX_LOGIN`));

        const resetAnchor = document.getElementById('resetPassword');
        if (exists(resetAnchor)) resetAnchor.addEventListener('click', () => {
            window.location.href = buildAuthorizeUrl(`${policyPrefix}_${policyMap.PASSRESET}`);
        });

        const signupAnchor = document.getElementById('signup');
        if (exists(signupAnchor)) signupAnchor.addEventListener('click', () => {
            window.location.href = buildAuthorizeUrl(`${policyPrefix}_${policyMap.SIGNUP}`);
        });
    };

    const ensureCustomCancel = () => {
        const continueBtn = document.getElementById('continue');
        if (!exists(continueBtn) || !isVisible(continueBtn)) return false;

        const status = document.getElementById('CurrentSignInStatus');
        if (exists(status)) status.value = 'NF';

        // Remove existing custom cancel if any
        const oldCustom = document.getElementById('customCancel');
        if (exists(oldCustom)) oldCustom.remove();

        // Insert custom Cancel button right after Continue
        continueBtn.insertAdjacentHTML('afterend', "<button id='customCancel'>Cancel</button>");

        // Add forgot-password link
        const pwdLis = $$('.password_li');
        if (pwdLis.length) {
            const last = pwdLis[pwdLis.length - 1];
            last.insertAdjacentHTML('beforeend', "<div class='forgot-password center-height'><a id='resetPassword' href='javascript:void(0)'>Forgot your password?</a></div>");
        }

        // Wire cancel behavior
        const customCancel = document.getElementById('customCancel');
        if (exists(customCancel)) customCancel.addEventListener('click', () => {
            const redirectUrl = getQueryParam('return_url') || '';
            const redirectUri = getQueryParam('redirect_uri') || '';
            const dest = decodeURIComponent(redirectUri) + `#error=access_denied&error_description=AAD_Custom_461:${redirectUrl}`;
            window.location.replace(dest);
        });

        return true;
    };

    const attachContinueSpinnerGuard = () => {
        const continueBtn = document.getElementById('continue');
        if (!exists(continueBtn)) return;

        continueBtn.addEventListener('click', () => {
            // Allow B2C to render validation state, then decide on showing spinner
            window.setTimeout(() => {
                if (!hasMsValidationErrors()) showSpinner(true);
            }, 400);
        });
    };

    const observeServerErrorVisibility = () => {
        const target = document.getElementById('claimVerificationServerError');
        if (!exists(target)) return { disconnect: () => { } };

        const obs = new MutationObserver(() => {
            if (isVisible(target)) {
                showSpinner(false);
                replaceServerErrorIfMatches();
            }
        });

        obs.observe(target, { attributes: true, attributeFilter: ['style', 'class'] });
        return obs;
    };

    /*** ───────────────────── Boot loop / lifecycle ───────────────────── ***/
    const POLICY_PREFIX = 'B2C_1A_SLR_SNZ';
    const policies = Object.freeze({ SNZ: 'SNZ_LOGIN', SWISSRX: 'SWISSRX_LOGIN', PASSRESET: 'PASSRESET', SIGNUP: 'SIGNUP' });

    let errorObserver = null;
    let pollHandle = null;
    let ticks = 0;
    const MAX_TICKS = 400; // 20s @ 50ms

    const tryBoot = () => {
        // Wait until the page (and B2C controls) say they're ready, and we can find a visible Continue button.
        if (!window.pageReady) return;

        const ready = ensureCustomCancel();
        if (!ready) return;

        setCustomLabels();
        attachContinueSpinnerGuard();
        wireBehavior(POLICY_PREFIX, policies);
        errorObserver = observeServerErrorVisibility();

        // One-time spinner stop if an error is already visible
        replaceServerErrorIfMatches();

        clearInterval(pollHandle);
        pollHandle = null;
    };

    pollHandle = setInterval(() => {
        try {
            if (++ticks > MAX_TICKS) {
                clearInterval(pollHandle);
                pollHandle = null;
                return;
            }
            tryBoot();
        } catch (e) {
            // Fail safe: do not crash the page, just stop polling
            clearInterval(pollHandle);
            pollHandle = null;
            // Optionally report e to a logger here
        }
    }, 50);

    window.addEventListener('beforeunload', () => {
        if (pollHandle) clearInterval(pollHandle);
        if (errorObserver?.disconnect) errorObserver.disconnect();
    });
})();