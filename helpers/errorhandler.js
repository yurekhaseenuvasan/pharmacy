function errorhandler(err, req, res, next) {
    if (err.name === 'Unauthorised error') {
        return res.status(401).json({ message: 'User is not authorised' })
    }
    if (err.name === 'Validation error') {
        return res.status(401).json({ message: err })
    }
    return res.status(500).json(err)
}
module.exports = errorhandler
