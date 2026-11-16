// 404 Not Found Handler
const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Central Error Handler
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // 1. Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
      value: val.value,
    }));
  }

  // 2. Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': value '${err.value}' is not a valid ${err.kind}`;
    errors = [
      {
        field: err.path,
        message: message,
        value: err.value,
      },
    ];
  }

  // 3. Duplicate Key Error (MongoDB error code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';
    message = `Duplicate key error: '${duplicatedValue}' already exists for ${duplicatedField}`;
    errors = [
      {
        field: duplicatedField,
        message,
        value: duplicatedValue,
      },
    ];
  }

  // 4. Unknown or General Errors
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
