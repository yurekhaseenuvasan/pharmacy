const expressJwt = require('express-jwt')

function authJwt() {
    const secret = process.env.SECRET
    return expressJwt({
        secret,
        algorithms: ['HS256'],
    }).unless({
        path: [`${api}/users/login`, `${api}/users/register`],
    })
}
module.exports = authJwt
