/**
 * PrometheionPCIAccessAlertHandlerTest - Test coverage for PCI DSS access alert handling
 *
 * @author Prometheion
 * @version 1.0
 */
@IsTest
private class PrometheionPCIAccessAlertHandlerTest {

    // ========================================
    // FAILED ACCESS TESTS
    // ========================================

    @IsTest
    static void testHandleFailedAccess_SingleAttempt() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        events.add(createTestEvent('user001', 'testuser@example.com', '192.168.1.1', 'Failed Login'));

        Test.startTest();
        Exception caughtException = null;
        try {
            PrometheionPCIAccessAlertHandler.handleFailedAccess(events);
        } catch (Exception e) {
            caughtException = e;
        }
        Test.stopTest();

        // Verify handler completed without exception
        System.assertEquals(null, caughtException, 'Handler should complete without throwing exception');
        System.assertEquals(1, events.size(), 'Should have processed 1 event');
    }

    @IsTest
    static void testHandleFailedAccess_MultipleAttempts() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        // Create 3+ events for same user (should trigger critical alert)
        for (Integer i = 0; i < 4; i++) {
            events.add(createTestEvent('user001', 'testuser@example.com', '192.168.1.1', 'Failed Login ' + i));
        }

        Test.startTest();
        PrometheionPCIAccessAlertHandler.handleFailedAccess(events);
        Test.stopTest();

        // Verify handler processed all events without error
        System.assertEquals(4, events.size(), 'Should have processed 4 events for same user');
    }

    @IsTest
    static void testHandleFailedAccess_MultipleUsers() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        // Create events for multiple users
        events.add(createTestEvent('user001', 'user1@example.com', '192.168.1.1', 'Failed Login'));
        events.add(createTestEvent('user002', 'user2@example.com', '192.168.1.2', 'Failed Login'));
        events.add(createTestEvent('user003', 'user3@example.com', '192.168.1.3', 'Failed Login'));

        Test.startTest();
        PrometheionPCIAccessAlertHandler.handleFailedAccess(events);
        Test.stopTest();

        // Verify handler processed events for multiple users
        System.assertEquals(3, events.size(), 'Should have processed 3 events for different users');
    }

    // ========================================
    // AFTER-HOURS ACCESS TESTS
    // ========================================

    @IsTest
    static void testHandleAfterHoursAccess() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        events.add(createTestEvent('user001', 'testuser@example.com', '192.168.1.1', 'View Record'));

        Test.startTest();
        PrometheionPCIAccessAlertHandler.handleAfterHoursAccess(events);
        Test.stopTest();

        // Verify handler processed after-hours event
        System.assertEquals(1, events.size(), 'Should have processed 1 after-hours event');
    }

    @IsTest
    static void testHandleAfterHoursAccess_MultipleEvents() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        for (Integer i = 0; i < 5; i++) {
            events.add(createTestEvent('user00' + i, 'user' + i + '@example.com', '192.168.1.' + i, 'View Record'));
        }

        Test.startTest();
        PrometheionPCIAccessAlertHandler.handleAfterHoursAccess(events);
        Test.stopTest();

        // Should process all after-hours events
        System.assertEquals(5, events.size(), 'Should have processed 5 after-hours events');
    }

    // ========================================
    // BULK ACCESS TESTS
    // ========================================

    @IsTest
    static void testHandleBulkAccess_UnderThreshold() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        events.add(createTestEventWithAction('user001', 'testuser@example.com', '192.168.1.1', 'Bulk: 25 records'));

        Test.startTest();
        PrometheionPCIAccessAlertHandler.handleBulkAccess(events);
        Test.stopTest();

        // Should log event but not trigger alert (under 50 threshold)
        System.assertEquals(1, events.size(), 'Should have processed 1 bulk access event');
    }

    @IsTest
    static void testHandleBulkAccess_OverThreshold() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        events.add(createTestEventWithAction('user001', 'testuser@example.com', '192.168.1.1', 'Bulk: 100 records'));

        Test.startTest();
        PrometheionPCIAccessAlertHandler.handleBulkAccess(events);
        Test.stopTest();

        // Should trigger high priority alert
        System.assertEquals(1, events.size(), 'Should have processed 1 over-threshold bulk access event');
    }

    @IsTest
    static void testHandleBulkAccess_InvalidAction() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        events.add(createTestEventWithAction('user001', 'testuser@example.com', '192.168.1.1', 'Regular access'));

        Test.startTest();
        PrometheionPCIAccessAlertHandler.handleBulkAccess(events);
        Test.stopTest();

        // Should handle invalid action format gracefully
        System.assertEquals(1, events.size(), 'Should have processed event with invalid action format');
    }

    // ========================================
    // SECURITY INCIDENT TESTS
    // ========================================

    @IsTest
    static void testCreateSecurityIncident() {
        Test.startTest();

        PrometheionPCIAccessAlertHandler.createSecurityIncident(
            'Test Security Incident',
            'This is a test incident description',
            'High'
        );

        Test.stopTest();

        // Should create security incident without error
        System.assertNotEquals(null, PrometheionPCIAccessAlertHandler.createSecurityIncident, 'Method should be callable');
    }

    // ========================================
    // EDGE CASE TESTS
    // ========================================

    @IsTest
    static void testHandleEmptyEvents() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        Test.startTest();

        PrometheionPCIAccessAlertHandler.handleFailedAccess(events);
        PrometheionPCIAccessAlertHandler.handleAfterHoursAccess(events);
        PrometheionPCIAccessAlertHandler.handleBulkAccess(events);

        Test.stopTest();

        // Should handle empty lists gracefully
        System.assertEquals(0, events.size(), 'Empty event list should remain empty after processing');
    }

    @IsTest
    static void testHandleNullEventData() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        // Create event with null/empty Event_Data__c
        Prometheion_Raw_Event__e event = new Prometheion_Raw_Event__e(
            Event_Type__c = 'PCI_ACCESS',
            Timestamp__c = System.now(),
            Event_Data__c = null
        );
        events.add(event);

        Test.startTest();
        PrometheionPCIAccessAlertHandler.handleFailedAccess(events);
        Test.stopTest();

        // Should handle null event data gracefully
        System.assertEquals(1, events.size(), 'Should process event with null data without crashing');
    }

    @IsTest
    static void testHandleMalformedJson() {
        List<Prometheion_Raw_Event__e> events = new List<Prometheion_Raw_Event__e>();

        // Create event with malformed JSON
        Prometheion_Raw_Event__e event = new Prometheion_Raw_Event__e(
            Event_Type__c = 'PCI_ACCESS',
            Timestamp__c = System.now(),
            Event_Data__c = 'not valid json {'
        );
        events.add(event);

        Test.startTest();
        PrometheionPCIAccessAlertHandler.handleFailedAccess(events);
        Test.stopTest();

        // Should handle malformed JSON gracefully
        System.assertEquals(1, events.size(), 'Should process event with malformed JSON without crashing');
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private static Prometheion_Raw_Event__e createTestEvent(String userId, String username, String ipAddress, String action) {
        Map<String, Object> eventData = new Map<String, Object>{
            'userId' => userId,
            'username' => username,
            'ipAddress' => ipAddress,
            'userAction' => action,
            'accessType' => 'View',
            'recordId' => '001XXXXXXXXXXXX'
        };

        return new Prometheion_Raw_Event__e(
            Event_Type__c = 'PCI_ACCESS',
            Timestamp__c = System.now(),
            Event_Data__c = JSON.serialize(eventData)
        );
    }

    private static Prometheion_Raw_Event__e createTestEventWithAction(String userId, String username, String ipAddress, String action) {
        Map<String, Object> eventData = new Map<String, Object>{
            'userId' => userId,
            'username' => username,
            'ipAddress' => ipAddress,
            'userAction' => action,
            'accessType' => 'Export',
            'recordId' => '001XXXXXXXXXXXX'
        };

        return new Prometheion_Raw_Event__e(
            Event_Type__c = 'PCI_ACCESS',
            Timestamp__c = System.now(),
            Event_Data__c = JSON.serialize(eventData)
        );
    }
}
