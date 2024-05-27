const request = require("request");
module.exports = {
  GET: async ({ url, ...options }) => {
    return new Promise((resolve) => {
      request.get(
        {
          url,
          ...options,
        },
        (error, response, body) => {
          resolve({
            error,
            response,
            body,
          });
        }
      );
    });
  },
  POST: async ({ url, ...options }) => {
    return new Promise((resolve) => {
      request.post(
        {
          url,
          ...options,
        },
        (error, response, body) => {
          resolve({
            error,
            response,
            body,
          });
        }
      );
    });
  },
};
