import type { InvoiceEntity } from "../domain/invoice.entity";
import {
  type ValidationResult,
  validateInvoiceDeterministically,
} from "../domain/validation.rules";

export class ValidateDocumentUseCase {
  executeInvoiceValidation(invoice: InvoiceEntity): ValidationResult {
    return validateInvoiceDeterministically(invoice);
  }
}
