/**
 * Tests for {@link HCLogger} covering info, warn, and error log methods
 * including overloads with context maps and exception parameters.
 *
 * Note: HCLogger suppresses output during test execution via {@code Test.isRunningTest()}.
 * These tests verify the methods can be called without exceptions and validate the
 * Level enum values are correctly defined.
 *
 * @author Elaro Team
 * @since v1.0.0 (Spring '26)
 * @group Health Check
 * @see HCLogger
 */
@IsTest(testFor = HCLogger.class)
private class HCLoggerTest {

    @IsTest
    static void shouldLogInfoMessageWithoutException() {
        Exception caughtEx;
        Test.startTest();
        try {
            HCLogger.info('Test info message');
        } catch (Exception e) {
            caughtEx = e;
        }
        Test.stopTest();

        Assert.isNull(caughtEx, 'info(String) should execute without exception');
    }

    @IsTest
    static void shouldLogInfoMessageWithContext() {
        Map<String, Object> context = new Map<String, Object>{
            'recordId' => '001000000000001',
            'action' => 'scan'
        };

        Exception caughtEx;
        Test.startTest();
        try {
            HCLogger.info('Test info with context', context);
        } catch (Exception e) {
            caughtEx = e;
        }
        Test.stopTest();

        Assert.isNull(caughtEx, 'info(String, Map) should execute without exception');
    }

    @IsTest
    static void shouldLogInfoMessageWithNullContext() {
        Exception caughtEx;
        Test.startTest();
        try {
            HCLogger.info('Test info null context', null);
        } catch (Exception e) {
            caughtEx = e;
        }
        Test.stopTest();

        Assert.isNull(caughtEx, 'info(String, null) should handle null context gracefully');
    }

    @IsTest
    static void shouldLogInfoMessageWithEmptyContext() {
        Exception caughtEx;
        Test.startTest();
        try {
            HCLogger.info('Test info empty context', new Map<String, Object>());
        } catch (Exception e) {
            caughtEx = e;
        }
        Test.stopTest();

        Assert.isNull(caughtEx, 'info(String, emptyMap) should handle empty context gracefully');
    }

    @IsTest
    static void shouldLogWarnMessageWithoutException() {
        Exception caughtEx;
        Test.startTest();
        try {
            HCLogger.warn('Test warning message');
        } catch (Exception e) {
            caughtEx = e;
        }
        Test.stopTest();

        Assert.isNull(caughtEx, 'warn(String) should execute without exception');
    }

    @IsTest
    static void shouldLogWarnMessageWithContext() {
        Map<String, Object> context = new Map<String, Object>{
            'threshold' => 80,
            'actual' => 65
        };

        Exception caughtEx;
        Test.startTest();
        try {
            HCLogger.warn('Score below threshold', context);
        } catch (Exception e) {
            caughtEx = e;
        }
        Test.stopTest();

        Assert.isNull(caughtEx, 'warn(String, Map) should execute without exception');
    }

    @IsTest
    static void shouldLogErrorMessageWithoutException() {
        Exception caughtEx;
        Test.startTest();
        try {
            HCLogger.error('Test error message');
        } catch (Exception e) {
            caughtEx = e;
        }
        Test.stopTest();

        Assert.isNull(caughtEx, 'error(String) should execute without exception');
    }

    @IsTest
    static void shouldLogErrorWithExceptionDetails() {
        Exception testEx;
        try {
            Integer result = 1 / 0;
        } catch (Exception ex) {
            testEx = ex;
        }

        Test.startTest();
        HCLogger.error('Division error occurred', testEx);
        Test.stopTest();

        Assert.isNotNull(testEx, 'Test exception should have been captured');
    }

    @IsTest
    static void shouldDefineAllLogLevels() {
        Test.startTest();
        List<HCLogger.Level> levels = HCLogger.Level.values();
        Test.stopTest();

        Assert.areEqual(4, levels.size(), 'Should define exactly 4 log levels');
        Assert.areEqual(HCLogger.Level.DEBUG_LEVEL, levels[0],
            'First level should be DEBUG_LEVEL');
        Assert.areEqual(HCLogger.Level.INFO_LEVEL, levels[1],
            'Second level should be INFO_LEVEL');
        Assert.areEqual(HCLogger.Level.WARN_LEVEL, levels[2],
            'Third level should be WARN_LEVEL');
        Assert.areEqual(HCLogger.Level.ERROR_LEVEL, levels[3],
            'Fourth level should be ERROR_LEVEL');
    }

    @IsTest
    static void shouldHandleNullMessage() {
        Exception caughtEx;
        Test.startTest();
        try {
            HCLogger.info(null);
            HCLogger.warn(null);
            HCLogger.error(null);
        } catch (Exception e) {
            caughtEx = e;
        }
        Test.stopTest();

        Assert.isNull(caughtEx, 'All log methods should handle null messages gracefully');
    }
}
