import { HttpInterceptorFn } from '@angular/common/http';

const AUTH_ENDPOINTS = ['/api/auth/login/', '/api/auth/register/', '/api/auth/refresh/', '/api/auth/google/'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => req.url.includes(ep));

  if (isAuthEndpoint) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
