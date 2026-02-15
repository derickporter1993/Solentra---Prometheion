import { LightningElement, api, track } from "lwc";
import runAutoScan from "@salesforce/apex/AssessmentWizardController.runAutoScan";
import AW_AutoScanRunning from "@salesforce/label/c.AW_AutoScanRunning";
import AW_AutoScanComplete from "@salesforce/label/c.AW_AutoScanComplete";
import AW_AutoScanError from "@salesforce/label/c.AW_AutoScanError";
import AW_AutoScanPassCount from "@salesforce/label/c.AW_AutoScanPassCount";
import AW_AutoScanFailCount from "@salesforce/label/c.AW_AutoScanFailCount";
import AW_AutoScanNoFindings from "@salesforce/label/c.AW_AutoScanNoFindings";
import AW_AttestationPrompt from "@salesforce/label/c.AW_AttestationPrompt";
import AW_EvidenceUploadPrompt from "@salesforce/label/c.AW_EvidenceUploadPrompt";
import AW_ApprovalPrompt from "@salesforce/label/c.AW_ApprovalPrompt";
import AW_ReviewPrompt from "@salesforce/label/c.AW_ReviewPrompt";
import AW_NextStep from "@salesforce/label/c.AW_NextStep";
import AW_SaveProgress from "@salesforce/label/c.AW_SaveProgress";

export default class WizardStep extends LightningElement {
  @api step;
  @api sessionId;

  label = {
    AW_AutoScanRunning,
    AW_AutoScanComplete,
    AW_AutoScanError,
    AW_AutoScanPassCount,
    AW_AutoScanFailCount,
    AW_AutoScanNoFindings,
    AW_AttestationPrompt,
    AW_EvidenceUploadPrompt,
    AW_ApprovalPrompt,
    AW_ReviewPrompt,
    AW_NextStep,
    AW_SaveProgress,
  };

  responseValue = "";
  attestationChecked = false;
  isScanning = false;
  scanComplete = false;
  scanError = false;
  scanErrorMessage = "";
  @track scanFindings = [];

  get stepType() {
    return this.step?.stepType || "";
  }

  get isAutoScan() {
    return this.stepType === "Auto_Scan";
  }

  get isManualAttestation() {
    return this.stepType === "Manual_Attestation";
  }

  get isEvidenceUpload() {
    return this.stepType === "Evidence_Upload";
  }

  get isApproval() {
    return this.stepType === "Approval";
  }

  get isReview() {
    return this.stepType === "Review";
  }

  get stepPrompt() {
    if (this.isAutoScan && !this.isScanning && this.scanComplete) {
      return this.label.AW_AutoScanComplete;
    }
    if (this.isAutoScan) return this.label.AW_AutoScanRunning;
    if (this.isManualAttestation) return this.label.AW_AttestationPrompt;
    if (this.isEvidenceUpload) return this.label.AW_EvidenceUploadPrompt;
    if (this.isApproval) return this.label.AW_ApprovalPrompt;
    if (this.isReview) return this.label.AW_ReviewPrompt;
    return "";
  }

  get helpText() {
    return this.step?.helpText || "";
  }

  get controlReference() {
    return this.step?.controlReference || "";
  }

  get isCompleted() {
    return this.step?.status === "Completed";
  }

  get submitLabel() {
    return this.isAutoScan ? this.label.AW_NextStep : this.label.AW_SaveProgress;
  }

  get canSubmit() {
    if (this.isCompleted) return false;
    if (this.isAutoScan) return this.scanComplete;
    if (this.isManualAttestation) return this.attestationChecked;
    if (this.isEvidenceUpload) return !!this.responseValue;
    return true;
  }

  get hasFindings() {
    return this.scanFindings?.length > 0;
  }

  get passCount() {
    return this.scanFindings.filter((f) => f.result === "PASS").length;
  }

  get failCount() {
    return this.scanFindings.filter((f) => f.result === "FAIL").length;
  }

  get passCountLabel() {
    return this.label.AW_AutoScanPassCount.replace("{0}", String(this.passCount));
  }

  get failCountLabel() {
    return this.label.AW_AutoScanFailCount.replace("{0}", String(this.failCount));
  }

  get hasScanError() {
    return this.scanError && !this.isScanning;
  }

  connectedCallback() {
    if (this.isAutoScan && !this.isCompleted) {
      this.executeAutoScan();
    }
  }

  async executeAutoScan() {
    this.isScanning = true;
    this.scanComplete = false;
    this.scanError = false;
    this.scanErrorMessage = "";
    this.scanFindings = [];

    try {
      const controlRef = this.step?.controlReference || "";
      const results = await runAutoScan({
        sessionId: this.sessionId,
        stepId: this.step?.stepId || "",
        controlReferences: controlRef,
      });

      const findings = [];
      if (results) {
        for (const [control, result] of Object.entries(results)) {
          findings.push({
            key: control,
            control,
            result,
            isPassed: result === "PASS",
            isFailed: result === "FAIL",
            isNotApplicable: result === "NOT_APPLICABLE",
            badgeClass:
              result === "PASS"
                ? "slds-badge slds-theme_success"
                : result === "FAIL"
                  ? "slds-badge slds-theme_error"
                  : "slds-badge",
          });
        }
      }
      this.scanFindings = findings;
      this.scanComplete = true;
      this.responseValue = JSON.stringify({
        scanResults: results,
        findings: findings.map((f) => ({ control: f.control, result: f.result })),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      this.scanError = true;
      this.scanErrorMessage = err.body?.message || this.label.AW_AutoScanError;
    } finally {
      this.isScanning = false;
    }
  }

  handleRetryAutoScan() {
    this.executeAutoScan();
  }

  handleAttestationChange(event) {
    this.attestationChecked = event.target.checked;
    this.responseValue = this.attestationChecked ? "attested" : "";
  }

  handleTextChange(event) {
    this.responseValue = event.target.value;
  }

  handleSubmit() {
    if (!this.canSubmit) return;

    this.dispatchEvent(
      new CustomEvent("stepcomplete", {
        detail: {
          stepId: this.step?.stepId,
          responseData: this.responseValue,
        },
      })
    );
  }
}
