/**
 * pdfjs-dist's Node build tries to load @napi-rs/canvas and then
 * `new DOMMatrix()`. Vercel serverless has neither, so getText() throws
 * and the old OCR fallback hangs until the 60s platform timeout.
 *
 * Install cheap DOM stubs *before* importing pdf-parse / pdfjs.
 */

class MiniDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  m11 = 1;
  m12 = 0;
  m13 = 0;
  m14 = 0;
  m21 = 0;
  m22 = 1;
  m23 = 0;
  m24 = 0;
  m31 = 0;
  m32 = 0;
  m33 = 1;
  m34 = 0;
  m41 = 0;
  m42 = 0;
  m43 = 0;
  m44 = 1;
  is2D = true;
  isIdentity = true;

  constructor(init?: number[] | string | MiniDOMMatrix) {
    if (Array.isArray(init)) {
      if (init.length >= 6) {
        this.a = Number(init[0]) || 0;
        this.b = Number(init[1]) || 0;
        this.c = Number(init[2]) || 0;
        this.d = Number(init[3]) || 0;
        this.e = Number(init[4]) || 0;
        this.f = Number(init[5]) || 0;
        this.m11 = this.a;
        this.m12 = this.b;
        this.m21 = this.c;
        this.m22 = this.d;
        this.m41 = this.e;
        this.m42 = this.f;
      }
      return;
    }
    if (init instanceof MiniDOMMatrix) {
      Object.assign(this, init);
    }
  }

  scaleSelf(sx = 1, sy = sx): this {
    this.a *= sx;
    this.d *= sy;
    this.m11 = this.a;
    this.m22 = this.d;
    return this;
  }

  translateSelf(tx = 0, ty = 0): this {
    this.e += tx;
    this.f += ty;
    this.m41 = this.e;
    this.m42 = this.f;
    return this;
  }

  multiplySelf(): this {
    return this;
  }

  preMultiplySelf(): this {
    return this;
  }

  invertSelf(): this {
    return this;
  }

  multiply(other?: MiniDOMMatrix): MiniDOMMatrix {
    return other ? new MiniDOMMatrix(other) : new MiniDOMMatrix(this);
  }

  inverse(): MiniDOMMatrix {
    return new MiniDOMMatrix(this);
  }
}

class MiniImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace = "srgb";

  constructor(
    dataOrWidth: Uint8ClampedArray | number,
    widthOrHeight?: number,
    height?: number,
  ) {
    if (typeof dataOrWidth === "number") {
      this.width = dataOrWidth;
      this.height = widthOrHeight ?? 0;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
      return;
    }
    this.data = dataOrWidth;
    this.width = widthOrHeight ?? 0;
    this.height = height ?? 0;
  }
}

class MiniPath2D {
  addPath(): void {
    /* pdfjs only needs the constructor + addPath to exist for text */
  }
}

export function installPdfJsDomPolyfills(): void {
  const global = globalThis as Record<string, unknown>;
  if (typeof global.DOMMatrix === "undefined") {
    global.DOMMatrix = MiniDOMMatrix;
  }
  if (typeof global.ImageData === "undefined") {
    global.ImageData = MiniImageData;
  }
  if (typeof global.Path2D === "undefined") {
    global.Path2D = MiniPath2D;
  }
}
