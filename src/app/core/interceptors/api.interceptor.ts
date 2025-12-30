import { HttpInterceptorFn } from '@angular/common/http';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiRoot = 'https://api.realworld.show/api';

  const isAbsoluteUrl = /^https?:\/\//i.test(req.url) || req.url.startsWith('//');
  const isAlreadyPrefixed = req.url.startsWith(apiRoot);

  if (isAbsoluteUrl || isAlreadyPrefixed) {
    return next(req);
  }

  const joinedUrl = req.url.startsWith('/') ? `${apiRoot}${req.url}` : `${apiRoot}/${req.url}`;
  const apiReq = req.clone({ url: joinedUrl });
  return next(apiReq);
};
