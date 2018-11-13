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
  constructor(message) {
    super(message || 'No User found.', 404);
  }
}

class PasswordIncorrectError extends ApplicationError {
  constructor(message) {
    super(message || 'Password incorrect', 400);
  }
}

class InvalidUserID extends ApplicationError {
  constructor(message) {
    super(message || 'Invalid user ID', 400);
  }
}

class InvalidRequest extends ApplicationError {
  constructor(message) {
    super(message || 'Invalid request', 400);
  }
}

class GeneralError extends ApplicationError {
  constructor(message) {
    super(message || 'An error has occurred', 520);
  }
}

class UserForbidden extends ApplicationError {
  constructor(message) {
    super(message || 'User unauthorised', 403);
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
  UserForbidden
};