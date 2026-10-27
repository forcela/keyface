import { Ctx, SCREEN_SIZE as S, drawBatteryIcon, drawText, rgba, roundRect, textWidth } from '../canvas.utils';
import { BUBBLE_FONT, GenzColors, STICKER_FONT } from './genz.constants';

const DEG = Math.PI / 180;

function tiltedPill(c: Ctx, x: number, y: number, w: number, h: number, deg: number, bg: string, border: string | null, content: () => void): void {
  c.save();
  c.translate(x + w / 2, y + h / 2);
  c.rotate(deg * DEG);
  c.fillStyle = 'rgba(0,0,0,.35)';
  roundRect(c, -w / 2 + 1, -h / 2 + 2, w, h, 6);
  c.fill();
  c.fillStyle = bg;
  roundRect(c, -w / 2, -h / 2, w, h, 6);
  c.fill();
  if (border) {
    c.strokeStyle = border;
    c.lineWidth = 1;
    roundRect(c, -w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, 5.5);
    c.stroke();
  }
  content();
  c.restore();
}

export function drawSpeechBubble(c: Ctx, text: string, p: GenzColors): void {
  const label = text.toUpperCase();
  const w = Math.ceil(textWidth(c, label, BUBBLE_FONT)) + 14;
  const h = 18;
  const x = 6;
  const y = 7;
  const tail = (inset: number) => {
    c.beginPath();
    c.moveTo(x + w - 15, y + h - inset);
    c.lineTo(x + w - 7, y + h + 5);
    c.lineTo(x + w - 8, y + h - inset);
  };
  c.fillStyle = p.card;
  roundRect(c, x, y, w, h, 5);
  c.fill();
  c.strokeStyle = p.accent;
  c.lineWidth = 1;
  roundRect(c, x + 0.5, y + 0.5, w - 1, h - 1, 4.5);
  c.stroke();
  c.fillStyle = p.card;
  tail(1);
  c.fill();
  tail(0.5);
  c.stroke();
  drawText(c, label, x + w / 2, y + 13, { font: BUBBLE_FONT, color: p.light ? p.cardInk : p.accent });
}

export function drawTimeSticker(c: Ctx, time: string, p: GenzColors): void {
  const w = Math.ceil(textWidth(c, time, STICKER_FONT)) + 14;
  tiltedPill(c, 6, 104, w, 18, -3, p.accent, null, () =>
    drawText(c, time, 0, 4.5, { font: STICKER_FONT, color: p.background }),
  );
}

export function drawBatterySticker(c: Ctx, level: number, p: GenzColors): void {
  const label = `${level}%`;
  const w = 8 + 15 + 5 + Math.ceil(textWidth(c, label, STICKER_FONT)) + 8;
  tiltedPill(c, S - 6 - w, 103, w, 18, 3, p.card, rgba(p.cardInk, 0.16), () => {
    drawBatteryIcon(c, -w / 2 + 8, -4, level, { width: 13, height: 8, frame: rgba(p.cardInk, 0.7), fill: p.cardInk });
    drawText(c, label, -w / 2 + 28, 4.5, { font: STICKER_FONT, color: p.cardInk, align: 'left' });
  });
}
