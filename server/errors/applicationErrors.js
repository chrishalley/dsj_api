class ApplicationError extends Error {
  constructor(message, status) {
    super();
    
    Error.captureStackTrace(this, this.constructor);
    
    this.name = this.constructor.name;
    
    this.message = message || 
        'Something went wrong. Please try again.';
    
    this.status = status || 500;
  }
}

class UserNotFoundError extends ApplicationError {
  constructor(message, status) {
    super(message || 'No User found.', status || 404);
  }
}

class PasswordIncorrectError extends ApplicationError {
  constructor(message, status) {
    super(message || 'Password incorrect', status || 400);
  }
}

class InvalidObjectID extends ApplicationError {
  constructor(message, status) {
    super(message || 'Invalid Object ID', status || 400);
  }
}

class InvalidRequest extends ApplicationError {
  constructor(message, status) {
    super(message || 'Invalid request', status || 400);
  }
}

class GeneralError extends ApplicationError {
  constructor(message, status) {
    super(message || 'An error has occurred', status || 500);
  }
}

class UserForbidden extends ApplicationError {
  constructor(message, status) {
    super(message || 'User unauthorised', status || 403);
  }
}

class UserUnauthenticated extends ApplicationError {
  constructor(message, status) {
    super(message || 'User unauthenticated', status || 401);
  }
}

class TokenExpired extends ApplicationError {
  constructor(message, status) {
    super(message || 'Token has expired', status || 403);
  }
}

class TokenInvalid extends ApplicationError {
  constructor(message, status) {
    super(message || 'Token is invalid', status || 400);
  }
}

class InvalidEventDates extends ApplicationError {
  constructor(message, status) {
    super(message || 'Invalid event dates', status || 400);
  }
}

class EventDateTimeClash extends ApplicationError {
  constructor(message, status) {
    super(message || 'An event has already been booked for that time', status || 400);
  }
}

class EventNotFound extends ApplicationError {
  constructor(message, status) {
    super(message || 'No event found', status || 404);
  }
}

class BookingInvalid extends ApplicationError {
  constructor(message, status) {
    super(message || 'Booking invalid', status || 400);
  }
}

class ValidationError extends ApplicationError {
  constructor(message, status) {
    super(message || 'Validation error', status || 400);
  }
}

module.exports = UserNotFoundError;

module.exports = {
  ApplicationError,
  UserNotFoundError,
  PasswordIncorrectError,
  InvalidObjectID,
  InvalidRequest,
  GeneralError,
  UserForbidden,
  UserUnauthenticated,
  TokenExpired,
  TokenInvalid,
  InvalidEventDates,
  EventDateTimeClash,
  EventNotFound,
  BookingInvalid,
  ValidationError
};