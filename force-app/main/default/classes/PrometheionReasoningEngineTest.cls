@IsTest
private class PrometheionReasoningEngineTest {
    @TestSetup
    static void setup() {
        // Create a test permission set for entity testing
        PermissionSet ps = new PermissionSet(
            Name = 'TestReasoningPS',
            Label = 'Test Reasoning Permission Set'
        );
        insert ps;
    }

    @IsTest
    static void testReasoningResult_Constructor() {
        Test.startTest();
        PrometheionReasoningEngine.ReasoningResult result = new PrometheionReasoningEngine.ReasoningResult(
            true,
            0.95,
            'TEST_POLICY',
            'SOC2-1.1',
            'Test explanation',
            'audit123',
            false
        );
        Test.stopTest();

        System.assertEquals(true, result.isViolation, 'isViolation should be true');
        System.assertEquals(0.95, result.confidence, 'confidence should match');
        System.assertEquals('TEST_POLICY', result.policy, 'policy should match');
        System.assertEquals('SOC2-1.1', result.legalCitation, 'legalCitation should match');
        System.assertEquals('Test explanation', result.explanation, 'explanation should match');
        System.assertEquals('audit123', result.auditTrailId, 'auditTrailId should match');
        System.assertEquals(false, result.requiresHumanReview, 'requiresHumanReview should be false');
    }

    @IsTest
    static void testReasoningResult_RequiresHumanReview() {
        Test.startTest();
        PrometheionReasoningEngine.ReasoningResult result = new PrometheionReasoningEngine.ReasoningResult(
            true,
            0.50,
            'LOW_CONFIDENCE_POLICY',
            'GDPR-2.3',
            'Low confidence explanation',
            'audit456',
            true
        );
        Test.stopTest();

        System.assertEquals(true, result.requiresHumanReview, 'Should require human review');
        System.assertEquals(0.50, result.confidence, 'Low confidence value should be preserved');
    }

    // PredictionResult class was removed - tests simplified to test ReasoningResult directly

    @IsTest
    static void testReasoningException() {
        Test.startTest();
        try {
            throw new PrometheionReasoningEngine.ReasoningException('Test error message');
        } catch (PrometheionReasoningEngine.ReasoningException e) {
            System.assertEquals('Test error message', e.getMessage(), 'Exception message should match');
        }
        Test.stopTest();
    }

    @IsTest
    static void testExplainViolation_NodeNotFound() {
        Test.startTest();
        try {
            PrometheionReasoningEngine.explainViolation('nonexistent_hash', 'SOC2');
            System.assert(false, 'Should have thrown ReasoningException');
        } catch (PrometheionReasoningEngine.ReasoningException e) {
            System.assert(e.getMessage().contains('Node not found'), 'Should throw node not found error');
        }
        Test.stopTest();
    }

    @IsTest
    static void testReasoningResult_AuraEnabled() {
        // Verify that ReasoningResult properties are properly exposed for Lightning components
        Test.startTest();
        PrometheionReasoningEngine.ReasoningResult result = new PrometheionReasoningEngine.ReasoningResult(
            false,
            0.75,
            'AURA_TEST_POLICY',
            'HIPAA-4.5',
            'Aura enabled test',
            'auraAudit789',
            true
        );
        Test.stopTest();

        // Access all AuraEnabled properties to ensure they're properly exposed
        System.assertNotEquals(null, result.isViolation);
        System.assertNotEquals(null, result.confidence);
        System.assertNotEquals(null, result.policy);
        System.assertNotEquals(null, result.legalCitation);
        System.assertNotEquals(null, result.explanation);
        System.assertNotEquals(null, result.auditTrailId);
        System.assertNotEquals(null, result.requiresHumanReview);
    }

    // PredictionResult class was removed - these tests removed as functionality now uses simplified rule-based approach

    @IsTest
    static void testReasoningResult_NoViolation() {
        Test.startTest();
        PrometheionReasoningEngine.ReasoningResult result = new PrometheionReasoningEngine.ReasoningResult(
            false,
            0.90,
            'COMPLIANT_POLICY',
            'ISO-27001',
            'No violation detected',
            'compliantAudit',
            false
        );
        Test.stopTest();

        System.assertEquals(false, result.isViolation, 'Should indicate no violation');
        System.assertEquals(false, result.requiresHumanReview, 'Should not require human review');
    }
}
