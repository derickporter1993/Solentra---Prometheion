import { LightningElement, track } from 'lwc';
import topFlows from '@salesforce/apex/FlowExecutionStats.topFlows';
import { PollingManager } from 'c/utils/pollingManager';

export default class FlowExecutionMonitor extends LightningElement {
  @track rows = [];
  columns = [
    { label: 'Flow', fieldName: 'flowName' },
    { label: 'Runs', fieldName: 'runs', type: 'number' },
    { label: 'Faults', fieldName: 'faults', type: 'number' },
    { label: 'Last Run', fieldName: 'lastRun', type: 'date' }
  ];
  pollingManager;
  
  connectedCallback() {
    this.pollingManager = new PollingManager(() => this.load(), 60000);
    this.load();
    this.pollingManager.start();
    this.pollingManager.setupVisibilityHandling();
  }

  disconnectedCallback() {
    if (this.pollingManager) {
      this.pollingManager.cleanup();
    }
  }
  
  async load() {
    try {
      this.rows = await topFlows({ limitSize: 20 });
    } catch (e) {
      /* eslint-disable no-console */
      console.error(e);
    }
  }
}
