function LoadSpinner() {
	// $('body').prepend('<div class="backdrop"></div>');
	// $('form').prepend('<div id="custom_loader_container" class="verifying-modal"><div id="custom_text"></div></div>');
	// console.log($("#continue").is(':visible'));
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

function SetSpinner(showSpinner) {
	if (showSpinner == true) {

	}
	else {
		$(".backdrop").remove();
		$("#verifying_blurb").removeClass('show-process');
	}
}
function SetSpinnerObserver() {
	var targetNode = document.getElementById('claimVerificationServerError');
	var observer = new MutationObserver(function () {
		if (targetNode.style.display != 'none') {
			SetSpinner(false);
		}
	});
	observer.observe(targetNode, { attributes: true, childList: true });
}
function LoadInternalConfig() {
	LoadComapnies();
	//SetSpinnerObserver();
}
function LoadComapnies() {
	var scoutSapSoldToID = $("#scoutSapSoldToID");
	var countryCode = GetParameterValues("countryCode");
	if (countryCode == null || countryCode == "") {
		//check in queryparam field
		var queryparams = JSON.parse($("#queryparams").val());
		countryCode = queryparams.countryCode;
	}
	//&& scoutSapSoldToID.is(':visible')
	if (scoutSapSoldToID && scoutSapSoldToID.length > 0) {
		var getcomppanytask = {
			url:
				'https://auf-solar-dev-westeurope-01.azurewebsites.net/api/prod/solar/getCompanyInfo?countryCode=' + countryCode,
			method: 'GET',
			timeout: 0
		};
		try {
			$.ajax(getcomppanytask).done(function (response) {
				var companies = result = typeof response === "string" ? JSON.parse(response) : response;
				console.log(companies);
				scoutSapSoldToID.find("option:gt(0)").remove();

				companies = companies.sort((a, b) => {
					if (a.Name < b.Name) {
						return -1;
					}
				});
				companies.forEach(function (companyInfo) {
					var companyOption = new Option(companyInfo.Name, companyInfo.SCT_SAP_ID__c);
					scoutSapSoldToID.append($(companyOption));
				});
				$(".backdrop").remove();
				$("#verifying_blurb").removeClass('show-process');
			})
		} catch (e) {
			console.log(e);
			$(".backdrop").remove();
			$("#verifying_blurb").removeClass('show-process');
		}
	}
	else {
		$(".backdrop").remove();
		$("#verifying_blurb").removeClass('show-process');
	}
}

LoadSpinner();
LoadInternalConfig();