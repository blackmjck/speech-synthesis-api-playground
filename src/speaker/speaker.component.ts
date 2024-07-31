import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { fromEvent } from 'rxjs';
import { delay } from 'rxjs/operators';

interface Dictionary {
  [key: string]: any;
}

@Component({
  selector: 'speaker',
  standalone: true,
  styleUrl: './speaker.component.css',
  templateUrl: './speaker.component.html',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class SpeakerComponent implements OnInit {
  isLoading: boolean = true;
  isPaused: boolean = false;
  isSupported: boolean =
    typeof speechSynthesis !== 'undefined' &&
    typeof SpeechSynthesisUtterance !== 'undefined';
  form = new FormGroup({
    quote: new FormControl<string>(''),
    voice: new FormControl<SpeechSynthesisVoice | null>(null),
  });
  voices: any[] = [];
  synth = window.speechSynthesis;

  ngOnInit(): void {
    fromEvent(window.speechSynthesis, 'voiceschanged')
      .pipe(delay(1500))
      .subscribe(() => {
        this.isLoading = false;
        console.log('Voices have loaded');
        this.getVoices();
        this.setDefault();
      });
    // trigger a check
    this.synth.getVoices();

    // check for query params
    const params: Dictionary = new Proxy(
      new URLSearchParams(window.location.search),
      {
        get: (searchParams, prop: string) => searchParams.get(prop),
      }
    );

    // preload text
    if (params['text']) {
      this.form.controls.quote.setValue(params['text']);
    }

    // play on entry
    if (params['autoplay']) {
      this.play();
    }
  }

  getVoices(): void {
    this.voices = this.synth.getVoices();
  }

  pause(): void {
    this.synth.pause();
    this.isPaused = true;
  }

  play(): void {
    const text =
      this.form.controls.quote.value || 'Please enter some text to be read.';

    const phrase = new SpeechSynthesisUtterance(text);

    const voice = this.form.controls.voice.value;

    if (voice) {
      phrase.voice = voice;
    }

    this.synth.speak(phrase);
  }

  resume(): void {
    this.synth.resume();
    this.isPaused = false;
  }

  setDefault(): void {
    if (this.voices.length && !this.form.controls.voice.value) {
      const voice = this.voices.filter((v) => v.default)[0];
      this.form.controls.voice.setValue(voice);
      console.log(`set default voice to ${voice.name}`);
    }
  }

  get shareLink(): string {
    const { origin, pathname } = window.location;
    let link = origin + pathname + '?autoplay=true';
    if (this.form.controls.quote.value) {
      link += '&text=' + encodeURIComponent(this.form.controls.quote.value);
    }
    return link;
  }

  stop(): void {
    this.synth.cancel();
  }
}
