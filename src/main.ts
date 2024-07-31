import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SpeakerComponent } from './speaker/speaker.component';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<speaker></speaker>`,
  imports: [SpeakerComponent],
})
export class App {}

bootstrapApplication(App, {
  providers: [provideAnimationsAsync()],
});
