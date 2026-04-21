import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublicAuthEndpoint =
    req.url.includes('/api/auth/login/') || req.url.includes('/api/auth/register/');

  if (isPublicAuthEndpoint) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  return next(req);
};