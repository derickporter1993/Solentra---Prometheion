import { ShowToastEvent } from 'lightning/platformShowToastEvent';

/**
 * Toast Notification Utilities
 * Provides reusable functions for showing toast notifications
 */

export function showErrorToast(component, title, message) {
  component.dispatchEvent(
    new ShowToastEvent({
      title: title,
      message: message,
      variant: 'error'
    })
  );
}

export function showSuccessToast(component, title, message) {
  component.dispatchEvent(
    new ShowToastEvent({
      title: title,
      message: message,
      variant: 'success'
    })
  );
}

export function showWarningToast(component, title, message) {
  component.dispatchEvent(
    new ShowToastEvent({
      title: title,
      message: message,
      variant: 'warning'
    })
  );
}

export function showInfoToast(component, title, message) {
  component.dispatchEvent(
    new ShowToastEvent({
      title: title,
      message: message,
      variant: 'info'
    })
  );
}
