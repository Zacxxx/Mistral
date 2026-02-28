export class DataAccessError extends Error {
  constructor(
    public code: string,
    public message: string,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DataAccessError';
  }
}

export class ValidationError extends Error {
  constructor(public message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export const handleDynamoDBError = (error: any): DataAccessError => {
  if (error.code === 'ConditionalCheckFailedException') {
    return new DataAccessError('CONDITION_FAILED', error.message, false, error);
  } else if (error.code === 'ProvisionedThroughputExceededException') {
    return new DataAccessError('THROTTLING', error.message, true, error);
  } else if (error.code === 'ResourceNotFoundException') {
    return new DataAccessError('NOT_FOUND', error.message, false, error);
  } else if (error.code === 'ValidationException') {
    return new DataAccessError('VALIDATION_FAILED', error.message, false, error);
  } else if (error.code === 'InternalServerError') {
    return new DataAccessError('INTERNAL_ERROR', error.message, true, error);
  } else {
    return new DataAccessError('UNKNOWN_ERROR', error.message, false, error);
  }
};