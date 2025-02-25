import { checkSchema } from 'express-validator';

// export default [body('email').notEmpty().withMessage("Email is required!")]

export default checkSchema({
  email: {
    errorMessage: 'Email is required!',
    notEmpty: true,
    trim: true,
    isEmail: {
      errorMessage: 'Email id should valid email!',
    },
  },
  password: {
    trim: true,
    errorMessage: 'password is required!',
    notEmpty: true,
  },
});
