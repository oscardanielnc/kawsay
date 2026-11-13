import type { LabelReading } from '@kawsay/contracts/catalog';

/** A photo of a food label, as the phone sent it. */
export interface LabelImage {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png';
}

/** The vision model behind a port (ADR 0007, ADR 0029): reads a label's numbers, never estimates them. */
export abstract class LabelReader {
  /** `problems`: what was wrong with the previous reading, for the one corrected retry. */
  abstract read(image: LabelImage, problems?: string[]): Promise<LabelReading>;
}
