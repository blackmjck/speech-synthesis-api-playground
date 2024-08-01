import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
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
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSliderModule,
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
    pitch: new FormControl<number>(1), // from 0 to 2 with 1 default
    quote: new FormControl<string>(''),
    rate: new FormControl<number>(1), // from 0.1 to 10 with 1 default
    voice: new FormControl<SpeechSynthesisVoice | null>(null),
    volume: new FormControl<number>(1), // from 0 to 1 with 1 default
  });
  voices: any[] = [];
  synth = window.speechSynthesis;

  constructor() {
    // clear out any previous synth backlog
    window.speechSynthesis.cancel();
  }

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

  formatVolume(value: number): string {
    return (value * 100) + '%';
  }

  getVoices(): void {
    this.voices = this.synth.getVoices();
  }

  pause(): void {
    this.synth.pause();
    this.isPaused = true;
  }

  play(): void {
    const { controls } = this.form;
    const text =
      controls.quote.value || 'Please enter some text to be read.';

    const phrase = new SpeechSynthesisUtterance(text);

    const pitch = controls.pitch.value;
    const rate = controls.rate.value;
    const voice = controls.voice.value;
    const volume = controls.volume.value;

    if (pitch) {
      // round to nearest 0.1
      phrase.pitch = Math.round(pitch * 10) / 10;
    }
    if (rate) { 
      // round to nearest 0.1
      phrase.rate = Math.round(rate * 10) / 10;
    }
    if (voice) {
      phrase.voice = voice;
    }
    if (volume) {
      // round to the nearest 0.01
      phrase.volume = Math.round(volume * 100) / 100;
    }

    console.log(phrase);

    this.synth.speak(phrase);
  }

  resetOptions(): void {
    this.form.patchValue({
      pitch: 1,
      rate: 1,
      volume: 1,
    });
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
