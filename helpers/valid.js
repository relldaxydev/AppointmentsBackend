//Validation Helpers
const {
    check
} = require('express-validator')

//Register
exports.validRegister = [
    check('name', 'Name is required').notEmpty()
        .isLength({
            min: 3,
            max: 32
        }).withMessage('Name must be between 3 to 32 characters!'),
    check('email').isEmail().withMessage('Email must be a valid email address!'),
    check('password', 'Password is required').notEmpty(),
    check('password').isLength({
        min: 6
    }).withMessage('Password must constain at least 6 characters!').matches(/\d/).withMessage('Password must contain a number!')
]

//Login
exports.validLogin = [
    check('email').isEmail()
        .withMessage('Must be a valid email address!'),
    check('password', 'Password is required').notEmpty(),
    check('password').isLength({
        min: 6
    }).withMessage('Password must constain at least 6 characters!').matches(/\d/).withMessage('Password must contain a number!')
]

//Forget Password
exports.forgotPasswordValidator = [
    check('email')
        .not()
        .isEmpty()
        .isEmail()
        .withMessage('Must be a valid email address!')
]

//Reset Password
exports.resetPasswordValidator = [
    check('newPassword')
    .not()
    .isEmpty()
    .isLength({
        min:6
    })
    .withMessage('Password must constain at least 6 characters!')
]
