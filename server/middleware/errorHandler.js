const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = {
        status: 500,
        message: 'Internal Server Error'
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
        error = {
            status: 400,
            message: 'Validation Error',
            details: err.details || err.message
        };
    } else if (err.name === 'UnauthorizedError') {
        error = {
            status: 401,
            message: 'Unauthorized'
        };
    } else if (err.code === 'ENOENT') {
        error = {
            status: 404,
            message: 'Resource not found'
        };
    } else if (err.code === 'ECONNREFUSED') {
        error = {
            status: 503,
            message: 'Service unavailable'
        };
    } else if (err.message) {
        error.message = err.message;
    }

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
        delete error.details;
        if (error.status >= 500) {
            error.message = 'Internal Server Error';
        }
    }

    res.status(error.status).json({
        error: error.message,
        ...(error.details && { details: error.details }),
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;