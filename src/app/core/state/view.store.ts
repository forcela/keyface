import { Injectable, signal } from '@angular/core';

/** Which part of the page the user is working on. */
export type ViewMode = 'screen' | 'lighting';

@Injectable({ providedIn: 'root' })
export class ViewStore {
  readonly mode = signal<ViewMode>('screen');
}
