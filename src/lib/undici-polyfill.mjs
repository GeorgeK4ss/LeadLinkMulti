// Import node-fetch
import nodeFetch from 'node-fetch';

// Export as named exports to match undici's export structure
export const fetch = nodeFetch;
export const FormData = global.FormData || nodeFetch.FormData;
export const Headers = global.Headers || nodeFetch.Headers;
export const Request = global.Request || nodeFetch.Request;
export const Response = global.Response || nodeFetch.Response;

// Export as default as well
export default {
  fetch,
  FormData,
  Headers,
  Request,
  Response
}; 