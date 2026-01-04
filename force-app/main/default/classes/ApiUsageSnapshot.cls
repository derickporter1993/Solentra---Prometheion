public with sharing class ApiUsageSnapshot implements Schedulable, Queueable {
    public class DailyLimit {
        public Integer Max;
        public Integer Remaining;
    }

    public void execute(QueueableContext qc) { run(); }
    public void execute(SchedulableContext sc) { run(); }

    public static void runAsync() { System.enqueueJob(new ApiUsageSnapshot()); }

    public static void run() {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:SF_Limits/services/data/v60.0/limits');
        req.setMethod('GET');
        req.setHeader('Accept','application/json');
        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() >= 300) throw new CalloutException('Limits callout failed: ' + res.getStatus());

        // Parse JSON response - use Map to avoid nested inner class issue
        Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        Map<String, Object> dailyApiRequests = (Map<String, Object>) jsonResponse.get('DailyApiRequests');

        Integer max = dailyApiRequests != null ? (Integer)dailyApiRequests.get('Max') : null;
        Integer remaining = dailyApiRequests != null ? (Integer)dailyApiRequests.get('Remaining') : null;
        if (max == null || remaining == null) return;
        Integer used = max - remaining;
        Decimal pct = (max == 0) ? 0 : (Decimal.valueOf(used) / Decimal.valueOf(max))*100;

        Datetime now = System.now();
        Datetime projected = null;
        if (used > 0) {
            Datetime midnight = Datetime.newInstance(now.date(), Time.newInstance(0,0,0,0));
            Long secs = (now.getTime() - midnight.getTime())/1000;
            Decimal pctPerSec = (pct / Math.max(1, secs));
            Decimal remainingPct = 100 - pct;
            Long secsToExhaust = (Long) (remainingPct / Math.max(0.0001, pctPerSec));
            projected = now.addSeconds((Integer)Math.min(2147483647, secsToExhaust));
        }

        insert new API_Usage_Snapshot__c(
            Taken_On__c = now,
            Daily_Used__c = used,
            Daily_Limit__c = max,
            Percent_Used__c = pct.setScale(2),
            Projected_Exhaustion__c = projected
        );
    }
}
