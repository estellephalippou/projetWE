import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MyMemoryTranslateResponse {
  responseData: {
    translatedText: string;
    match?: number;
  };
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http: HttpClient;
  private apiUrl = 'https://api.mymemory.translated.net/get';

  constructor(handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  translate(text: string, targetLang: string): Observable<MyMemoryTranslateResponse> {
    return this.http.get<MyMemoryTranslateResponse>(this.apiUrl, {
      params: {
        q: text,
        langpair: `en|${targetLang}`,
      },
    });
  }
}
