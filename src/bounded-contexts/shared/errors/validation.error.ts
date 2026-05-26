export type ValidationIssue = {
  field: string;
  message: string;
};

export class ValidationError extends Error {
  constructor(readonly issues: ValidationIssue[]) {
    super("Validation failed.");
    this.name = "ValidationError";
  }
}
