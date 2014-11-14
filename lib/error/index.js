module.exports = function errorHandler(err, req, res, next) {
    // Don't send internal messages in production, log internal message
    // and send a "safe" one to client
    res.status(500).json({error: err.message});
};