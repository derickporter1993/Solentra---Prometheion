import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getPublicViews from "@salesforce/apex/TrustCenterController.getPublicViews";
import triggerDataAggregation from "@salesforce/apex/TrustCenterController.triggerDataAggregation";
import TC_DashboardTitle from "@salesforce/label/c.TC_DashboardTitle";
import TC_ComplianceStatus from "@salesforce/label/c.TC_ComplianceStatus";
import TC_NoFrameworks from "@salesforce/label/c.TC_NoFrameworks";
import TC_NoViews from "@salesforce/label/c.TC_NoViews";
import TC_Loading from "@salesforce/label/c.TC_Loading";
import TC_Error from "@salesforce/label/c.TC_Error";
import TC_ErrorGeneric from "@salesforce/label/c.TC_ErrorGeneric";
import TC_RunAggregation from "@salesforce/label/c.TC_RunAggregation";
import TC_AggregationComplete from "@salesforce/label/c.TC_AggregationComplete";

/**
 * Main admin dashboard for managing Trust Center compliance views.
 * Displays compliance framework badges with scores and provides
 * data aggregation controls. Embeds trustCenterLinkManager as a child.
 *
 * @author Elaro Team
 * @since v3.1.0 (Spring '26)
 * @group Trust Center
 */
export default class TrustCenterDashboard extends LightningElement {
  label = {
    TC_DashboardTitle,
    TC_ComplianceStatus,
    TC_NoFrameworks,
    TC_NoViews,
    TC_Loading,
    TC_Error,
    TC_ErrorGeneric,
    TC_RunAggregation,
    TC_AggregationComplete,
  };

  views = [];
  error;
  isLoading = true;
  isAggregating = false;
  _wiredViewsResult;

  @wire(getPublicViews)
  wiredViews(result) {
    this._wiredViewsResult = result;
    const { error, data } = result;
    this.isLoading = false;
    if (data) {
      this.views = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.views = [];
    }
  }

  get hasError() {
    return !!this.error;
  }

  get isEmpty() {
    return !this.views || this.views.length === 0;
  }

  get errorMessage() {
    if (!this.error) {
      return "";
    }
    return this.error?.body?.message || this.error?.message || this.label.TC_ErrorGeneric;
  }

  async handleAggregation() {
    this.isAggregating = true;
    try {
      await triggerDataAggregation();
      this.dispatchEvent(
        new ShowToastEvent({
          title: this.label.TC_DashboardTitle,
          message: this.label.TC_AggregationComplete,
          variant: "success",
        })
      );
      await refreshApex(this._wiredViewsResult);
    } catch (err) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: this.label.TC_Error,
          message: err?.body?.message || this.label.TC_ErrorGeneric,
          variant: "error",
        })
      );
    } finally {
      this.isAggregating = false;
    }
  }
}
