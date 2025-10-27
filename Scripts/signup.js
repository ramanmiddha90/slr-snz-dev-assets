(function onPageReady() {
    var intervalHandle = setInterval(
        function () {
            if (window.pageReady) {

                const observer = new MutationObserver(() => {
                    const dropdown = document.querySelector("select[aria-label='Country']");
                    // $("#country").addClass("form-control");
                    // if (dropdown && !dropdown.classList.contains("select2-hidden-accessible")) {
                    //     // $(dropdown).select2({


                    //     //     theme: "bootstrap"
                    //     // });
                    // }
                    //   new SlimSelect({
                    //         select: '#country',
                    //         placeholder: 'Search country…'
                    //     })
                    // const element = document.getElementById('country');
                    //         const choices = new Choices(element, {
                    //             searchEnabled: true,
                    //             placeholderValue: 'Search country…',
                    //             itemSelectText: '',
                    //         });
                });

                observer.observe(document.getElementById("api"), { childList: true, subtree: true });

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
               
                function setDot(node, ok) {

                    node.src = ok ? './objects/success.svg' : './objects/failed.svg';
                    node.alt = ok ? 'check-mark' : 'cross-mark'

                }
                function validatePasswordRules(pwd) {
                    let strength = 0;
                    let check = false;

                    const lenOk = pwd.length >= 8 && pwd.length <= 16;
                    if (lenOk) {
                        strength += 1
                    }
                    const numOk = /[0-9]/.test(pwd);
                    if (numOk) {
                        strength += 1

                    }
                    const specialOk = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/.test(pwd);
                    if (specialOk) {
                        strength += 1
                    }

                    let width = (strength / 3) * 100;
                    strengthFill.style.width = width + "%";

                    if (width == 0 && pwd.length) {
                        strengthFill.style.width = 10 + "%";
                        strengthFill.style.background = "#4D4D57";
                    }
                    if (width > 33 && width <= 50) {
                        strengthFill.style.background = "#C63736";
                    } else if (width < 75 && width > 50) {
                        strengthFill.style.background = "#CB862C";
                    } else if (width >= 75) {
                        strengthFill.style.background = "#1A717A";
                    }

                    setDot(ruleLength, lenOk);
                    setDot(ruleNumber, numOk);
                    setDot(ruleSpecial, specialOk);
                    return lenOk && numOk && specialOk;
                }
                function addPasswordToggle() {
                    const pwdInput = document.getElementById("newPassword");

                    // Check if B2C has rendered the field
                    if (pwdInput && !document.querySelector(".password-container")) {
                        // Create container
                        const container = document.createElement("div");
                        container.className = "password-container";

                        // Insert container before the password input
                        pwdInput.parentNode.insertBefore(container, pwdInput);

                        // Move the input into the container
                        container.appendChild(pwdInput);

                        // Add toggle button
                        const toggleBtn = document.createElement("span");
                        toggleBtn.className = "toggle-password";
                        toggleBtn.innerHTML = "👁"; // You can replace with SVG
                        toggleBtn.onclick = function () {
                            pwdInput.type = pwdInput.type === "password" ? "text" : "password";
                        };
                        container.appendChild(toggleBtn);
                    }
                    pwdInput.addEventListener('input', () => {
                        validatePasswordRules(pwdInput.value);
                    });
                }
                function GetRedirectURLFromReferrer(param) {
                    var url = document.referrer.slice(document.referrer.indexOf('?') + 1).split('&');
                    for (var i = 0; i < url.length; i++) {
                        var urlparam = url[i].split('=');
                        if (urlparam[0].toUpperCase() == param.toUpperCase()) {
                            return urlparam[1];
                        }

                    }
                    return null;
                }
                function GetQueryParamValue() {
                    var queryparams = JSON.parse($("#queryparams").val());
                    countryCode = queryparams.countryCode;
                }
                function LoadCountries(countries, countryCode) {
                    const dropdown = document.getElementById("country");


                    for (const [name, code] of Object.entries(countries)) {

                        const option = document.createElement("option");
                        option.value = code;   // backend code (e.g., AD)
                        option.textContent = name; // user-facing label (e.g., Andorra)
                        dropdown.appendChild(option);
                    }
                }
                function SetHeader(currentStep) {
                    if (currentStep == -1) {
                        $(".header").text("Choose your country!");
                        $(".dots span:nth-of-type(1)").removeClass("active");
                        $(".dots span:nth-of-type(2)").removeClass("active");
                        $(".dots span:nth-of-type(3)").removeClass("active");
                    }
                    if(currentStep==1){
                        addPasswordToggle();
                        $(".passwordStrength").show();
                        $(".passwordStrength").appendTo(".newPassword_li")
                    }
                    if (currentStep == 2) {
                        $(".header").text("Profile Information 2/3")
                        $(".dots span:nth-of-type(2)").addClass("active");
                        $(".dots span:nth-of-type(1)").removeClass("active");
                        $(".dots span:nth-of-type(3)").removeClass("active");
                    }
                    if (currentStep == 3) {
                        $(".header").text("Profile Information 3/3")
                        $(".dots span:nth-of-type(3)").addClass("active");
                        $(".dots span:nth-of-type(1)").removeClass("active");
                        $(".dots span:nth-of-type(2)").removeClass("active");
                    }
                }

                function CheckFormConfiguraiton(queryparams, formConfig) {
                    var hasCountrCode = queryparams.countryCode != undefined && queryparams.countryCode != "" && queryparams.countryCode != "{OAUTH-KV:cc}";
                    var continueButton = document.getElementById("continue");
                    var sendButton = document.getElementsByClassName("sendCode");
                    //if has country code
                    var isCountryConfigured = false;
                    if (hasCountrCode) {
                        //check country is configured
                        for (const [name, code] of Object.entries(formConfig.countries)) {
                            if (queryparams.countryCode.toUpperCase() == code.toUpperCase()) {
                                console.log("Country Code Found");
                                //   document.getElementById('country').value =queryparams.countryCode;
                                isCountryConfigured = true;
                                break;
                            }
                        }
                    }
                    if (!isCountryConfigured) {
                        continueButton.disabled = true;
                        $("#emailVerificationControl_error_message").text("Invalid configuraiton for this country.Please check the configuration!");
                        $("#emailVerificationControl_error_message").show();
                        DisableField($("#continue"));
                        DisableField($("#emailVerificationControl_but_send_code"));

                    }

                }

                function DisableField(field) {
                    field.prop("disabled", true);           // native disabled (matches :disabled)
                    field.attr("aria-disabled", "true");     // aria selector
                    field.addClass("disabled");
                    field.css("pointer-events", "none");
                }

                function LoadFields() {
                    try {
                        var queryparams = JSON.parse($("#queryparams").val());
                        var currentStepVal = $("#currentStep").val();
                        var countryCode = queryparams.countryCode;
                        SetHeader(currentStepVal);

                        var hasCountrCode = queryparams.countryCode != undefined && queryparams.countryCode != "" && queryparams.countryCode != "{OAUTH-KV:cc}";
                        var formConfig = $.parseJSON($("#FormConfig").val());
                        if (currentStepVal == -1) {
                            LoadCountries(formConfig.countries);
                            return;
                        }
                        var currentStep = currentStepVal - 2;
                        if (currentStepVal == 1) {
                            CheckFormConfiguraiton(queryparams, formConfig);
                        }
                        formConfig.steps[currentStep].fields.forEach(function (UXField) {
                            var fieldId = UXField.name;
                            var fieldAttr = "." + fieldId + "_li";
                            var fieldAttrLabelId = "#" + fieldId + "_label";

                            if (fieldId == "country") {
                                 LoadCountries(formConfig.countries);
                                  document.getElementById('country').value =queryparams.countryCode;
                                if (hasCountrCode) {
                                    UXField.visible = false;
                                    UXField.required = false;

                                }
                                else {

                                    UXField.visible = true;
                                    UXField.required = true;
                                }
                            }
                            if (UXField.visible) {

                                if (UXField.required) {
                                    let objIndex = SA_FIELDS.AttributeFields.findIndex(
                                        (obj) => obj.ID == fieldId
                                    );
                                    if (objIndex >= 0) {
                                        //Update object's name property.
                                        SA_FIELDS.AttributeFields[objIndex].IS_REQ = true;
                                        $(fieldAttrLabelId).text($(fieldAttrLabelId).text() + "*");
                                    }
                                }
                                else {
                                    $(fieldAttr).show();

                                }
                                if (UXField.content != undefined && UXField.content.value != undefined) {
                                    var path = atob(UXField.content.path);
                                    $(path).html(decodeURIComponent(escape(atob(UXField.content.value))));
                                }
                                if (UXField.type == "dropdown" && UXField.options != undefined) {
                                    $("select#" + UXField.name).find('option:not(:first)').remove();
                                    const sorted = UXField.options.sort((a, b) => a.key.localeCompare(b.key));

                                    // Add a placeholder option
                                    // Populate dropdown with sorted items
                                    $.each(sorted, function (index, item) {
                                        $("select#" + UXField.name).append(
                                            $("<option></option>")
                                                .attr("value", item.value)  // submitted value
                                                .text(item.key)             // display text
                                        );
                                    });
                                    // //console.log(options);
                                    // $.each(options, function (value, key) {

                                    //     $("select#" + UXField.Id).append(
                                    //         $('<option></option>').val(value).text(key)
                                    //     );
                                    //     console.log("key:" + key + "Value:" + value);
                                    // });
                                    if (UXField.SelectedIndex != undefined)
                                        $("select#" + UXField.Id).find('option:eq(' + UXField.SelectedIndex + ')').attr('selected', 'selected');
                                }
                            }
                            else {
                                $(fieldAttr).hide();
                            }

                        });

                    }
                    catch {

                    }
                }

                function SetPolicyTC() {
                    var sigupPolicyURL = $("label[for='TnCPolicy_true']");
                    var labelText = "<div>I have read and accept the  <a id='signup' target='_blank'  href='https://prod.solar.sandoz.com/us-en/terms-of-use/'>Terms of Use</a> and Sandoz <a id='signup' target='_blank'  href='https://prod.solar.sandoz.com/us-en/privacy-policy/'>Privacy Policy</a>.</div>";
                    sigupPolicyURL.html(labelText);
                }
                function ArrangeUIElements() {
                    if ($("#customCancel") && $("#customCancel").is(':visible')) {
                        $("#customCancel").remove();
                    }
                    $("#continue").after("<button id='customCancel'>Cancel</button>");
                    $("#customCancel").text($("#cancel").text())
                    SetPolicyTC();
                    // $("#requiredFieldMissing").before("<div class='intro'><p id='introaccountheader_lbl' class='customLabelIntro'>Account Details</p></div>");
                    // if ($("#api"))
                    //     $("#api > .intro:eq(0) ").before("<div class='pageheader intropageheader intro'><p id='intropageheader_lbl'>Register</p></div>");
                    // // if ($(".FieldInfo_li"))
                    //     $(".FieldInfo_li").after("<li class='TextBox scoutUserFirstName_li'><div class='intro'><p id='personalInfo_lbl' class='customLabelIntro'>Personal Information</p></div></li>");

                }
                function AttachCancelEvent() {
                    $("#customCancel").click(function (e) {
                        var returnUrl = GetParameterValues('return_url'); //Encoded value FE URL
                        if (returnUrl == null)
                            returnUrl = "";
                        var redirectURI = "";
                        if (IsSignInFlow()) {
                            redirectURI = GetRedirectURLFromReferrer('redirect_uri');
                        }
                        else {
                            redirectURI = GetParameterValues('redirect_uri');

                        }
                        var url = decodeURIComponent(redirectURI) + "#error=access_denied&error_description=AAD_Custom_466:" + returnUrl;
                        window.location.replace(url);
                        e.stopPropagation();
                    });
                }
                var continuteButton = document.getElementById('continue');
                if (continuteButton && $("#continue").is(':visible')) {
                    ArrangeUIElements();
                    LoadFields();
                    AttachCancelEvent();
                    clearInterval(intervalHandle);
                }
            }
        }, 50);
}());