import { HttpInterceptorFn } from '@angular/common/http';

/**
 * An HttpInterceptorFn that attaches credentials to every outgoing HTTP request.
 * This ensures that session cookies are sent to the backend API.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request and set the withCredentials property to true.
  const authReq = req.clone({
    withCredentials: true,
  });

  // Pass the cloned request instead of the original request to the next handler.
  return next(authReq);
};
