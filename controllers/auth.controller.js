const User = require('../models/auth.model')
const expressJwt = require('express-jwt')
const _ = require('lodash')
const {OAuth2Client} = require('google-auth-library')
const fetch = require('node-fetch')
const {validationResult} = require('express-validator')
const jwt = require('jsonwebtoken')
//Custom error handler to get useful error from database errors
const { errorHandler } = require('../helpers/dbErrorHandling')
// I will use for send email sendgrid you can use nodemailer
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.MAIL_KEY)

exports.registerController = (req, res) => {
    const { name, email, password } = req.body
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        const firstError = errors.array().map(error => error.msg)[0]
        return res.status(422).json({
            error: firstError
        })

    } else {
        User.findOne({
            email
        }).exec((err, user) => {
            if (user) {
                return res.status(400).json({
                    error: "Email is taken"
                })
            }
        })
    }

    // Generate Token
    const token = jwt.sign(
        {
            name, 
            email, 
            password
        },
        process.env.JWT_ACCOUNT_ACTIVATION,
        {
            expiresIn: '15m'
        }
    )

    // Email data sending
    const emailData = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Account Activation Link',
        html: `
            <h1>Please Click in Link to activate!</h1>
            <p>${process.env.CLIENT_URL}/users/activate/${token}</p>
            </hr>
            <p>This email contain sensetive info</p>
            <p>${process.env.CLIENT_URL}</p>
        `
    }

    sgMail.send(emailData).then(sent => {
        return res.json({
            message: `Email has been sent to ${email}`
        })
    }).catch(err => {
        console.log(err)
        return res.status(400).json({
            error:errorHandler(err)
        })
    })
}

//Register for backhand done!


// Activation and Save to database
exports.activationController = (req, res) => {
    
    const {token} = req.body
    console.log(token)
    if(token) {
        //Verify the token is valid or not or expired
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decoded) => {
                if (err) {
                    return res.status(401).json({
                        error: 'Expired Token. Signup again'
                    })
                } else {
                    // if valid save to database
                    // Get Name, Email, Password from token 
                    const {name, email, password} = jwt.decode(token)

                    console.log(email)
                    console.log(name)
                    console.log(password)
                    
                    const user = new User({
                        name, 
                        email,
                        password
                    })

                    user.save((err, user)=> {
                        if(err) {
                            console.log('Save error', errorHandler(err))
                            return res.status(401).json({
                            error: errorHandler(err)
                        })
                        } else {

                            return res.json({
                                success: true,
                                message: user,
                                message: 'Signup success!',
                            })

                        }
                    })
                }
            
        })

    } else {
        return res.json({
            message:'Error! Try again!'
        })
    }
} 

exports.loginController = (req, res) => {
   
    const { email, password } = req.body;
    
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const firstError = errors.array().map(error => error.msg)[0];
        return res.status(422).json({
        errors: firstError
    });

    } else {
    
    // check if user exist
    User.findOne({
      email
    }).exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          errors: 'User with that email does not exist. Please signup'
        });
      }

      // authenticate
      if (!user.authenticate(password)) {
        return res.status(400).json({
          errors: 'Email and password do not match'
        });
      }

      // generate a token and send to client
      const token = jwt.sign(
        {
          _id: user._id
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '7d'
        }
      );
      
      const { _id, name, email, role } = user;

      return res.json({
        token,
        user: {
          _id,
          name,
          email,
          role
        }
      });
    });
  }
};

exports.forgetController = (req, res) => {
    
    const {email} = req.body
    
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        
        const firstError = errors.array().map(error => error.msg)[0];
        
        return res.status(422).json({
            errors: firstError
        });

    } else {
        
        User.findOne({email}, (err, user) => {
            if (err || !user) {
                return res.status(400).json({
                   error: 'User with that email does not exist'
                    
                })
            }
            
            // Exist a user, then we generate a token for user to use in 10 minutes
            const token = jwt.sign({
                _id: user._id
            }, process.env.JWT_RESET_PASSWORD, 
            {
                expiresIn: '10m'
            })
            // send email with this token to user
            const emailData = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Password Reset Link',
                html: `
                    <h1>Please, Click in the Link below for reset your password!</h1>
                    <p>${process.env.CLIENT_URL}/users/password/reset/${token}</p>
                    </hr>
                    <p>This email contain sensetive info</p>
                    <p>${process.env.CLIENT_URL}</p>
                `
            }

            return user.updateOne({
                resetPasswordLink: token
            },(err, success) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    })
                } else {
                    sgMail.send(emailData).then(sent => {
                        return res.json({
                            message: `Email has been sent to ${email}`
                        })
                    }).catch(err => {
                        message: err.message
                    })
                }
            })
        })
    }
}  

