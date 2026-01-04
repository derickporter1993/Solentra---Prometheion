public with sharing class PrometheionLegalDocumentGenerator {
    @AuraEnabled
    public static String generateLegalAttestation(String framework, Date startDate, Date endDate) {
        try {
            // Generate compliance evidence pack
            String documentContent = generateEvidencePackContent(framework, startDate, endDate);

            // Create ContentVersion
            ContentVersion cv = new ContentVersion();
            cv.Title = framework + '_Evidence_Pack_' + System.today().format();
            cv.PathOnClient = cv.Title + '.txt';
            cv.VersionData = Blob.valueOf(documentContent);
            cv.IsMajorVersion = true;
            insert cv;

            // Get ContentDocumentId
            cv = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id];
            return cv.ContentDocumentId;
        } catch (Exception e) {
            throw new AuraHandledException('Error generating evidence pack: ' + e.getMessage());
        }
    }

    private static String generateEvidencePackContent(String framework, Date startDate, Date endDate) {
        List<String> contentLines = new List<String>();
        contentLines.add('COMPLIANCE EVIDENCE PACK');
        contentLines.add('========================');
        contentLines.add('');
        contentLines.add('Framework: ' + framework);
        contentLines.add('Generated: ' + System.now());
        contentLines.add('Period: ' + startDate + ' to ' + endDate);
        contentLines.add('');

        // Query compliance graph entries - Big Objects can only query on indexed fields (Compliance_Framework__c, Timestamp__c)
        // Convert Date to Datetime for proper comparison
        Datetime startDateTime = Datetime.newInstance(startDate, Time.newInstance(0,0,0,0));
        Datetime endDateTime = Datetime.newInstance(endDate, Time.newInstance(23,59,59,999));

        List<Prometheion_Compliance_Graph__b> entries = [
            SELECT Graph_Node_Id__c, Entity_Type__c, Risk_Score__c, Drift_Category__c,
                   Timestamp__c
            FROM Prometheion_Compliance_Graph__b
            WHERE Compliance_Framework__c = :framework
            AND Timestamp__c >= :startDateTime
            AND Timestamp__c <= :endDateTime
            WITH SECURITY_ENFORCED
            ORDER BY Timestamp__c DESC
            LIMIT 1000
        ];

        contentLines.add('Total Events: ' + entries.size());
        contentLines.add('');
        contentLines.add('DETAILED AUDIT LOG');
        contentLines.add('==================');
        contentLines.add('');

        for (Prometheion_Compliance_Graph__b entry : entries) {
            contentLines.add('Node: ' + (String.isNotBlank(entry.Graph_Node_Id__c) ? entry.Graph_Node_Id__c : 'N/A'));
            contentLines.add('Type: ' + (String.isNotBlank(entry.Entity_Type__c) ? entry.Entity_Type__c : 'N/A'));
            contentLines.add('Risk: ' + (entry.Risk_Score__c != null ? String.valueOf(entry.Risk_Score__c) : '0') + '/10');
            contentLines.add('Category: ' + (String.isNotBlank(entry.Drift_Category__c) ? entry.Drift_Category__c : 'N/A'));
            contentLines.add('Timestamp: ' + (entry.Timestamp__c != null ? String.valueOf(entry.Timestamp__c) : 'N/A'));
            contentLines.add('---');
            contentLines.add('');
        }

        return String.join(contentLines, '\n');
    }
}
