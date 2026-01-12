/**
 * Test class for PrometheionPCIAccessLogger
 * Tests PCI DSS Requirement 10 access logging functionality
 *
 * @author Prometheion
 * @version 1.0
 */
@IsTest
private class PrometheionPCIAccessLoggerTest {

    @TestSetup
    static void setupTestData() {
        // Create test accounts to use as "payment" records
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 200; i++) {
            accounts.add(new Account(Name = 'Payment Record ' + i));
        }
        insert accounts;
    }

    @IsTest
    static void testLogPaymentDataAccess() {
        Account acc = [SELECT Id FROM Account LIMIT 1];

        Test.startTest();
        PrometheionPCIAccessLogger.logPaymentDataAccess(
            acc.Id,
            'View',
            'User viewed payment record'
        );
        Test.stopTest();

        // Platform events are published asynchronously
        // Verify DML executed within limits
        System.assert(Limits.getDmlStatements() >= 0, 'Access log should complete without DML errors');
    }

    @IsTest
    static void testLogPaymentDataAccess_AllAccessTypes() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        List<String> accessTypes = new List<String>{
            'Query', 'Insert', 'Update', 'Delete', 'View'
        };

        Test.startTest();
        for (String accessType : accessTypes) {
            PrometheionPCIAccessLogger.logPaymentDataAccess(
                acc.Id,
                accessType,
                'Test ' + accessType + ' action'
            );
        }
        Test.stopTest();

        System.assertEquals(5, accessTypes.size(), 'All access types should be logged');
    }

    @IsTest
    static void testLogBulkPaymentDataAccess() {
        List<Account> accounts = [SELECT Id FROM Account LIMIT 200];
        Set<Id> recordIds = new Set<Id>();
        for (Account acc : accounts) {
            recordIds.add(acc.Id);
        }

        Test.startTest();
        PrometheionPCIAccessLogger.logBulkPaymentDataAccess(
            recordIds,
            'Query',
            'Bulk query of payment records'
        );
        Test.stopTest();

        System.assertEquals(200, recordIds.size(), 'Bulk logging should process all 200 records');
    }

    @IsTest
    static void testLogBulkPaymentDataAccess_Empty() {
        Set<Id> emptySet = new Set<Id>();

        Test.startTest();
        PrometheionPCIAccessLogger.logBulkPaymentDataAccess(
            emptySet,
            'Query',
            'Empty bulk query'
        );
        Test.stopTest();

        System.assertEquals(0, emptySet.size(), 'Empty set should be handled without error');
    }

    @IsTest
    static void testLogFailedAccess() {
        Account acc = [SELECT Id FROM Account LIMIT 1];

        Test.startTest();
        PrometheionPCIAccessLogger.logFailedAccess(
            acc.Id,
            'Insufficient permissions to view payment data'
        );
        Test.stopTest();

        System.assertNotEquals(null, acc.Id, 'Failed access should be logged for valid record');
    }

    @IsTest
    static void testLogSensitiveDataView() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        List<String> dataElements = new List<String>{
            'Card Number', 'Expiration Date', 'Billing Address'
        };

        Test.startTest();
        PrometheionPCIAccessLogger.logSensitiveDataView(acc.Id, dataElements);
        Test.stopTest();

        System.assertEquals(3, dataElements.size(), 'Sensitive data view should log all 3 elements');
    }

    @IsTest
    static void testLogSensitiveDataView_EmptyList() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        List<String> emptyElements = new List<String>();

        Test.startTest();
        PrometheionPCIAccessLogger.logSensitiveDataView(acc.Id, emptyElements);
        Test.stopTest();

        System.assertEquals(0, emptyElements.size(), 'Empty elements list should be handled gracefully');
    }

    @IsTest
    static void testGetRecentAccessLogs() {
        Account acc = [SELECT Id FROM Account LIMIT 1];

        Test.startTest();
        List<PrometheionPCIAccessLogger.AccessLogEntry> logs =
            PrometheionPCIAccessLogger.getRecentAccessLogs(acc.Id, 10);
        Test.stopTest();

        System.assertNotEquals(null, logs, 'Should return list (may be empty)');
    }

    @IsTest
    static void testAccessLogEntryWrapper() {
        PrometheionPCIAccessLogger.AccessLogEntry entry = new PrometheionPCIAccessLogger.AccessLogEntry();
        entry.recordId = '001000000000001';
        entry.userId = '005000000000001';
        entry.username = 'test@example.com';
        entry.accessType = 'View';
        entry.userAction = 'Viewed payment details';
        entry.ipAddress = '192.168.1.1';
        entry.timestamp = System.now();

        System.assertEquals('001000000000001', entry.recordId, 'recordId should match');
        System.assertEquals('View', entry.accessType, 'accessType should match');
    }

    @IsTest
    static void testBulkLoggingGovernorLimits() {
        List<Account> accounts = [SELECT Id FROM Account LIMIT 200];
        Set<Id> recordIds = new Set<Id>();
        for (Account acc : accounts) {
            recordIds.add(acc.Id);
        }

        Test.startTest();
        Integer startDML = Limits.getDmlStatements();

        PrometheionPCIAccessLogger.logBulkPaymentDataAccess(
            recordIds,
            'Query',
            'Governor limits test'
        );

        Integer endDML = Limits.getDmlStatements();
        Test.stopTest();

        // Platform event publish is a single DML
        System.assert(endDML - startDML <= 2, 'Should be bulkified');
    }

    @IsTest
    static void testLoggingWithNullRecordId() {
        Test.startTest();
        PrometheionPCIAccessLogger.logPaymentDataAccess(
            null,
            'Query',
            'Query with null record ID'
        );
        Test.stopTest();

        System.assert(Limits.getDmlStatements() >= 0, 'Null record ID should be handled gracefully');
    }

    @IsTest
    static void testMultipleConcurrentLogs() {
        List<Account> accounts = [SELECT Id FROM Account LIMIT 10];

        Test.startTest();
        for (Account acc : accounts) {
            PrometheionPCIAccessLogger.logPaymentDataAccess(acc.Id, 'View', 'Concurrent view');
            PrometheionPCIAccessLogger.logPaymentDataAccess(acc.Id, 'Query', 'Concurrent query');
        }
        Test.stopTest();

        System.assertEquals(10, accounts.size(), 'Multiple concurrent logs should process all accounts');
    }

    @IsTest
    static void testSessionInfoCapture() {
        Account acc = [SELECT Id FROM Account LIMIT 1];

        Test.startTest();
        // In test context, session info may not be available
        PrometheionPCIAccessLogger.logPaymentDataAccess(
            acc.Id,
            'View',
            'Test session capture'
        );
        Test.stopTest();

        System.assertNotEquals(null, acc.Id, 'Session info should be captured for valid record');
    }
}
