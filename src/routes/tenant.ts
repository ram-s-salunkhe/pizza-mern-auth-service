import Express from 'express';

const router = Express.Router();

router.post('/', (req, res) => {
  res.status(201).json({});
});

export default router;
