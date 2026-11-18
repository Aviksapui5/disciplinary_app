sap.ui.define(["sap/ui/core/library"], function (coreLibrary) {
    "use strict";

     var ValueState = coreLibrary.ValueState;

    // Single switch-case: one place to maintain status -> state/icon
    function getStatusConfig(sStatus) {
        switch (sStatus) {
            case "OPENED":
                return { state: ValueState.Information};
            case "ALLEGATION_ISSUED":
                return { state: ValueState.Warning};
            case "RESPONSE_PENDING":
                return { state: ValueState.Warning};
            case "UNDER_INVESTIGATION":
                return { state: ValueState.Information};
            case "OUTCOME_PENDING":
                return { state: ValueState.Warning};
            case "OUTCOME_ISSUED":
                return { state: ValueState.Success};
            case "CLOSED":
                return { state: ValueState.Success };
            case "REOPENED":
                return { state: ValueState.Error};
            case "DELETED_DUPLICATE":
                return { state: ValueState.None};
            default:
                return { state: ValueState.None};
        }
    }

    return {
        statusState: function (sStatus) {
            return getStatusConfig(sStatus).state;
        },

        // OUTCOME_PENDING -> Outcome Pending
        statusText: function (sStatus) {
            if (!sStatus) { return ""; }
            return sStatus
                .toLowerCase()
                .split("_")
                .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
                .join(" ");
        }
    };

});