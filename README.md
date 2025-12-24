<div align="center">

# 🔥 Prometheion

**Court-defensible compliance & AI governance platform for Salesforce**

*A product by [SolentraCRM](https://github.com/derickporter1993/Solentra)*

[![Salesforce](https://img.shields.io/badge/Salesforce-00A1E0?style=for-the-badge&logo=salesforce&logoColor=white)](https://salesforce.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

[Quick Start](#-quick-start) • [Features](#-key-features) • [Documentation](#-documentation) • [Support](#-support)

---

**Make your Salesforce org audit-ready in 24 hours with AI-powered compliance intelligence**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Why Prometheion?](#-why-prometheion)
- [Key Features](#-key-features)
- [Supported Compliance Frameworks](#-supported-compliance-frameworks)
- [Use Cases](#-use-cases)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Security](#-security)
- [Contributing](#-contributing)
- [Documentation](#-documentation)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

**Prometheion** is an enterprise-grade compliance and AI governance platform built natively on Salesforce. It transforms how regulated organizations manage compliance, detect configuration drift, and generate audit evidence.

### What Makes Prometheion Different?

| Feature | Traditional Tools | Prometheion |
|---------|------------------|-------------|
| **Setup Time** | Weeks of configuration | < 10 minutes |
| **AI Intelligence** | Rule-based alerts | AI-powered analysis with context |
| **Audit Evidence** | Manual collection | Automated, court-defensible exports |
| **Compliance Scoring** | Static reports | Real-time, multi-framework scoring |
| **Remediation** | Manual fixes | One-click automated remediation |
| **Cost** | Enterprise pricing | Open source, MIT licensed |

### Key Capabilities

- ✅ **Automated Compliance Scanning** - Continuous monitoring of security posture
- ✅ **AI-Powered Analysis** - Understand the *why* behind every change
- ✅ **Multi-Framework Support** - HIPAA, SOC2, NIST, FedRAMP, GDPR, ISO 27001, PCI DSS
- ✅ **Real-Time Alerting** - Slack, Teams, and email notifications
- ✅ **Audit Evidence Generation** - Court-defensible documentation
- ✅ **Configuration Drift Detection** - Track unauthorized changes
- ✅ **Compliance Scoring** - Real-time readiness scores across frameworks
- ✅ **Natural Language Interface** - Ask questions in plain English

---

## 💡 Why Prometheion?

### The Problem

Regulated organizations face constant challenges:

- 🔴 **Audits fail** because nobody can explain who changed what and why
- 🔴 **Permission sprawl** goes undetected until it's too late
- 🔴 **Configuration drift** creates compliance gaps
- 🔴 **Manual evidence collection** takes weeks and is error-prone
- 🔴 **Existing tools** are too complex, expensive, or not Salesforce-native

### The Solution

Prometheion provides:

- ✅ **24/7 Automated Monitoring** - Never miss a compliance violation
- ✅ **AI-Powered Intelligence** - Understand intent and impact of changes
- ✅ **Instant Evidence Generation** - Export-ready audit documentation
- ✅ **Proactive Remediation** - Fix issues before they become violations
- ✅ **Native Salesforce Integration** - Built for Salesforce, by Salesforce experts

---

## 🚀 Key Features

### 🔍 Compliance Baseline Scan

**Automated scanning and documentation of your org's security posture**

Prometheion performs comprehensive scans of your Salesforce org, analyzing:

- **Permission Sets & Profiles** - Identify over-privileged users
- **Field-Level Security** - Audit access to sensitive data
- **Sharing Rules** - Detect over-permissioned objects
- **Custom Object Configuration** - Review security settings
- **Platform Encryption** - Verify Shield encryption status
- **Session & Password Policies** - Validate security policies

**Output**: Detailed compliance baseline report with actionable recommendations.

**Example Report Sections**:
```
📊 Audit Readiness Score: 72/100
⚠️  Top 5 Compliance Risks:
   1. 23 users with "Modify All Data" permission
   2. Patient_Records__c sharing set to Public Read/Write
   3. SSN__c field lacks Shield Platform Encryption
   4. Field History Tracking disabled on 12 compliance objects
   5. Session timeout set below regulatory minimum
```

### 🔄 Configuration Drift Detection

**Real-time monitoring of security-relevant changes**

Prometheion tracks every change to your Salesforce configuration:

- **Profile & Permission Set Modifications** - Who changed what permissions
- **Sharing Rule Updates** - Track data access changes
- **Object & Field Security** - Monitor FLS and OLS changes
- **Setup Changes** - Detect changes without change control tickets
- **Unreviewed Production Changes** - Flag risky deployments

**Alert Types**:
- 🔴 **Critical**: Changes that violate compliance frameworks
- 🟡 **High**: Changes requiring immediate review
- 🟢 **Informational**: Changes logged for audit trail

**Example Alert**:
```
🚨 CRITICAL: High-Risk Change Detected

Change: Permission Set "Financial_Data_Access" modified
Changed By: j.smith@acme.org
Timestamp: 2025-01-24 14:32:15
Risk Score: 8.7/10

Impact:
• 45 users granted "Modify All Data" permission
• Violates SOC2-CC6.3 (logical access controls)
• Expands donor-data exposure by 340%
• Fails HIPAA "minimum necessary" access rule

Compliance Status:
- HIPAA: ❌ Non-compliant
- SOC 2: ❌ Control failure (CC6.1)
- SOX: ❌ Segregation of duties violation
```

### 📋 Audit Evidence Export

**Generate court-defensible documentation automatically**

Prometheion collects and organizes audit evidence:

- **Setup Audit Trail Exports** - Complete change history
- **Field History Tracking Data** - Who changed what data
- **Event Monitoring Logs** - User activity tracking (Shield required)
- **Permission Set Assignment History** - Access control audit trail
- **Correlation IDs** - Trace changes across systems
- **Compliance Snapshots** - Timestamped compliance states

**Export Formats**:
- 📄 **Markdown** - Human-readable reports
- 📊 **CSV** - Spreadsheet analysis
- 📦 **JSON** - Programmatic processing
- 📑 **PDF** - Official documentation (coming soon)

**Evidence Chain of Custody**:
- Timestamped snapshots
- User attribution
- Change justification (when available)
- Compliance framework mapping

### 📊 Audit Readiness Score

**Real-time compliance scoring across multiple frameworks**

Prometheion calculates a comprehensive compliance score (0-100) based on:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Permission Sprawl** | 30% | Users with elevated access (Modify All, View All) |
| **Audit Trail Coverage** | 25% | % of objects with Field History enabled |
| **Configuration Drift** | 20% | Unreviewed high-risk changes |
| **Encryption Status** | 15% | Shield Platform Encryption coverage |
| **Policy Compliance** | 10% | OWD settings, session timeout, password policy |

**Framework-Specific Scores**:
- **HIPAA**: PHI protection, audit controls, encryption
- **SOC 2**: Trust service criteria, logical access, change management
- **NIST**: Access control, audit accountability, system integrity
- **FedRAMP**: Federal security requirements, incident response
- **GDPR**: Data subject rights, data minimization, breach notification
- **ISO 27001**: Information security management
- **PCI DSS**: Payment card data protection

**Score Interpretation**:
- 🟢 **90-100**: Excellent - Audit ready
- 🟡 **75-89**: Good - Minor improvements needed
- 🟠 **60-74**: Fair - Significant gaps to address
- 🔴 **0-59**: Poor - Critical compliance issues

### 🤖 AI Compliance Copilot

**Natural language interface for compliance queries**

Ask questions in plain English and get instant, evidence-backed answers:

**Example Queries**:
```
You: "What are our top compliance risks?"
Prometheion: [Displays ranked list with evidence and remediation steps]

You: "Show me all users with Modify All Data permission"
Prometheion: [Lists 23 users with assignment history and risk analysis]

You: "How does this change affect HIPAA compliance?"
Prometheion: [AI analysis of change impact with specific HIPAA rule violations]

You: "What's our SOC2 readiness score?"
Prometheion: [Detailed SOC2 score breakdown with control mapping]

You: "Generate audit evidence for Q2 2024"
Prometheion: [Exports comprehensive Q2 evidence package]
```

**AI Capabilities**:
- **Intent Analysis** - Understand why changes were made
- **Impact Assessment** - Calculate compliance risk
- **Remediation Suggestions** - Automated fix recommendations
- **Framework Mapping** - Link changes to specific compliance requirements
- **Evidence Correlation** - Connect related changes and events

### 📱 Real-Time Notifications

**Multi-channel alerting for immediate awareness**

Prometheion sends alerts through multiple channels:

#### Slack Integration
- Rich Block Kit messages with interactive buttons
- Threaded conversations for change discussions
- Customizable alert channels per compliance framework
- Action buttons for one-click remediation

#### Microsoft Teams Integration
- Adaptive Cards with formatted content
- Actionable buttons for quick responses
- Channel-specific routing
- Rich formatting and attachments

#### Email Notifications
- Weekly compliance scorecards
- Daily digest of high-risk changes
- Customizable alert thresholds
- HTML-formatted reports

**Notification Configuration**:
```apex
// Configure alert thresholds
PrometheionSettings__c settings = new PrometheionSettings__c();
settings.CriticalRiskThreshold__c = 8.0;
settings.HighRiskThreshold__c = 6.0;
settings.EnableSlackAlerts__c = true;
settings.EnableTeamsAlerts__c = true;
settings.EnableEmailDigest__c = true;
```

---

## 🏛️ Supported Compliance Frameworks

Prometheion provides comprehensive support for major regulatory frameworks:

| Framework | Coverage | Key Controls |
|-----------|----------|--------------|
| **HIPAA** | ✅ Full | PHI protection, audit controls, encryption requirements, access controls |
| **SOC 2** | ✅ Full | Trust service criteria, logical access, change management, monitoring |
| **NIST 800-53** | ✅ Full | Access control, audit accountability, system integrity, incident response |
| **FedRAMP** | ✅ Full | Federal security requirements, continuous monitoring, incident response |
| **GDPR** | ✅ Full | Data subject rights, data minimization, breach notification, consent management |
| **ISO 27001** | ✅ Full | Information security management, risk assessment, continuous improvement |
| **PCI DSS** | ✅ Full | Payment card data protection, access controls, monitoring, encryption |

### Framework-Specific Features

**HIPAA**:
- PHI field identification and protection
- Minimum necessary access enforcement
- Audit trail requirements (45 CFR §164.308)
- Encryption at rest and in transit

**SOC 2**:
- Trust Service Criteria (CC6.1, CC6.2, CC6.3)
- Logical access controls
- Change management processes
- Monitoring and alerting

**NIST**:
- Access control (AC-3, AC-4, AC-6)
- Audit and accountability (AU-2, AU-3, AU-6)
- System integrity (SI-2, SI-4)
- Incident response (IR-4, IR-5)

**FedRAMP**:
- Continuous monitoring requirements
- Federal security controls
- Incident response procedures
- Security assessment documentation

**GDPR**:
- Data subject rights (Article 15-22)
- Data minimization (Article 5)
- Breach notification (Article 33-34)
- Privacy by design (Article 25)

---

## 🎯 Use Cases

### Healthcare Organizations (HIPAA)

**Challenge**: Healthcare providers need to protect PHI while maintaining operational efficiency.

**Solution**: Prometheion monitors PHI access, ensures minimum necessary access, and generates HIPAA audit evidence.

**Benefits**:
- Automated PHI field identification
- Access control monitoring
- Breach detection and notification
- Audit trail compliance

### Financial Services (SOX, PCI DSS)

**Challenge**: Financial institutions face strict regulatory requirements and frequent audits.

**Solution**: Prometheion provides real-time compliance monitoring and automated evidence generation.

**Benefits**:
- SOX compliance tracking
- PCI DSS requirement validation
- Segregation of duties enforcement
- Transaction audit trails

### Government & Nonprofits (FedRAMP, FISMA)

**Challenge**: Government contractors and nonprofits must meet federal security requirements.

**Solution**: Prometheion ensures continuous compliance with federal standards.

**Benefits**:
- FedRAMP control validation
- FISMA compliance tracking
- Grants management security
- Donor privacy protection

### Enterprise Organizations (SOC 2, ISO 27001)

**Challenge**: Enterprise companies need to demonstrate security controls to customers and auditors.

**Solution**: Prometheion provides comprehensive SOC 2 and ISO 27001 compliance monitoring.

**Benefits**:
- Trust Service Criteria validation
- ISO 27001 control mapping
- Customer audit readiness
- Continuous compliance monitoring

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Prometheion Platform                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   LWC UI     │  │  Apex Engine  │  │  AI Service   │ │
│  │ Components   │  │   Classes     │  │  (Claude)     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│  ┌──────┴──────────────────┴──────────────────┴──────┐ │
│  │           Prometheion Core Services                │ │
│  │  • Compliance Scorer  • Graph Indexer              │ │
│  │  • Reasoning Engine  • Remediation Engine         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │          Salesforce Platform Integration          │   │
│  │  • Setup Audit Trail  • Field History Tracking   │   │
│  │  • Event Monitoring   • Metadata API              │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Slack      │  │    Teams     │  │    Email     │ │
│  │  Notifier    │  │   Notifier   │  │   Digest     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Change Detection**: Platform Events trigger on Salesforce configuration changes
2. **Analysis**: Apex classes analyze changes for compliance impact
3. **AI Processing**: Claude API provides intent and impact analysis
4. **Scoring**: Compliance scores updated in real-time
5. **Alerting**: Notifications sent via configured channels
6. **Evidence**: Audit evidence stored and exportable

### Technology Stack

- **Frontend**: Lightning Web Components (LWC)
- **Backend**: Apex Classes & Triggers
- **AI**: Anthropic Claude API
- **Storage**: Salesforce Objects & Platform Cache
- **Integration**: REST APIs, Platform Events, Named Credentials

---

## 🚀 Quick Start

### Prerequisites

Before installing Prometheion, ensure you have:

- ✅ **Salesforce CLI** installed ([Install Guide](https://developer.salesforce.com/tools/salesforcecli))
- ✅ **Node.js 20+** and **npm 10+** ([Download](https://nodejs.org/))
- ✅ **A Salesforce org** (Developer, Sandbox, or Production)
  - Enterprise Edition or higher recommended
  - API access enabled
- ✅ **Anthropic Claude API Key** (for AI features) ([Get API Key](https://www.anthropic.com/))

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/derickporter1993/Solentra.git
cd Solentra
```

#### 2. Install Dependencies

```bash
npm install
```

This installs:
- LWC Jest testing framework
- ESLint and Prettier for code quality
- Husky for git hooks

#### 3. Authenticate with Salesforce

```bash
# Authorize your org
sf org login web -a prometheion-org

# Verify connection
sf org display -o prometheion-org
```

#### 4. Deploy to Your Org

```bash
# Deploy all metadata
sf project deploy start --target-org prometheion-org

# Or deploy specific components
sf project deploy start --source-dir force-app/main/default/classes --target-org prometheion-org
```

#### 5. Assign Permission Set

```bash
# Assign Prometheion Admin permission set
sf org assign permset --name Prometheion_Admin --target-org prometheion-org
```

#### 6. Configure Custom Metadata

1. Navigate to **Setup > Custom Metadata Types > Prometheion Claude Settings**
2. Create a new record:
   - **Developer Name**: `Default`
   - **API Key**: `<your-anthropic-api-key>`
   - **Model**: `claude-3-opus-20240229` (or preferred model)
   - **Active**: `true`

#### 7. Verify Installation

1. Open **App Launcher** in Salesforce
2. Search for **"Prometheion"**
3. Navigate to **Compliance Hub** tab
4. You should see the compliance dashboard

**🎉 Installation Complete!**

---

## ⚙️ Configuration

### Claude API Setup

#### Option 1: Custom Metadata (Recommended)

1. **Navigate**: Setup > Custom Metadata Types > Prometheion Claude Settings
2. **Create Record**:
   - Developer Name: `Default`
   - API Key: Your Anthropic API key
   - Model: `claude-3-opus-20240229`
   - Active: `true`

#### Option 2: Named Credential

1. **Create Named Credential**: Setup > Named Credentials
2. **Name**: `Anthropic_Claude_API`
3. **URL**: `https://api.anthropic.com`
4. **Identity Type**: Named Principal
5. **Authentication**: Header (API Key)

### Notification Configuration

#### Slack Integration

1. **Create Slack Incoming Webhook**:
   - Go to [Slack API](https://api.slack.com/messaging/webhooks)
   - Create new webhook for your channel
   - Copy webhook URL

2. **Create Named Credential**:
   - Setup > Named Credentials
   - Name: `Slack_Webhook`
   - URL: Your Slack webhook URL
   - Identity Type: Anonymous

3. **Enable in Prometheion**:
   ```apex
   PrometheionSettings__c settings = PrometheionSettings__c.getOrgDefaults();
   settings.EnableSlackAlerts__c = true;
   settings.SlackWebhookUrl__c = 'Slack_Webhook';
   update settings;
   ```

#### Microsoft Teams Integration

1. **Create Teams Incoming Webhook**:
   - Teams > Channel > Connectors > Incoming Webhook
   - Copy webhook URL

2. **Create Named Credential**:
   - Setup > Named Credentials
   - Name: `Teams_Webhook`
   - URL: Your Teams webhook URL
   - Identity Type: Anonymous

3. **Enable in Prometheion**:
   ```apex
   PrometheionSettings__c settings = PrometheionSettings__c.getOrgDefaults();
   settings.EnableTeamsAlerts__c = true;
   settings.TeamsWebhookUrl__c = 'Teams_Webhook';
   update settings;
   ```

### Schedule Weekly Scorecards

```apex
// Schedule for every Monday at 9 AM
String cronExp = '0 0 9 ? * MON';
System.schedule('Prometheion Weekly Scorecard', cronExp, new WeeklyScorecardScheduler());

// Or schedule for first day of each month
String monthlyCron = '0 0 9 1 * ?';
System.schedule('Prometheion Monthly Report', monthlyCron, new WeeklyScorecardScheduler());
```

### Customize Compliance Scoring

```apex
// Adjust scoring weights
PrometheionComplianceScorer.ScoreWeights weights = new PrometheionComplianceScorer.ScoreWeights();
weights.PermissionSprawlWeight = 0.35;  // Increase from default 0.30
weights.AuditTrailWeight = 0.20;         // Decrease from default 0.25
weights.DriftWeight = 0.25;              // Increase from default 0.20
weights.EncryptionWeight = 0.10;         // Decrease from default 0.15
weights.PolicyWeight = 0.10;             // Keep default

PrometheionComplianceScorer.setCustomWeights(weights);
```

---

## 📖 Usage Guide

### Running Your First Compliance Scan

1. **Navigate to Compliance Hub**
   - App Launcher > Prometheion > Compliance Hub

2. **Initiate Baseline Scan**
   - Click "Run Baseline Scan" button
   - Wait 30-60 seconds for completion

3. **Review Results**
   - View Audit Readiness Score
   - Review Top 5 Compliance Risks
   - Examine framework-specific scores

4. **Export Evidence**
   - Click "Export Evidence" button
   - Select format (Markdown, CSV, JSON)
   - Download report

### Using the AI Copilot

1. **Open Copilot Interface**
   - Navigate to Compliance Hub
   - Click "AI Copilot" tab

2. **Ask Questions**
   ```
   "What are our top compliance risks?"
   "Show me users with Modify All Data permission"
   "How does this change affect HIPAA compliance?"
   ```

3. **Review AI Analysis**
   - Read AI-generated insights
   - Review evidence citations
   - Follow remediation suggestions

### Monitoring Configuration Drift

1. **View Recent Changes**
   - Compliance Hub > Configuration Drift tab
   - Review change timeline

2. **Set Up Alerts**
   - Configure alert thresholds
   - Enable Slack/Teams notifications
   - Set up email digests

3. **Investigate Changes**
   - Click on any change for details
   - Review AI impact analysis
   - Take remediation actions

### Generating Audit Reports

1. **Select Time Period**
   - Choose date range for report

2. **Select Frameworks**
   - HIPAA, SOC2, NIST, etc.

3. **Generate Report**
   - Click "Generate Report"
   - Wait for processing
   - Download evidence package

---

## 📚 API Reference

### PrometheionComplianceScorer

#### `calculateReadinessScore()`

Calculates comprehensive compliance score with framework-specific breakdowns.

**Returns**: `ScoreResult` object containing:
- `overallScore`: Decimal (0-100)
- `rating`: String (CRITICAL, HIGH, MEDIUM, LOW, EXCELLENT)
- `frameworkScores`: Map<String, Decimal>
- `topRisks`: List<Risk>
- `factors`: Map<String, Decimal>

**Example**:
```apex
PrometheionComplianceScorer.ScoreResult result = 
    PrometheionComplianceScorer.calculateReadinessScore();

System.debug('Overall Score: ' + result.overallScore);
System.debug('HIPAA Score: ' + result.frameworkScores.get('HIPAA'));
System.debug('Top Risk: ' + result.topRisks[0].description);
```

#### `calculateFrameworkScore(String framework)`

Calculates score for a specific compliance framework.

**Parameters**:
- `framework`: String - Framework name (HIPAA, SOC2, NIST, etc.)

**Returns**: Decimal (0-100)

**Example**:
```apex
Decimal hipaaScore = PrometheionComplianceScorer.calculateFrameworkScore('HIPAA');
System.debug('HIPAA Compliance Score: ' + hipaaScore);
```

### PrometheionComplianceCopilot

#### `askCopilot(String query)`

Processes natural language compliance queries using AI.

**Parameters**:
- `query`: String - Natural language question

**Returns**: `CopilotResponse` object containing:
- `answer`: String - AI-generated response
- `confidence`: Decimal - Confidence score (0-1)
- `queryType`: String - Classification of query type
- `evidence`: List<Evidence> - Supporting evidence
- `remediationSteps`: List<String> - Suggested actions

**Example**:
```apex
PrometheionComplianceCopilot.CopilotResponse response = 
    PrometheionComplianceCopilot.askCopilot('What are our top compliance risks?');

System.debug('Answer: ' + response.answer);
System.debug('Confidence: ' + response.confidence);
System.debug('Evidence Count: ' + response.evidence.size());
```

#### `deepAnalysis(String topic)`

Performs deep compliance analysis on a specific topic.

**Parameters**:
- `topic`: String - Topic to analyze (e.g., "Permission Sprawl", "HIPAA Compliance")

**Returns**: `CopilotResponse` with detailed analysis

**Example**:
```apex
PrometheionComplianceCopilot.CopilotResponse analysis = 
    PrometheionComplianceCopilot.deepAnalysis('Permission Sprawl');

System.debug('Analysis: ' + analysis.answer);
```

### PrometheionQuickActionsService

#### `revokeModifyAllData(List<Id> userIds)`

Revokes Modify All Data permission from specified users.

**Parameters**:
- `userIds`: List<Id> - User IDs to revoke permission from

**Returns**: `ActionResult` with success status and details

**Example**:
```apex
List<Id> userIds = new List<Id>{'005000000000001AAA', '005000000000002AAA'};
PrometheionQuickActionsService.ActionResult result = 
    PrometheionQuickActionsService.revokeModifyAllData(userIds);

if (result.success) {
    System.debug('Revoked permission from ' + result.affectedRecords + ' users');
}
```

#### `deactivateInactiveUsers(Integer daysInactive)`

Deactivates users inactive for specified number of days.

**Parameters**:
- `daysInactive`: Integer - Number of days of inactivity

**Returns**: `ActionResult` with deactivated user count

**Example**:
```apex
PrometheionQuickActionsService.ActionResult result = 
    PrometheionQuickActionsService.deactivateInactiveUsers(90);

System.debug('Deactivated ' + result.affectedRecords + ' inactive users');
```

#### `removePermissionSetAssignment(Id assignmentId)`

Removes a specific permission set assignment.

**Parameters**:
- `assignmentId`: Id - Permission set assignment ID

**Returns**: `ActionResult`

**Example**:
```apex
Id assignmentId = '0Pa000000000001AAA';
PrometheionQuickActionsService.ActionResult result = 
    PrometheionQuickActionsService.removePermissionSetAssignment(assignmentId);
```

### PrometheionEmailDigestService

#### `sendWeeklyDigest()`

Sends weekly compliance digest email to administrators.

**Example**:
```apex
PrometheionEmailDigestService.sendWeeklyDigest();
```

---

## 💻 Development

### Project Structure

```
Prometheion/
├── force-app/main/default/
│   ├── classes/              # Apex classes
│   │   ├── PrometheionComplianceScorer.cls
│   │   ├── PrometheionComplianceCopilot.cls
│   │   ├── PrometheionReasoningEngine.cls
│   │   └── ...
│   ├── lwc/                  # Lightning Web Components
│   │   ├── prometheionCopilot/
│   │   ├── prometheionReadinessScore/
│   │   └── ...
│   ├── triggers/             # Apex triggers
│   ├── objects/              # Custom objects
│   ├── events/               # Platform events
│   ├── permissionsets/       # Permission sets
│   └── customMetadata/       # Custom metadata types
├── docs/                     # Documentation
│   ├── SETUP_GUIDE.md
│   └── GITHUB_REPO_SETUP.md
├── examples/                 # Sample reports
├── scripts/                  # Utility scripts
├── config/                   # Project configuration
├── package.json              # Node.js dependencies
└── sfdx-project.json         # Salesforce project config
```

### TypeScript/IDE Configuration

The `force-app/main/default/lwc/jsconfig.json` file is tracked in version control to ensure consistent IDE behavior across all developers. This file:

- Enables experimental decorators for LWC
- Configures path mappings for component imports (`c/*`)
- Includes LWC type definitions from `.sfdx/typings/`
- Uses `"types": []` to prevent TypeScript from auto-scanning `node_modules/@types/` (avoids missing type definition errors)

If you encounter TypeScript errors related to missing type definitions (e.g., `babel__core`, `estree`), ensure you're using the committed `jsconfig.json` and run:

```bash
npm install
```

### Running Tests

```bash
# Run all LWC tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode (auto-rerun on changes)
npm run test:unit:watch

# Debug mode
npm run test:unit:debug
```

### Linting & Formatting

```bash
# Format all code
npm run fmt

# Check formatting (CI/CD)
npm run fmt:check

# Lint JavaScript
npm run lint

# Fix lint issues automatically
npm run lint:fix
```

### Validation

```bash
# Run full validation (format, lint, test)
npm run validate
```

This runs before every commit (via Husky hooks).

### Code Quality Standards

- **Test Coverage**: Maintain 75%+ test coverage
- **Apex Standards**: Follow Salesforce Apex coding standards
- **Documentation**: Document all public methods
- **Naming**: Use meaningful variable and class names
- **Error Handling**: Implement comprehensive error handling

---

## 🔧 Troubleshooting

### AI Copilot Not Responding

**Symptoms**: Copilot returns errors or doesn't respond to queries.

**Solutions**:
1. ✅ Verify Custom Metadata record exists with Developer Name = "Default"
2. ✅ Check API key is valid and not expired
3. ✅ Review debug logs for Claude API errors
4. ✅ Ensure user has Prometheion_Admin permission set
5. ✅ Check Named Credential configuration (if using)

**Debug Steps**:
```apex
// Check Custom Metadata
Prometheion_Claude_Settings__mdt settings = 
    [SELECT API_Key__c, Model__c, Active__c 
     FROM Prometheion_Claude_Settings__mdt 
     WHERE DeveloperName = 'Default' 
     LIMIT 1];

System.debug('API Key exists: ' + (settings.API_Key__c != null));
System.debug('Model: ' + settings.Model__c);
System.debug('Active: ' + settings.Active__c);
```

### Compliance Score Not Updating

**Symptoms**: Score remains static or doesn't reflect recent changes.

**Solutions**:
1. ✅ Check Platform Cache partition: `local.PrometheionCompliance`
2. ✅ Score is cached for 5 minutes - wait or clear cache
3. ✅ Verify user has read access to required objects
4. ✅ Check for governor limit errors in debug logs

**Clear Cache**:
```apex
Cache.OrgPartition orgPartition = Cache.Org.getPartition('local.PrometheionCompliance');
orgPartition.remove('complianceScore');
```

### Email Digest Not Sending

**Symptoms**: Weekly emails not received.

**Solutions**:
1. ✅ Verify scheduled job is active: Setup > Apex > Scheduled Jobs
2. ✅ Check email deliverability settings
3. ✅ Ensure admin users have valid email addresses
4. ✅ Review debug logs for email service errors

**Check Scheduled Jobs**:
```apex
List<CronTrigger> jobs = [SELECT Id, CronJobDetail.Name, State 
                          FROM CronTrigger 
                          WHERE CronJobDetail.Name LIKE '%Prometheion%'];
System.debug('Scheduled Jobs: ' + jobs);
```

### Notification Integration Issues

**Slack/Teams Not Working**:

1. ✅ Verify Named Credential exists and is accessible
2. ✅ Test webhook URL manually (curl or Postman)
3. ✅ Check Named Credential authentication settings
4. ✅ Review debug logs for HTTP callout errors

**Test Webhook**:
```bash
curl -X POST -H 'Content-Type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_WEBHOOK_URL
```

### Performance Issues

**Symptoms**: Slow scans or timeouts.

**Solutions**:
1. ✅ Check governor limit usage
2. ✅ Review SOQL query performance
3. ✅ Enable Platform Cache for frequently accessed data
4. ✅ Consider running scans during off-peak hours

---

## 🔒 Security

### Security Considerations

- ✅ **API Keys**: Stored in Protected Custom Metadata (encrypted at rest)
- ✅ **Sharing Rules**: All Apex classes use `with sharing` to enforce sharing rules
- ✅ **Permission Sets**: Control access to sensitive functionality
- ✅ **Audit Trail**: All compliance-related actions are logged
- ✅ **Data Encryption**: Supports Shield Platform Encryption
- ✅ **Secure Communication**: All API calls use HTTPS

### Best Practices

1. **API Key Management**
   - Use Protected Custom Metadata for API keys
   - Rotate API keys regularly
   - Never commit API keys to version control

2. **Access Control**
   - Assign Prometheion_Admin permission set only to authorized users
   - Review permission set assignments regularly
   - Use field-level security for sensitive data

3. **Audit Logging**
   - Enable Field History Tracking on compliance objects
   - Review Setup Audit Trail regularly
   - Monitor Event Monitoring logs (if Shield enabled)

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `npm run validate`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Contribution Guidelines

- ✅ Maintain 75%+ test coverage
- ✅ Follow Apex coding standards
- ✅ Document all public methods
- ✅ Use meaningful variable names
- ✅ Add examples to documentation
- ✅ Update CHANGELOG.md for user-facing changes

### Code Review Process

1. All PRs require at least one approval
2. All tests must pass
3. Code must be formatted (Prettier)
4. No linting errors
5. Documentation updated if needed

---

## 📚 Documentation

### Available Documentation

- **[Setup Guide](docs/SETUP_GUIDE.md)** - Detailed installation and configuration
- **[GitHub Repository Setup](docs/GITHUB_REPO_SETUP.md)** - CI/CD configuration
- **[API Reference](API_REFERENCE.md)** - Complete API documentation
- **[Business Plan Alignment](BUSINESS_PLAN_ALIGNMENT.md)** - Product strategy
- **[Technical Deep Dive](TECHNICAL_DEEP_DIVE.md)** - Architecture details

### Additional Resources

- **Sample Reports**: See `examples/` directory
- **Migration Guide**: See `scripts/migrate-from-opsguardian.apex`
- **Installation Scripts**: See `scripts/install.sh`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**MIT License Summary**:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No liability
- ❌ No warranty

---

## 💬 Support

### Getting Help

- 📧 **Email**: Contact the SolentraCRM team
- 🐛 **Issues**: [GitHub Issues](https://github.com/derickporter1993/Solentra/issues)
- 📖 **Documentation**: See [docs/](docs/) directory
- 💬 **Discussions**: [GitHub Discussions](https://github.com/derickporter1993/Solentra/discussions)

### Reporting Issues

When reporting issues, please include:

1. **Environment Details**:
   - Salesforce org type and version
   - Prometheion version
   - Node.js version

2. **Error Details**:
   - Error message
   - Stack trace (if available)
   - Steps to reproduce

3. **Debug Information**:
   - Debug logs
   - Screenshots (if applicable)
   - Configuration details (redact sensitive info)

### Feature Requests

We love feature requests! Please open a GitHub issue with:

- Clear description of the feature
- Use case and benefits
- Proposed implementation (if applicable)

---

<div align="center">

**Prometheion** - Built with ❤️ by [SolentraCRM](https://github.com/derickporter1993/Solentra) for Salesforce compliance professionals

[⭐ Star us on GitHub](https://github.com/derickporter1993/Solentra) • [📖 Documentation](docs/) • [🐛 Report Issue](https://github.com/derickporter1993/Solentra/issues)

---

*Making Salesforce compliance simple, automated, and intelligent.*

</div>
