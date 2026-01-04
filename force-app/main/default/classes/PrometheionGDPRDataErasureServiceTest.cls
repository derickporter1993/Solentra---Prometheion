/**
 * Test class for PrometheionGDPRDataErasureService
 * Tests GDPR Article 17 Right to Erasure functionality
 *
 * @author Prometheion
 * @version 1.0
 */
@IsTest
private class PrometheionGDPRDataErasureServiceTest {

    @TestSetup
    static void setupTestData() {
        // Create test accounts
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 200; i++) {
            accounts.add(new Account(
                Name = 'Test Account ' + i
            ));
        }
        insert accounts;

        // Create test contacts
        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < 200; i++) {
            contacts.add(new Contact(
                FirstName = 'Test',
                LastName = 'Contact ' + i,
                Email = 'test' + i + '@example.com',
                AccountId = accounts[i].Id
            ));
        }
        insert contacts;
    }

    @IsTest
    static void testSubmitErasureRequest() {
        Contact c = [SELECT Id FROM Contact LIMIT 1];

        Test.startTest();
        GDPR_Erasure_Request__c request = PrometheionGDPRDataErasureService.submitErasureRequest(
            c.Id,
            'Customer requested data deletion',
            'Right to Erasure'
        );
        Test.stopTest();

        System.assertNotEquals(null, request.Id, 'Request should be created');
        System.assertEquals('Pending', request.Status__c, 'Status should be Pending');
        System.assertEquals(c.Id, request.Contact__c, 'Contact should match');
    }

    @IsTest
    static void testSubmitBulkErasureRequests() {
        List<Contact> contacts = [SELECT Id FROM Contact LIMIT 200];
        Set<Id> contactIds = new Set<Id>();
        for (Contact c : contacts) {
            contactIds.add(c.Id);
        }

        Test.startTest();
        List<GDPR_Erasure_Request__c> requests = PrometheionGDPRDataErasureService.submitBulkErasureRequests(
            contactIds,
            'Bulk erasure request',
            'Right to Erasure'
        );
        Test.stopTest();

        System.assertEquals(200, requests.size(), 'Should create 200 requests');
        for (GDPR_Erasure_Request__c req : requests) {
            System.assertEquals('Pending', req.Status__c, 'All should be Pending');
        }
    }

    @IsTest
    static void testProcessErasureRequest() {
        Contact c = [SELECT Id FROM Contact LIMIT 1];
        GDPR_Erasure_Request__c request = new GDPR_Erasure_Request__c(
            Contact__c = c.Id,
            Request_Reason__c = 'Test reason',
            Legal_Basis__c = 'Right to Erasure',
            Status__c = 'Pending',
            Requested_Date__c = System.now()
        );
        insert request;

        Test.startTest();
        PrometheionGDPRDataErasureService.processErasureRequest(request.Id);
        Test.stopTest();

        request = [SELECT Status__c, Processed_Date__c FROM GDPR_Erasure_Request__c WHERE Id = :request.Id];
        System.assertEquals('Completed', request.Status__c, 'Status should be Completed');
        System.assertNotEquals(null, request.Processed_Date__c, 'Processed date should be set');
    }

    @IsTest
    static void testGetErasureRequestStatus() {
        Contact c = [SELECT Id FROM Contact LIMIT 1];
        GDPR_Erasure_Request__c request = new GDPR_Erasure_Request__c(
            Contact__c = c.Id,
            Request_Reason__c = 'Test reason',
            Legal_Basis__c = 'Right to Erasure',
            Status__c = 'In Progress',
            Requested_Date__c = System.now()
        );
        insert request;

        Test.startTest();
        GDPR_Erasure_Request__c result = PrometheionGDPRDataErasureService.getErasureRequestStatus(request.Id);
        Test.stopTest();

        System.assertEquals('In Progress', result.Status__c, 'Status should match');
    }

    @IsTest
    static void testGetPendingErasureRequests() {
        List<Contact> contacts = [SELECT Id FROM Contact LIMIT 5];
        List<GDPR_Erasure_Request__c> requests = new List<GDPR_Erasure_Request__c>();
        for (Contact c : contacts) {
            requests.add(new GDPR_Erasure_Request__c(
                Contact__c = c.Id,
                Request_Reason__c = 'Test reason',
                Legal_Basis__c = 'Right to Erasure',
                Status__c = 'Pending',
                Requested_Date__c = System.now()
            ));
        }
        insert requests;

        Test.startTest();
        List<GDPR_Erasure_Request__c> pendingRequests = PrometheionGDPRDataErasureService.getPendingErasureRequests();
        Test.stopTest();

        System.assert(pendingRequests.size() >= 5, 'Should return at least 5 pending requests');
    }

    @IsTest
    static void testRejectErasureRequest() {
        Contact c = [SELECT Id FROM Contact LIMIT 1];
        GDPR_Erasure_Request__c request = new GDPR_Erasure_Request__c(
            Contact__c = c.Id,
            Request_Reason__c = 'Test reason',
            Legal_Basis__c = 'Right to Erasure',
            Status__c = 'Pending',
            Requested_Date__c = System.now()
        );
        insert request;

        Test.startTest();
        PrometheionGDPRDataErasureService.rejectErasureRequest(request.Id, 'Legal hold prevents deletion');
        Test.stopTest();

        request = [SELECT Status__c, Rejection_Reason__c FROM GDPR_Erasure_Request__c WHERE Id = :request.Id];
        System.assertEquals('Rejected', request.Status__c, 'Status should be Rejected');
        System.assertEquals('Legal hold prevents deletion', request.Rejection_Reason__c, 'Rejection reason should match');
    }

    @IsTest
    static void testAnonymizeContactData() {
        Contact c = [SELECT Id, FirstName, LastName, Email FROM Contact LIMIT 1];
        String originalEmail = c.Email;

        Test.startTest();
        PrometheionGDPRDataErasureService.anonymizeContactData(c.Id);
        Test.stopTest();

        c = [SELECT FirstName, LastName, Email FROM Contact WHERE Id = :c.Id];
        System.assertNotEquals(originalEmail, c.Email, 'Email should be anonymized');
    }

    @IsTest
    static void testGetComplianceMetrics() {
        Test.startTest();
        Map<String, Object> metrics = PrometheionGDPRDataErasureService.getComplianceMetrics();
        Test.stopTest();

        System.assert(metrics.containsKey('totalRequests'), 'Should contain totalRequests');
        System.assert(metrics.containsKey('pendingRequests'), 'Should contain pendingRequests');
        System.assert(metrics.containsKey('completedRequests'), 'Should contain completedRequests');
    }

    @IsTest
    static void testBulkProcessingGovernorLimits() {
        List<Contact> contacts = [SELECT Id FROM Contact LIMIT 200];
        Set<Id> contactIds = new Set<Id>();
        for (Contact c : contacts) {
            contactIds.add(c.Id);
        }

        Test.startTest();
        Integer startQueries = Limits.getQueries();

        List<GDPR_Erasure_Request__c> requests = PrometheionGDPRDataErasureService.submitBulkErasureRequests(
            contactIds,
            'Bulk test',
            'Right to Erasure'
        );

        Integer endQueries = Limits.getQueries();
        Test.stopTest();

        System.assertEquals(200, requests.size(), 'Should process all 200 records');
        System.assert(endQueries - startQueries < 10, 'Should be bulkified with minimal queries');
    }
}
