const jwt = require('jsonwebtoken')
const tokenModel = require('../models/token-model')

class TokenService {
    generateTokens(payload) {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
        return {
            accessToken,
            refreshToken
        }
    }

    async saveToken(userId, refreshToken) {
        const tokentData = await tokenModel.findOne({
            user: userId
        })
        if (tokentData) {
            tokentData.refreshToken = refreshToken
            return tokentData.save()
        }
        const token = await tokenModel.create({ user: userId, refreshToken })
        return token    
    }

    async removeToken(refreshToken) {
        const deletedToken = await tokenModel.deleteOne({ refreshToken })
        return deletedToken
    }

    async findToken(refreshToken) {
        const foundToken = await tokenModel.findOne({ refreshToken })
        return foundToken
    }

    validateAccessToken(token) {
        try {
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
            return userData
        } catch (error) {
            return null
        }
    }

    validateRefreshToken(token) {
        try {
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
            return userData
        } catch (error) {
            return null
        }
    }
}

module.exports = new TokenService()