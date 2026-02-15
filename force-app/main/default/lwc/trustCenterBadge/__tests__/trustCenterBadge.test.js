import { createElement } from "lwc";
import TrustCenterBadge from "c/trustCenterBadge";

// Mock custom labels
jest.mock("@salesforce/label/c.TC_ComplianceScore", () => ({ default: "Compliance Score" }), {
  virtual: true,
});
jest.mock(
  "@salesforce/label/c.TC_CertificationStatus",
  () => ({ default: "Certification Status" }),
  { virtual: true }
);
jest.mock("@salesforce/label/c.TC_LastAuditDate", () => ({ default: "Last Audit Date" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_Certified", () => ({ default: "Certified" }), { virtual: true });
jest.mock("@salesforce/label/c.TC_InProgress", () => ({ default: "In Progress" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_RenewalRequired", () => ({ default: "Renewal Required" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_NotStarted", () => ({ default: "Not Started" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_ScoreExcellent", () => ({ default: "Excellent" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_ScoreGood", () => ({ default: "Good" }), { virtual: true });
jest.mock("@salesforce/label/c.TC_ScoreNeedsWork", () => ({ default: "Needs Improvement" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_ScoreCritical", () => ({ default: "Critical" }), {
  virtual: true,
});

describe("c-trust-center-badge", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  function createComponent(props = {}) {
    const element = createElement("c-trust-center-badge", { is: TrustCenterBadge });
    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
  }

  it("renders framework name", () => {
    const element = createComponent({
      frameworkName: "SOC 2",
      compliancePercentage: 85,
      certificationStatus: "Certified",
    });

    const title = element.shadowRoot.querySelector(".slds-truncate");
    expect(title).not.toBeNull();
    expect(title.textContent).toBe("SOC 2");
  });

  it("renders compliance percentage in progress bar", () => {
    const element = createComponent({
      frameworkName: "HIPAA",
      compliancePercentage: 92,
    });

    const progressBar = element.shadowRoot.querySelector(".slds-progress-bar__value");
    expect(progressBar).not.toBeNull();
    expect(progressBar.style.width).toBe("92%");
  });

  it("applies success styling for scores above 80%", () => {
    const element = createComponent({
      frameworkName: "SOC 2",
      compliancePercentage: 95,
    });

    const card = element.shadowRoot.querySelector("article");
    expect(card.classList.contains("badge-card_success")).toBe(true);
  });

  it("applies warning styling for scores between 50-80%", () => {
    const element = createComponent({
      frameworkName: "GDPR",
      compliancePercentage: 65,
    });

    const card = element.shadowRoot.querySelector("article");
    expect(card.classList.contains("badge-card_warning")).toBe(true);
  });

  it("applies error styling for scores below 50%", () => {
    const element = createComponent({
      frameworkName: "PCI-DSS",
      compliancePercentage: 30,
    });

    const card = element.shadowRoot.querySelector("article");
    expect(card.classList.contains("badge-card_error")).toBe(true);
  });

  it("displays certification status label", () => {
    const element = createComponent({
      frameworkName: "ISO 27001",
      compliancePercentage: 90,
      certificationStatus: "Certified",
    });

    const statusElements = element.shadowRoot.querySelectorAll(".slds-text-body_small");
    const statusTexts = Array.from(statusElements).map((el) => el.textContent);
    expect(statusTexts).toContain("Certified");
  });

  it("displays formatted audit date", () => {
    const element = createComponent({
      frameworkName: "SOC 2",
      compliancePercentage: 85,
      lastAuditDate: "2025-06-15",
    });

    const dateElements = element.shadowRoot.querySelectorAll(".slds-text-body_small");
    const hasDate = Array.from(dateElements).some((el) => el.textContent.includes("2025"));
    expect(hasDate).toBe(true);
  });

  it("displays -- when no audit date provided", () => {
    const element = createComponent({
      frameworkName: "SOC 2",
      compliancePercentage: 85,
    });

    const dateElements = element.shadowRoot.querySelectorAll(".slds-text-body_small");
    const hasDash = Array.from(dateElements).some((el) => el.textContent === "--");
    expect(hasDash).toBe(true);
  });

  it("has proper ARIA attributes on progress bar", () => {
    const element = createComponent({
      frameworkName: "HIPAA",
      compliancePercentage: 75,
    });

    const progressBar = element.shadowRoot.querySelector('[role="progressbar"]');
    expect(progressBar).not.toBeNull();
    expect(progressBar.getAttribute("aria-valuemin")).toBe("0");
    expect(progressBar.getAttribute("aria-valuemax")).toBe("100");
    expect(progressBar.getAttribute("aria-valuenow")).toBe("75");
  });

  it("has proper ARIA label on the card region", () => {
    const element = createComponent({
      frameworkName: "SOC 2",
      compliancePercentage: 95,
    });

    const region = element.shadowRoot.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region.getAttribute("aria-label")).toBe("SOC 2");
  });

  it("handles zero percentage", () => {
    const element = createComponent({
      frameworkName: "New Framework",
      compliancePercentage: 0,
    });

    const progressBar = element.shadowRoot.querySelector(".slds-progress-bar__value");
    expect(progressBar.style.width).toBe("0%");
  });

  it("handles 100% percentage", () => {
    const element = createComponent({
      frameworkName: "Perfect Framework",
      compliancePercentage: 100,
    });

    const progressBar = element.shadowRoot.querySelector(".slds-progress-bar__value");
    expect(progressBar.style.width).toBe("100%");
  });
});
