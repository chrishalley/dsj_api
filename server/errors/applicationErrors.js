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

class InvalidUserID extends ApplicationError {
  constructor(message, status) {
    super(message || 'Invalid user ID', status || 400);
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

class TokenExpired extends ApplicationError {
  constructor(message, status) {
    super(message || 'Token has expired', status || 403);
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

module.exports = UserNotFoundError;

module.exports = {
  ApplicationError,
  UserNotFoundError,
  PasswordIncorrectError,
  InvalidUserID,
  InvalidRequest,
  GeneralError,
  UserForbidden,
  TokenExpired,
  InvalidEventDates,
  EventDateTimeClash
};