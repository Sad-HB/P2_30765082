declare module 'i18n' {
  import { Request, Response, NextFunction } from 'express';
  interface I18n {
    configure(options: any): void;
    init(req: Request, res: Response, next: NextFunction): void;
    __: (...args: any[]) => string;
    setLocale(req: Request | Response, locale: string): void;
    getLocale(req: Request | Response): string;
  }
  const i18n: I18n;
  export = i18n;
}
