const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')

const saltRounds = 10;

class UserService {
    async registration(email, password)  {
        const candidate = await UserModel.findOne({ email })
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`)
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const activationLink = uuid.v4()
        const user = await UserModel.create({ email, password: hashedPassword, activationLink })
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)
        const userDto = new UserDto(user) // id, email, isActivated
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return { ...tokens, user: userDto }
    }

    async activate(activationLink) {
        const user = await UserModel.findOne({ activationLink })
        if (!user) {
            throw ApiError.BadRequest('Некорректная ссылка активации')
        }
        user.isActivated = true
        await user.save()
    }

    async login(email, password)  {
        const user = await UserModel.findOne({ email })
        if (!user) {
            throw ApiError.BadRequest(`Пользователь не найден`)
        }
        const isPasswordsEquals = await bcrypt.compare(password, user.password)
        if (!isPasswordsEquals) {
            throw ApiError.BadRequest(`Некорректный пароль`)
        }
        const userDto = new UserDto(user) // id, email, isActivated
        const tokens = tokenService.generateTokens({ ...userDto })
        
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return { ...tokens, user: userDto }
    }

    async logout(refreshToken)  {
        const result = await tokenService.removeToken(refreshToken)
        return result
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError()
        }
        const userData = tokenService.validateRefreshToken(refreshToken)
        const tokenFromDatabase = await tokenService.findToken(refreshToken)
        if (!userData || !tokenFromDatabase) {
            throw ApiError.UnauthorizedError()
        }

        const user = await UserModel.findById(userData.id)
        const userDto = new UserDto(user) // id, email, isActivated
        const tokens = tokenService.generateTokens({ ...userDto })
        
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return { ...tokens, user: userDto }
    }

    async getAllUsers() {
        return await UserModel.find()
    }
}

module.exports = new UserService()