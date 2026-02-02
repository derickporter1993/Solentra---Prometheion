# Prometheion Security Best Practices

## Overview

This document outlines the security patterns and best practices implemented throughout the Prometheion codebase. All developers should follow these guidelines when contributing to the project.

---

## Table of Contents

1. [SOQL Injection Prevention](#soql-injection-prevention)
2. [Access Control Patterns](#access-control-patterns)
3. [Integration Security](#integration-security)
4. [Input Validation](#input-validation)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)

---

## 1. SOQL Injection Prevention

### Principles

SOQL injection occurs when user-controlled input is concatenated directly into SOQL queries without proper validation or escaping.

### Mandatory Safeguards

#### A. WITH SECURITY_ENFORCED

**Always** use `WITH SECURITY_ENFORCED` on dynamic queries:

```apex
String soql = 'SELECT Id, Name FROM Account WHERE Name = :accountName WITH SECURITY_ENFORCED';
List<Account> accounts = Database.query(soql);
```

✅ **Benefits:**
- Enforces FLS (Field-Level Security) at query time
- Enforces object-level permissions
- Fails fast if user lacks permissions

#### B. Object Whitelisting

Never allow arbitrary object names from user input:

```apex
// ❌ BAD - Allows any object
String objectName = userInput;
String soql = 'SELECT Id FROM ' + objectName;

// ✅ GOOD - Whitelist allowed objects
private static final Set<String> ALLOWED_OBJECTS = new Set<String>{
    'Account', 'Contact', 'Opportunity'
};

if (!ALLOWED_OBJECTS.contains(objectName)) {
    throw new AuraHandledException('Object not authorized: ' + objectName);
}
```

#### C. Field Validation

Validate field names against the object's schema:

```apex
// ✅ GOOD - Validate field exists and is accessible
SObjectType sType = Schema.getGlobalDescribe().get(objectName);
Map<String, SObjectField> fieldMap = sType.getDescribe().fields.getMap();

String cleanField = fieldName.toLowerCase();
if (!fieldMap.containsKey(cleanField)) {
    throw new AuraHandledException('Invalid field: ' + fieldName);
}

if (!fieldMap.get(cleanField).getDescribe().isAccessible()) {
    throw new AuraHandledException('Access denied to field: ' + fieldName);
}
```

#### D. String Escaping

Always escape user-provided string values:

```apex
String escapedValue = String.escapeSingleQuotes(userInput);
String soql = 'SELECT Id FROM Account WHERE Name = \'' + escapedValue + '\'';
```

⚠️ **Note:** String escaping alone is **NOT sufficient** — always combine with whitelisting.

#### E. Operator Whitelisting

Never trust user-provided operators:

```apex
private static final Set<String> ALLOWED_OPERATORS = new Set<String>{
    '=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN'
};

if (!ALLOWED_OPERATORS.contains(operator.toUpperCase())) {
    throw new AuraHandledException('Invalid operator: ' + operator);
}
```

#### F. Field Name Sanitization

Remove potentially dangerous characters from field names:

```apex
private static String sanitizeFieldName(String fieldName) {
    if (String.isBlank(fieldName)) return '';
    // Only allow alphanumeric and underscores
    return fieldName.replaceAll('[^a-zA-Z0-9_]+', '');
}
```

---

## 2. Access Control Patterns

### A. Sharing Keywords

Use appropriate sharing keywords for each context:

```apex
// Use `with sharing` for user-facing controllers
public with sharing class AccountController {
    // Respects sharing rules
}

// Use `without sharing` only when necessary (e.g., system operations)
public without sharing class SystemBatchJob {
    // Bypasses sharing - use with caution
}

// Use `inherited sharing` for utility classes
public inherited sharing class AccountHelper {
    // Inherits sharing from caller
}
```

✅ **Default:** Use `with sharing` unless you have a specific reason not to.

### B. CRUD/FLS Checks

Use the centralized `PrometheionSecurityUtils` class for all CRUD/FLS checks:

```apex
// Check object CRUD before DML
if (!PrometheionSecurityUtils.hasCreateAccess('Account')) {
    throw new AuraHandledException('Insufficient privileges to create Accounts');
}

// Check field-level access before queries
List<String> fields = new List<String>{'Name', 'Email', 'Phone'};
for (String field : fields) {
    if (!PrometheionSecurityUtils.hasFieldReadAccess('Contact', field)) {
        throw new AuraHandledException('Access denied to Contact field: ' + field);
    }
}

// Validate CRUD and FLS before DML operations
PrometheionSecurityUtils.validateCRUDAccess('Account', PrometheionSecurityUtils.DmlOperation.DML_INSERT);
List<String> accountFields = new List<String>{'Name', 'Industry', 'Phone'};
PrometheionSecurityUtils.validateFLSAccess('Account', accountFields, true);
Database.insert(accountList);
```

### C. USER_MODE vs SYSTEM_MODE

Use `USER_MODE` for queries in user-facing contexts:

```apex
// ✅ GOOD - Respects user permissions
List<Account> accounts = [
    SELECT Id, Name 
    FROM Account 
    WHERE Industry = 'Technology'
    WITH USER_MODE
];

// ⚠️ USE WITH CAUTION - Bypasses all permissions
List<Account> systemAccounts = [
    SELECT Id, Name 
    FROM Account 
    WITH SYSTEM_MODE
];
```

---

## 3. Integration Security

### A. Webhook Authentication

Always validate webhook secrets for incoming webhooks:

```apex
private static Boolean validateWebhookSecret(RestRequest req) {
    String providedSecret = req.headers.get('X-Webhook-Secret');
    String configuredSecret = PrometheionSettings__c.getInstance().Webhook_Secret__c;
    
    if (String.isBlank(configuredSecret)) {
        // No secret configured - allow (or reject based on security policy)
        return true;
    }
    
    return providedSecret == configuredSecret;
}

@HttpPost
global static void handleWebhook() {
    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;
    
    if (!validateWebhookSecret(req)) {
        res.statusCode = 401;
        res.responseBody = Blob.valueOf('{"error": "Invalid webhook secret"}');
        return;
    }
    
    // Process webhook...
}
```

### B. Named Credentials

Use Named Credentials for external callouts:

```apex
// ✅ GOOD - Uses Named Credential (credentials managed by Salesforce)
HttpRequest req = new HttpRequest();
req.setEndpoint('callout:SlackWebhook/messages');
req.setMethod('POST');
req.setBody(jsonPayload);

Http http = new Http();
HttpResponse res = http.send(req);
```

❌ **Never** hardcode credentials in code:

```apex
// ❌ BAD - Hardcoded credentials
req.setHeader('Authorization', 'Bearer sk_live_abc123xyz');
```

### C. Input Validation for External Data

Validate all data received from external systems:

```apex
// Validate JSON structure
Map<String, Object> payload;
try {
    payload = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
} catch (JSONException e) {
    throw new AuraHandledException('Invalid JSON payload');
}

// Validate required fields
if (!payload.containsKey('issueKey') || String.isBlank((String)payload.get('issueKey'))) {
    throw new AuraHandledException('Missing required field: issueKey');
}

// Validate data types
if (!(payload.get('priority') instanceof Integer)) {
    throw new AuraHandledException('Invalid data type for priority');
}
```

### D. Payload Size Limits

Protect against denial-of-service attacks:

```apex
// Check payload size before processing
Integer maxPayloadSize = 1000000; // 1 MB
if (req.requestBody.size() > maxPayloadSize) {
    res.statusCode = 413; // Payload Too Large
    res.responseBody = Blob.valueOf('{"error": "Payload too large"}');
    return;
}
```

---

## 4. Input Validation

### A. Type Validation

Validate data types before processing:

```apex
// Validate numeric input
private static Boolean isNumeric(String value) {
    if (String.isBlank(value)) return false;
    try {
        Decimal.valueOf(value);
        return true;
    } catch (TypeException e) {
        return false;
    }
}

// Validate date literals
private static Boolean isDateLiteral(String value) {
    if (String.isBlank(value)) return false;
    String upper = value.toUpperCase();
    return upper.startsWith('LAST_') || 
           upper.startsWith('THIS_') ||
           upper == 'TODAY' || 
           upper == 'YESTERDAY';
}
```

### B. Length Validation

Prevent buffer overflow and heap issues:

```apex
private static final Integer MAX_STRING_LENGTH = 10000;
private static final Integer MAX_ARRAY_SIZE = 1000;

if (userInput.length() > MAX_STRING_LENGTH) {
    throw new AuraHandledException('Input too long');
}

if (userArray.size() > MAX_ARRAY_SIZE) {
    throw new AuraHandledException('Array too large');
}
```

### C. Format Validation

Use regex for format validation:

```apex
// Validate email format
Pattern emailPattern = Pattern.compile('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
if (!emailPattern.matcher(email).matches()) {
    throw new AuraHandledException('Invalid email format');
}

// Validate API name format (alphanumeric + underscores only)
Pattern apiNamePattern = Pattern.compile('^[a-zA-Z][a-zA-Z0-9_]*$');
if (!apiNamePattern.matcher(apiName).matches()) {
    throw new AuraHandledException('Invalid API name format');
}
```

---

## 5. Error Handling

### A. User-Friendly Error Messages

Never expose internal details in error messages:

```apex
try {
    // Risky operation
} catch (DmlException e) {
    // ❌ BAD - Exposes stack trace
    throw new AuraHandledException(e.getMessage() + '\n' + e.getStackTraceString());
}

try {
    // Risky operation
} catch (DmlException e) {
    // ✅ GOOD - Generic message for user, detailed log for debugging
    System.debug(LoggingLevel.ERROR, 'DML Error: ' + e.getMessage());
    throw new AuraHandledException('Unable to save record. Please contact your administrator.');
}
```

### B. Correlation IDs

Use correlation IDs for debugging distributed operations:

```apex
String correlationId = generateCorrelationId('WEBHOOK', 'JIRA');
System.debug(LoggingLevel.INFO, '[CorrelationId: ' + correlationId + '] Processing webhook');

try {
    // Process webhook
} catch (Exception e) {
    System.debug(LoggingLevel.ERROR, 
        '[CorrelationId: ' + correlationId + '] Error: ' + e.getMessage());
    throw e;
}

private static String generateCorrelationId(String source, String context) {
    return source + '_' + context + '_' + String.valueOf(Datetime.now().getTime());
}
```

### C. Graceful Degradation

Design systems to degrade gracefully when dependencies fail:

```apex
// Example: Platform Cache fallback
try {
    Cache.OrgPartition orgCache = Cache.Org.getPartition('local.PrometheionCache');
    if (orgCache != null && orgCache.contains(cacheKey)) {
        return (List<FieldMetadata>)orgCache.get(cacheKey);
    }
} catch (Cache.Org.OrgCacheException e) {
    // Cache not configured - continue without it
    System.debug(LoggingLevel.WARN, 'Cache partition not available: ' + e.getMessage());
}

// Fetch from database as fallback
return fetchFieldMetadataFromSchema(objectName);
```

---

## 6. Code Examples

### Example 1: Secure Dynamic Query Builder

```apex
public with sharing class SecureQueryBuilder {
    
    private static final Set<String> ALLOWED_OBJECTS = new Set<String>{
        'Account', 'Contact', 'Opportunity'
    };
    
    private static final Set<String> ALLOWED_OPERATORS = new Set<String>{
        '=', '!=', '>', '<', '>=', '<=', 'LIKE'
    };
    
    public static List<SObject> executeQuery(
        String objectName, 
        List<String> fields, 
        String filterField,
        String operator,
        String value
    ) {
        // 1. Validate object
        if (!ALLOWED_OBJECTS.contains(objectName)) {
            throw new AuraHandledException('Object not authorized');
        }
        
        SObjectType sType = Schema.getGlobalDescribe().get(objectName);
        if (sType == null || !sType.getDescribe().isAccessible()) {
            throw new AuraHandledException('Access denied to object');
        }
        
        // 2. Validate fields
        Map<String, SObjectField> fieldMap = sType.getDescribe().fields.getMap();
        for (String field : fields) {
            String cleanField = sanitizeFieldName(field).toLowerCase();
            if (!fieldMap.containsKey(cleanField)) {
                throw new AuraHandledException('Invalid field: ' + field);
            }
            if (!fieldMap.get(cleanField).getDescribe().isAccessible()) {
                throw new AuraHandledException('Access denied to field: ' + field);
            }
        }
        
        // 3. Validate operator
        if (!ALLOWED_OPERATORS.contains(operator.toUpperCase())) {
            throw new AuraHandledException('Invalid operator');
        }
        
        // 4. Validate filter field
        String cleanFilterField = sanitizeFieldName(filterField).toLowerCase();
        if (!fieldMap.containsKey(cleanFilterField)) {
            throw new AuraHandledException('Invalid filter field');
        }
        
        // 5. Build query
        List<String> cleanFields = new List<String>();
        for (String field : fields) {
            cleanFields.add(sanitizeFieldName(field));
        }
        
        String soql = 'SELECT ' + String.join(cleanFields, ', ') +
                      ' FROM ' + objectName +
                      ' WHERE ' + sanitizeFieldName(filterField) + 
                      ' ' + operator + 
                      ' \'' + String.escapeSingleQuotes(value) + '\'' +
                      ' WITH SECURITY_ENFORCED' +
                      ' LIMIT 200';
        
        return Database.query(soql);
    }
    
    private static String sanitizeFieldName(String fieldName) {
        if (String.isBlank(fieldName)) return '';
        return fieldName.replaceAll('[^a-zA-Z0-9_]+', '');
    }
}
```

### Example 2: Secure Webhook Handler

```apex
@RestResource(urlMapping='/webhook/external/*')
global with sharing class SecureWebhookHandler {
    
    private static final Integer MAX_PAYLOAD_SIZE = 1000000; // 1 MB
    
    @HttpPost
    global static void handleWebhook() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String correlationId = generateCorrelationId();
        
        try {
            // 1. Validate webhook secret
            if (!validateWebhookSecret(req)) {
                res.statusCode = 401;
                res.responseBody = Blob.valueOf('{"error": "Unauthorized"}');
                logSecurityEvent(correlationId, 'WEBHOOK_AUTH_FAILED', req);
                return;
            }
            
            // 2. Check payload size
            if (req.requestBody.size() > MAX_PAYLOAD_SIZE) {
                res.statusCode = 413;
                res.responseBody = Blob.valueOf('{"error": "Payload too large"}');
                return;
            }
            
            // 3. Parse and validate JSON
            String body = req.requestBody.toString();
            Map<String, Object> payload = validatePayload(body);
            
            // 4. Process webhook
            WebhookResult result = processWebhook(payload, correlationId);
            
            res.statusCode = result.success ? 200 : 500;
            res.responseBody = Blob.valueOf(JSON.serialize(result));
            
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 
                '[CorrelationId: ' + correlationId + '] Error: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf('{"error": "Internal server error"}');
        }
    }
    
    private static Boolean validateWebhookSecret(RestRequest req) {
        String providedSecret = req.headers.get('X-Webhook-Secret');
        String configuredSecret = PrometheionSettings__c.getInstance().Webhook_Secret__c;
        
        if (String.isBlank(configuredSecret)) {
            return true; // No secret configured
        }
        
        return providedSecret == configuredSecret;
    }
    
    private static Map<String, Object> validatePayload(String body) {
        Map<String, Object> payload;
        
        try {
            payload = (Map<String, Object>) JSON.deserializeUntyped(body);
        } catch (JSONException e) {
            throw new AuraHandledException('Invalid JSON payload');
        }
        
        // Validate required fields
        if (!payload.containsKey('event') || String.isBlank((String)payload.get('event'))) {
            throw new AuraHandledException('Missing required field: event');
        }
        
        return payload;
    }
    
    private static String generateCorrelationId() {
        return 'WEBHOOK_' + String.valueOf(Datetime.now().getTime());
    }
    
    private static void logSecurityEvent(String correlationId, String eventType, RestRequest req) {
        // Log security events for monitoring
        System.debug(LoggingLevel.WARN, 
            '[Security Event] CorrelationId: ' + correlationId + 
            ', Type: ' + eventType + 
            ', IP: ' + req.remoteAddress);
    }
}
```

---

## Summary Checklist

Before submitting code, verify:

- [ ] All dynamic queries use `WITH SECURITY_ENFORCED`
- [ ] Object and field names are validated against schema
- [ ] User input is escaped with `String.escapeSingleQuotes()`
- [ ] Operators are validated against whitelist
- [ ] CRUD/FLS checks are performed via `PrometheionSecurityUtils`
- [ ] Appropriate sharing keyword (`with sharing`, `without sharing`, `inherited sharing`)
- [ ] External integrations use Named Credentials
- [ ] Webhook endpoints validate secrets
- [ ] Input is validated (type, length, format)
- [ ] Error messages don't expose sensitive information
- [ ] Correlation IDs are used for debugging
- [ ] Code includes proper exception handling

---

## Additional Resources

- [Salesforce Security Guide](https://developer.salesforce.com/docs/atlas.en-us.secure_coding_guide.meta/secure_coding_guide/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Salesforce Code Analyzer](https://forcedotcom.github.io/sfdx-scanner/)
- [PrometheionSecurityUtils Source](../force-app/main/default/classes/PrometheionSecurityUtils.cls)

---

**Last Updated**: 2026-02-02  
**Maintained By**: Prometheion Security Team
