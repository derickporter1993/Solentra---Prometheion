@IsTest
private class PrometheionGraphIndexerTest {
    @TestSetup
    static void setup() {
        PermissionSet ps = new PermissionSet(Name='TestPS', Label='Test PS');
        insert ps;
    }

    @IsTest
    static void testIndexChange_CreatesImmutableNode() {
        PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'TestPS' LIMIT 1];
        Test.startTest();
        String nodeHash = PrometheionGraphIndexer.indexChange('PERMISSION_SET', ps.Id, null, 'SOC2');
        Test.stopTest();

        System.assertNotEquals(null, nodeHash, 'Should return node hash');

        // Big Objects can only query on indexed fields - query recent records and filter in memory
        Datetime recentThreshold = Datetime.now().addDays(-1);
        List<Prometheion_Compliance_Graph__b> nodes = [
            SELECT Graph_Node_Id__c, Risk_Score__c, Entity_Type__c
            FROM Prometheion_Compliance_Graph__b
            WHERE Timestamp__c >= :recentThreshold
            LIMIT 1000
        ];

        // Filter in memory for matching nodeHash
        Prometheion_Compliance_Graph__b matchingNode = null;
        for (Prometheion_Compliance_Graph__b node : nodes) {
            if (node.Graph_Node_Id__c == nodeHash) {
                matchingNode = node;
                break;
            }
        }

        System.assertNotEquals(null, matchingNode, 'Should create one node');
        System.assertEquals('PERMISSION_SET', matchingNode.Entity_Type__c);
    }

    @IsTest
    static void testGenerateDeterministicHash_IsUnique() {
        String hash1 = PrometheionGraphIndexer.generateDeterministicHash('FLOW', '123', 'SOC2');
        String hash2 = PrometheionGraphIndexer.generateDeterministicHash('FLOW', '456', 'SOC2');
        System.assertNotEquals(hash1, hash2, 'Hash should be unique for different entities');
    }

    @IsTest
    static void testIndexChange_InvalidEntity() {
        Test.startTest();
        try {
            PrometheionGraphIndexer.indexChange('INVALID', 'badid', null, 'SOC2');
            System.assert(false, 'Should have thrown exception');
        } catch (Exception e) {
            System.assert(true, 'Expected exception for invalid entity');
        }
        Test.stopTest();
    }
}
