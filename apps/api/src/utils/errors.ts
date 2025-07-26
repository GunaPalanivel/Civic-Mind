export class UnauthorizedError extends Error {
  public readonly statusCode = 401;
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = "UnauthorizedError";
    this.context = context;
    Error.captureStackTrace(this, UnauthorizedError);
  }
}

export class ForbiddenError extends Error {
  public readonly statusCode = 403;
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = "ForbiddenError";
    this.context = context;
    Error.captureStackTrace(this, ForbiddenError);
  }
}

export class NotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = "NotFoundError";
    this.context = context;
    Error.captureStackTrace(this, NotFoundError);
  }
}

export class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = "ValidationError";
    this.context = context;
    Error.captureStackTrace(this, ValidationError);
  }
}

export class ConflictError extends Error {
  public readonly statusCode = 409;
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = "ConflictError";
    this.context = context;
    Error.captureStackTrace(this, ConflictError);
  }
}
