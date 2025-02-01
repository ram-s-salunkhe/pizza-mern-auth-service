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
  firstName: {
    errorMessage: 'Firstname is required!',
    notEmpty: true,
    trim: true,
  },
  lastName: {
    errorMessage: 'lastname is required!',
    notEmpty: true,
    trim: true,
  },
  password: {
    trim: true,
    errorMessage: 'password is required!',
    notEmpty: true,
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: 'Password length should be at least 8 chars!',
    },
  },
});
