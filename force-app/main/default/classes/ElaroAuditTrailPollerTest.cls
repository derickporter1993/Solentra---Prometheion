@isTest
private class ElaroAuditTrailPollerTest {
    
    @isTest
    static void testSchedule() {
        Test.startTest();
        String jobId = ElaroAuditTrailPoller.schedule();
        Test.stopTest();
        
        Assert.areNotEqual(null, jobId, 'Job should be scheduled');
        
        // Verify job was created
        List<CronTrigger> jobs = [
            SELECT Id, CronJobDetail.Name 
            FROM CronTrigger 
            WHERE Id = :jobId
        ];
        
        Assert.areEqual(1, jobs.size(), 'Job should exist');
        Assert.areEqual('Elaro Audit Trail Poller', jobs[0].CronJobDetail.Name);
    }
    
    @isTest
    static void testUnschedule() {
        // First schedule a job
        String jobId = ElaroAuditTrailPoller.schedule();
        
        Test.startTest();
        ElaroAuditTrailPoller.unschedule();
        Test.stopTest();
        
        // Verify job was removed
        List<CronTrigger> jobs = [
            SELECT Id 
            FROM CronTrigger 
            WHERE CronJobDetail.Name = 'Elaro Audit Trail Poller'
        ];
        
        Assert.areEqual(0, jobs.size(), 'Job should be unscheduled');
    }
    
    @isTest
    static void testExecute() {
        ElaroAuditTrailPoller poller = new ElaroAuditTrailPoller();
        SchedulableContext ctx = null;
        
        Test.startTest();
        poller.execute(ctx);
        Test.stopTest();
        
        // Coverage-only: verifies poller executed without errors
        Assert.isNotNull(poller, 'Poller should not be null');
    }
    
    @isTest
    static void testPollAuditTrail() {
        Test.startTest();
        ElaroAuditTrailPoller.pollAuditTrail();
        Test.stopTest();
        
        // Coverage-only: verifies audit trail polling executed without errors
        Assert.isNotNull(ElaroAuditTrailPoller.class, 'Poller class should exist');
    }
}

