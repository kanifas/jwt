const nodemailer = require('nodemailer')
const mail = require('mail')
const sendmail = require('sendmail')();

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAILER_HOST,
            port: process.env.MAILER_PORT,
            auth: {
                user: process.env.MAILER_USER,
                pass: process.env.MAILER_PASS,
            },
        })
    }

    async sendActivationMail(to, link) {
        console.log('start');
        await this.transporter.sendMail({
            to,
            from: process.env.MAILER_USER,
            subject: `Актовация аккаунта ${process.env.API_URL}`,
            text: '',
            html: `
                <div>
                    <h1>Активация аккаунта. Для подтверждения перейдите по ссылке ниже</h1>
                    <a href="${link}" target="_blank">Ссылка для подтверждения</a>
                </div>
            `
        })
    }
}

module.exports = new MailService()