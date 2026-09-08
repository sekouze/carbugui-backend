const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

// Express 4 does not forward a rejected promise from an async handler to
// errorHandler — it becomes an unhandled rejection instead of a clean JSON
// 500. Every controller here is `async`, so every route needs the same
// try/catch-via-then plumbing. Rather than sprinkling asyncHandler(...) on
// every single route/middleware reference, this factory wraps get/post/
// put/patch/delete/use so a plain `express.Router()` swap is enough.
const createAsyncRouter = () => {
  const router = express.Router();

  ['get', 'post', 'put', 'patch', 'delete', 'use'].forEach((method) => {
    const original = router[method].bind(router);

    router[method] = (...args) =>
      original(...args.map((arg) => (typeof arg === 'function' ? asyncHandler(arg) : arg)));
  });

  return router;
};

module.exports = createAsyncRouter;