exports.resetController = (req, res) => {
    
    const {resetPasswordLink, newPassword} = req.body

    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        
        const firstError = errors.array().map(error => error.msg)[0];
        
        return res.status(422).json({
            errors: firstError
        });

    } else {
        if(resetPasswordLink) {
            jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(err, decoded) {
                if(err) {
                    return res.status(400).json({
                       error: 'Expired Link, try again!'
                    })
                }

                User.findOne({resetPasswordLink}, (err, user) => {
                   if(err || !user) {
                       return res.status(400).json({
                           error: 'Something went wrong. Try Later'
                       })
                   }
                   
                   const updatedFields = {
                       password: newPassword,
                       resetPasswordLink: ""
                   }

                   user = _.extend(user, updatedFields)

                   user.save((err, result) => {
                      if (err) {
                        return res.status(400).json({
                            error: 'Error reseting user password'
                        })
                      }
                      
                      res.json({
                          message: `Great! Now you can login with new password`
                      })
                   })
                })
            })
        }

    }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT)

exports.googleController = (req, res) => {
    
    const { idToken } = req.body
  
    client
      .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT })
        .then(response => {
            // console.log('GOOGLE LOGIN RESPONSE',response)
            const { email_verified, name, email } = response.payload
            
            if (email_verified) {
                
                User.findOne({ email }).exec((err, user) => {
                
                    if (user) {
                        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
                        expiresIn: '7d'
                    });
                
                    const { _id, email, name, role } = user;
                    
                    return res.json({
                        token,
                        user: { _id, email, name, role }
                    })
                
                    } else {
                
                        let password = email + process.env.JWT_SECRET
                    
                        user = new User({ name, email, password })
                    
                        user.save((err, data) => {
                        
                            if (err) {
                                console.log('ERROR GOOGLE LOGIN ON USER SAVE', err);
                            
                                return res.status(400).json({
                                    error: 'User signup failed with google'
                                })
                            }
                        
                            const token = jwt.sign(
                                { _id: data._id },
                                process.env.JWT_SECRET,
                                { expiresIn: '7d' }
                            )
                        
                            const { _id, email, name, role } = data;
                        
                            return res.json({
                                token,
                                user: { _id, email, name, role }
                            })
                        
                        })
                    }
                })
        
            } else {
                
                return res.status(400).json({
                    error: 'Google login failed. Try again'
                })
            
            }
      })
}
  
exports.facebookController = (req, res) => {
    
    console.log('FACEBOOK LOGIN REQ BODY', req.body);
    
    const { userID, accessToken } = req.body;
  
    const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`;
  
    return (
        fetch(url, {
            method: 'GET'
        })
            .then(response => response.json())
            
                .then(response => {
                    
                    const { email, name } = response;
                    
                    User.findOne({ email }).exec((err, user) => {
                        
                        if (user) {
                            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
                            expiresIn: '7d'
                        });
                        
                        const { _id, email, name, role } = user;
                        
                        return res.json({
                            token,
                            user: { _id, email, name, role }
                        });
                        
                        } else {
                            
                            let password = email + process.env.JWT_SECRET;
                            
                            user = new User({ name, email, password });
                            
                            user.save((err, data) => {
                                
                                if (err) {
                                    
                                    console.log('ERROR FACEBOOK LOGIN ON USER SAVE', err);
                                    
                                    return res.status(400).json({
                                        error: 'User signup failed with facebook'
                                    });
                                }

                                const token = jwt.sign(
                                    { _id: data._id },
                                    process.env.JWT_SECRET,
                                    { expiresIn: '7d' }
                                );

                                const { _id, email, name, role } = data;
                                
                                return res.json({
                                    token,
                                    user: { _id, email, name, role }
                                });

                            });
                        }
                    });
                    })
                    
        .catch(error => {
            res.json({
                error: 'Facebook login failed. Try later'
            });
        })
    );
  };