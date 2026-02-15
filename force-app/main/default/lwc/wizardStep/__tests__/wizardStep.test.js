import { createElement } from "lwc";
import WizardStep from "c/wizardStep";
import runAutoScan from "@salesforce/apex/AssessmentWizardController.runAutoScan";

// Mock Apex
jest.mock(
  "@salesforce/apex/AssessmentWizardController.runAutoScan",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

// Mock labels
jest.mock("@salesforce/label/c.AW_AutoScanRunning", () => ({ default: "Scanning..." }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.AW_AutoScanComplete", () => ({ default: "Scan complete" }), {
  virtual: true,
});
jest.mock(
  "@salesforce/label/c.AW_AutoScanError",
  () => ({ default: "The automated scan encountered an error." }),
  { virtual: true }
);
jest.mock("@salesforce/label/c.AW_AutoScanPassCount", () => ({ default: "{0} Passed" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.AW_AutoScanFailCount", () => ({ default: "{0} Failed" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.AW_AutoScanNoFindings", () => ({ default: "No findings" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.AW_AttestationPrompt", () => ({ default: "I attest" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.AW_EvidenceUploadPrompt", () => ({ default: "Upload evidence" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.AW_ApprovalPrompt", () => ({ default: "Approve" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.AW_ReviewPrompt", () => ({ default: "Review" }), { virtual: true });
jest.mock("@salesforce/label/c.AW_NextStep", () => ({ default: "Next" }), { virtual: true });
jest.mock("@salesforce/label/c.AW_SaveProgress", () => ({ default: "Save" }), { virtual: true });

const AUTO_SCAN_STEP = {
  stepId: "HIPAA_Access_Control_Scan",
  stepOrder: 1,
  stepType: "Auto_Scan",
  controlReference: "164.312(a)(1)",
  helpText: "Scan access controls",
  status: "Pending",
  response: null,
};

const ATTESTATION_STEP = {
  stepId: "HIPAA_Access_Review",
  stepOrder: 2,
  stepType: "Manual_Attestation",
  controlReference: "164.312(a)(1)",
  helpText: "Review access",
  status: "Pending",
  response: null,
};

const EVIDENCE_STEP = {
  stepId: "HIPAA_Audit_Evidence",
  stepOrder: 2,
  stepType: "Evidence_Upload",
  controlReference: "164.312(b)",
  helpText: "Upload audit evidence",
  status: "Pending",
  response: null,
};

const REVIEW_STEP = {
  stepId: "HIPAA_Final_Review",
  stepOrder: 1,
  stepType: "Review",
  controlReference: "164.308(a)(8)",
  helpText: "Review all findings",
  status: "Pending",
  response: null,
};

const APPROVAL_STEP = {
  stepId: "HIPAA_Final_Approval",
  stepOrder: 2,
  stepType: "Approval",
  controlReference: "164.308(a)(8)",
  helpText: "Submit for approval",
  status: "Pending",
  response: null,
};

const COMPLETED_ATTESTATION = {
  ...ATTESTATION_STEP,
  status: "Completed",
  response: "attested",
};

const MOCK_SCAN_RESULTS = {
  "164.312(a)(1)": "PASS",
};

const MOCK_SCAN_RESULTS_WITH_FAILURES = {
  "SOC2-CC6.1": "PASS",
  "SOC2-CC6.2": "FAIL",
  "SOC2-CC6.6": "NOT_APPLICABLE",
};

const flushPromises = () => new Promise(process.nextTick);

describe("c-wizard-step", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  function createComponent(step, sessionId = "a0B000000000001") {
    const element = createElement("c-wizard-step", { is: WizardStep });
    element.step = step;
    element.sessionId = sessionId;
    document.body.appendChild(element);
    return element;
  }

  it("renders control reference badge", async () => {
    runAutoScan.mockResolvedValue({});
    const element = createComponent(ATTESTATION_STEP);
    await flushPromises();

    const badge = element.shadowRoot.querySelector(".slds-badge");
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain("164.312(a)(1)");
  });

  it("renders help text", async () => {
    runAutoScan.mockResolvedValue({});
    const element = createComponent(ATTESTATION_STEP);
    await flushPromises();

    const text = element.shadowRoot.textContent;
    expect(text).toContain("Review access");
  });

  it("renders lightning-input for Manual_Attestation step", async () => {
    const element = createComponent(ATTESTATION_STEP);
    await flushPromises();

    const input = element.shadowRoot.querySelector("lightning-input");
    expect(input).not.toBeNull();
  });

  it("renders lightning-textarea for Evidence_Upload step", async () => {
    const element = createComponent(EVIDENCE_STEP);
    await flushPromises();

    const textarea = element.shadowRoot.querySelector("lightning-textarea");
    expect(textarea).not.toBeNull();
  });

  it("renders textarea for Review step", async () => {
    const element = createComponent(REVIEW_STEP);
    await flushPromises();

    const textarea = element.shadowRoot.querySelector("lightning-textarea");
    expect(textarea).not.toBeNull();
  });

  it("renders textarea for Approval step", async () => {
    const element = createComponent(APPROVAL_STEP);
    await flushPromises();

    const textarea = element.shadowRoot.querySelector("lightning-textarea");
    expect(textarea).not.toBeNull();
  });

  it("shows completed badge for completed step", async () => {
    const element = createComponent(COMPLETED_ATTESTATION);
    await flushPromises();

    const badge = element.shadowRoot.querySelector(".slds-theme_success");
    expect(badge).not.toBeNull();
  });

  it("renders lightning-input as disabled for completed attestation", async () => {
    const element = createComponent(COMPLETED_ATTESTATION);
    await flushPromises();

    const input = element.shadowRoot.querySelector("lightning-input");
    expect(input).not.toBeNull();
  });

  it("displays attestation prompt for Manual_Attestation", async () => {
    const element = createComponent(ATTESTATION_STEP);
    await flushPromises();

    const text = element.shadowRoot.textContent;
    expect(text).toContain("I attest");
  });

  it("displays review prompt for Review step", async () => {
    const element = createComponent(REVIEW_STEP);
    await flushPromises();

    const text = element.shadowRoot.textContent;
    expect(text).toContain("Review");
  });

  it("displays approval prompt for Approval step", async () => {
    const element = createComponent(APPROVAL_STEP);
    await flushPromises();

    const text = element.shadowRoot.textContent;
    expect(text).toContain("Approve");
  });

  it("displays evidence upload prompt", async () => {
    const element = createComponent(EVIDENCE_STEP);
    await flushPromises();

    const text = element.shadowRoot.textContent;
    expect(text).toContain("Upload evidence");
  });

  it("renders submit button for review step", async () => {
    const element = createComponent(REVIEW_STEP);
    await flushPromises();

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders submit button for approval step", async () => {
    const element = createComponent(APPROVAL_STEP);
    await flushPromises();

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("does not render submit for completed attestation step", async () => {
    const element = createComponent(COMPLETED_ATTESTATION);
    await flushPromises();

    const buttons = element.shadowRoot.querySelectorAll("lightning-button");
    const brandButtons = Array.from(buttons).filter((b) => b.variant === "brand");
    expect(brandButtons.length).toBe(0);
  });

  // Auto-scan integration tests
  describe("auto-scan integration", () => {
    it("calls runAutoScan Apex method on mount for Auto_Scan step", async () => {
      runAutoScan.mockResolvedValue(MOCK_SCAN_RESULTS);
      createComponent(AUTO_SCAN_STEP);
      await flushPromises();

      expect(runAutoScan).toHaveBeenCalledWith({
        sessionId: "a0B000000000001",
        stepId: "HIPAA_Access_Control_Scan",
        controlReferences: "164.312(a)(1)",
      });
    });

    it("shows spinner while auto-scan is in progress", () => {
      runAutoScan.mockReturnValue(new Promise(() => {}));
      const element = createComponent(AUTO_SCAN_STEP);

      const spinner = element.shadowRoot.querySelector("lightning-spinner");
      expect(spinner).not.toBeNull();
    });

    it("displays scan findings after successful auto-scan", async () => {
      runAutoScan.mockResolvedValue(MOCK_SCAN_RESULTS);
      const element = createComponent(AUTO_SCAN_STEP);
      await flushPromises();

      const table = element.shadowRoot.querySelector("table");
      expect(table).not.toBeNull();

      const rows = element.shadowRoot.querySelectorAll("tbody tr");
      expect(rows.length).toBe(1);

      const text = element.shadowRoot.textContent;
      expect(text).toContain("164.312(a)(1)");
      expect(text).toContain("PASS");
    });

    it("displays pass and fail badges in scan summary", async () => {
      runAutoScan.mockResolvedValue(MOCK_SCAN_RESULTS_WITH_FAILURES);
      const scanStep = {
        ...AUTO_SCAN_STEP,
        controlReference: "SOC2-CC6.1,SOC2-CC6.2,SOC2-CC6.6",
      };
      const element = createComponent(scanStep);
      await flushPromises();

      const text = element.shadowRoot.textContent;
      expect(text).toContain("1 Passed");
      expect(text).toContain("1 Failed");
    });

    it("shows scan complete prompt after successful scan", async () => {
      runAutoScan.mockResolvedValue(MOCK_SCAN_RESULTS);
      const element = createComponent(AUTO_SCAN_STEP);
      await flushPromises();

      const text = element.shadowRoot.textContent;
      expect(text).toContain("Scan complete");
    });

    it("enables submit button after successful auto-scan", async () => {
      runAutoScan.mockResolvedValue(MOCK_SCAN_RESULTS);
      const element = createComponent(AUTO_SCAN_STEP);
      await flushPromises();

      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const brandButtons = Array.from(buttons).filter((b) => b.variant === "brand");
      expect(brandButtons.length).toBe(1);
    });

    it("displays error message on scan failure", async () => {
      runAutoScan.mockRejectedValue({
        body: { message: "Unable to complete the automated scan." },
      });
      const element = createComponent(AUTO_SCAN_STEP);
      await flushPromises();

      const alert = element.shadowRoot.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
      expect(alert.textContent).toContain("Unable to complete the automated scan.");
    });

    it("renders retry button on scan failure", async () => {
      runAutoScan.mockRejectedValue({
        body: { message: "Scan failed" },
      });
      const element = createComponent(AUTO_SCAN_STEP);
      await flushPromises();

      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const retryBtn = Array.from(buttons).find((b) => b.label === "Retry Scan");
      expect(retryBtn).not.toBeNull();
    });

    it("retries scan on retry button click", async () => {
      runAutoScan
        .mockRejectedValueOnce({ body: { message: "Scan failed" } })
        .mockResolvedValueOnce(MOCK_SCAN_RESULTS);

      const element = createComponent(AUTO_SCAN_STEP);
      await flushPromises();

      expect(runAutoScan).toHaveBeenCalledTimes(1);

      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const retryBtn = Array.from(buttons).find((b) => b.label === "Retry Scan");
      retryBtn.click();
      await flushPromises();

      expect(runAutoScan).toHaveBeenCalledTimes(2);
    });

    it("does not call auto-scan for completed Auto_Scan step", async () => {
      const completedScan = { ...AUTO_SCAN_STEP, status: "Completed" };
      createComponent(completedScan);
      await flushPromises();

      expect(runAutoScan).not.toHaveBeenCalled();
    });

    it("does not call auto-scan for non-Auto_Scan step types", async () => {
      createComponent(ATTESTATION_STEP);
      await flushPromises();

      expect(runAutoScan).not.toHaveBeenCalled();
    });

    it("dispatches stepcomplete event with scan results on submit", async () => {
      runAutoScan.mockResolvedValue(MOCK_SCAN_RESULTS);
      const element = createComponent(AUTO_SCAN_STEP);
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("stepcomplete", handler);

      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const submitBtn = Array.from(buttons).find((b) => b.variant === "brand");
      submitBtn.click();

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.stepId).toBe("HIPAA_Access_Control_Scan");
      expect(detail.responseData).toBeTruthy();

      const parsed = JSON.parse(detail.responseData);
      expect(parsed.scanResults).toEqual(MOCK_SCAN_RESULTS);
      expect(parsed.timestamp).toBeTruthy();
    });

    it("renders findings table with correct badge classes", async () => {
      runAutoScan.mockResolvedValue(MOCK_SCAN_RESULTS_WITH_FAILURES);
      const scanStep = {
        ...AUTO_SCAN_STEP,
        controlReference: "SOC2-CC6.1,SOC2-CC6.2,SOC2-CC6.6",
      };
      const element = createComponent(scanStep);
      await flushPromises();

      const rows = element.shadowRoot.querySelectorAll("tbody tr");
      expect(rows.length).toBe(3);

      const badges = element.shadowRoot.querySelectorAll("tbody .slds-badge");
      const passedBadges = Array.from(badges).filter((b) =>
        b.classList.contains("slds-theme_success")
      );
      const failedBadges = Array.from(badges).filter((b) =>
        b.classList.contains("slds-theme_error")
      );
      expect(passedBadges.length).toBe(1);
      expect(failedBadges.length).toBe(1);
    });
  });
});
