import { createElement } from "lwc";
import TrustCenterPublicView from "c/trustCenterPublicView";
import getPublicData from "@salesforce/apex/TrustCenterGuestController.getPublicData";

// Mock imperative Apex method
jest.mock(
  "@salesforce/apex/TrustCenterGuestController.getPublicData",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

// Mock custom labels
jest.mock(
  "@salesforce/label/c.TC_PublicViewTitle",
  () => ({ default: "Compliance Trust Center" }),
  { virtual: true }
);
jest.mock("@salesforce/label/c.TC_ComplianceStatus", () => ({ default: "Compliance Status" }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_NoFrameworks", () => ({ default: "No frameworks available." }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_Loading", () => ({ default: "Loading..." }), { virtual: true });
jest.mock("@salesforce/label/c.TC_Error", () => ({ default: "Error" }), { virtual: true });
jest.mock("@salesforce/label/c.TC_ErrorGeneric", () => ({ default: "An error occurred." }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_InvalidLink", () => ({ default: "This link is invalid." }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_ExpiredLink", () => ({ default: "This link has expired." }), {
  virtual: true,
});
jest.mock("@salesforce/label/c.TC_InvalidToken", () => ({ default: "Invalid token." }), {
  virtual: true,
});

// Mock child component labels (trustCenterBadge)
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

const MOCK_VIEWS = [
  {
    Id: "a001000000test01",
    Name: "SOC 2",
    Framework__c: "SOC2",
    Compliance_Percentage__c: 95.5,
    Controls_Total__c: 100,
    Controls_Compliant__c: 95,
    Last_Audit_Date__c: "2025-06-15",
    Certification_Status__c: "Certified",
    Is_Public__c: true,
  },
  {
    Id: "a001000000test02",
    Name: "HIPAA",
    Framework__c: "HIPAA",
    Compliance_Percentage__c: 88.0,
    Controls_Total__c: 80,
    Controls_Compliant__c: 70,
    Last_Audit_Date__c: "2025-09-01",
    Certification_Status__c: "Certified",
    Is_Public__c: true,
  },
];

// Flush all microtasks and macrotasks
function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("c-trust-center-public-view", () => {
  const originalLocation = window.location;

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
    // Restore location
    delete window.location;
    window.location = originalLocation;
  });

  function setUrlToken(token) {
    delete window.location;
    window.location = new URL(`https://example.com/trust-center?token=${token}`);
  }

  function clearUrlToken() {
    delete window.location;
    window.location = new URL("https://example.com/trust-center");
  }

  function createComponent() {
    const element = createElement("c-trust-center-public-view", {
      is: TrustCenterPublicView,
    });
    document.body.appendChild(element);
    return element;
  }

  it("renders badges when valid token and data returned", async () => {
    setUrlToken("valid-token-123");
    getPublicData.mockResolvedValue({
      isValid: true,
      views: MOCK_VIEWS,
      accessTier: "Public",
    });

    const element = createComponent();
    await flushPromises();
    await flushPromises();

    const badges = element.shadowRoot.querySelectorAll("c-trust-center-badge");
    expect(badges.length).toBe(2);
  });

  it("renders error state when no token in URL", async () => {
    clearUrlToken();

    const element = createComponent();
    // Need multiple flushes for async connectedCallback + re-render
    await flushPromises();
    await flushPromises();
    await flushPromises();

    // Verify error condition: no spinner, lock icon or error text visible
    const spinner = element.shadowRoot.querySelector("lightning-spinner");
    expect(spinner).toBeNull();
    // The error state shows a box with text content
    const errorBox = element.shadowRoot.querySelector(".slds-box");
    expect(errorBox).not.toBeNull();
  });

  it("renders error state when token is invalid", async () => {
    setUrlToken("invalid-token");
    getPublicData.mockResolvedValue({
      isValid: false,
      errorMessage: "This link is invalid, expired, or has been revoked.",
      views: [],
    });

    const element = createComponent();
    await flushPromises();
    await flushPromises();
    await flushPromises();

    const spinner = element.shadowRoot.querySelector("lightning-spinner");
    expect(spinner).toBeNull();
    const errorBox = element.shadowRoot.querySelector(".slds-box");
    expect(errorBox).not.toBeNull();
  });

  it("renders empty state when valid token but no public views", async () => {
    setUrlToken("valid-token-empty");
    getPublicData.mockResolvedValue({
      isValid: true,
      views: [],
      accessTier: "Public",
    });

    const element = createComponent();
    await flushPromises();
    await flushPromises();

    const heading = element.shadowRoot.querySelector(".slds-text-heading_medium");
    expect(heading).not.toBeNull();
  });

  it("renders error state when apex call throws", async () => {
    setUrlToken("error-token");
    getPublicData.mockRejectedValue({
      body: { message: "Server error" },
    });

    const element = createComponent();
    await flushPromises();
    await flushPromises();
    await flushPromises();

    const spinner = element.shadowRoot.querySelector("lightning-spinner");
    expect(spinner).toBeNull();
    const errorBox = element.shadowRoot.querySelector(".slds-box");
    expect(errorBox).not.toBeNull();
  });

  it("has proper ARIA label on main container", async () => {
    setUrlToken("valid-token-aria");
    getPublicData.mockResolvedValue({
      isValid: true,
      views: MOCK_VIEWS,
      accessTier: "Public",
    });

    const element = createComponent();
    await flushPromises();
    await flushPromises();

    const mainRegion = element.shadowRoot.querySelector('[role="main"]');
    expect(mainRegion).not.toBeNull();
    expect(mainRegion.getAttribute("aria-label")).toBe("Compliance Trust Center");
  });

  it("passes correct props to badge components", async () => {
    setUrlToken("valid-token-props");
    getPublicData.mockResolvedValue({
      isValid: true,
      views: MOCK_VIEWS,
      accessTier: "Public",
    });

    const element = createComponent();
    await flushPromises();
    await flushPromises();

    const badges = element.shadowRoot.querySelectorAll("c-trust-center-badge");
    expect(badges[0].frameworkName).toBe("SOC 2");
    expect(badges[0].compliancePercentage).toBe(95.5);
    expect(badges[0].certificationStatus).toBe("Certified");
    expect(badges[1].frameworkName).toBe("HIPAA");
  });

  it("calls getPublicData with correct token", async () => {
    setUrlToken("my-test-token");
    getPublicData.mockResolvedValue({
      isValid: true,
      views: MOCK_VIEWS,
      accessTier: "Public",
    });

    createComponent();
    await flushPromises();

    expect(getPublicData).toHaveBeenCalledWith({ token: "my-test-token" });
  });

  it("does not call getPublicData when no token present", async () => {
    clearUrlToken();

    createComponent();
    await flushPromises();

    expect(getPublicData).not.toHaveBeenCalled();
  });
});
