import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// The correct import based on the file you provided. My apologies.
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { credentialsInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // provideAnimations() is the correct function for this version of Angular.
    provideAnimations(),

    // Provide HttpClient and register our custom interceptor.
    provideHttpClient(
      withInterceptors([credentialsInterceptor])
    ),
  ],
};

