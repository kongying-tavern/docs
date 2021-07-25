// @ts-nocheck
import { Vec2, Vec3, Mat2, Mat3, Mat4, Quat } from 'https://cdn.skypack.dev/wtc-math';

import gifJs from 'https://cdn.skypack.dev/gif.js';

console.clear();

const setup = function() {
  const dimensions = [window.innerWidth, window.innerHeight];

  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);

  const renderer = new Renderer(canvas, { width: dimensions[0], height: dimensions[1], alpha: false, premultipliedAlpha: true, preserveDrawingBuffer: true });
  const ctx = renderer.ctx;

  let drawing = new Float32Array([ -1.0,  1.0,   1.0,  1.0,   -1.0, -1.0,   1.0, -1.0]);

  const drawBuffer = new Buffer(ctx, drawing);

  const vertexShader_buffer = document.getElementById('vertexShader_buffer').innerText;

  const programMain = new Program(ctx, vertexShader_buffer, document.getElementById('fragmentShader_under').innerText, {
    clearColour: [.15, .15, 0.25, 1.],
    renderType: Program.RENDER_STRIP
  });

  const time = new Uniform(ctx, 'time', Uniform.TYPE_FLOAT, 100);
  const uDelta = new Uniform(ctx, 'delta', Uniform.TYPE_FLOAT, 100);
  const mouse = new Uniform(ctx, 'mouse', Uniform.TYPE_V2, [0.,0.]);

  const noise = new Texture(ctx, 'noise', {
    textureType: Texture.IMAGETYPE_TILE,
    url: 'https://assets.codepen.io/982762/noise.png'
  });

  noise.preload().then((n) => {
    requestAnimationFrame(run);
  });

  let pointerdown = false;
  let lastPos = new Vec2();
  window.addEventListener('pointerdown', (e) => {
    pointerdown = true;
    lastPos = new Vec2(e.x, e.y);
  });
  window.addEventListener('pointerup', (e) => {
    pointerdown = false;
  });
  window.addEventListener('pointermove', (e) => {
    if(pointerdown) {
      let newPos = new Vec2(e.x, e.y);
      mouse.value = newPos.array;
    }
  });

  let playing = true;
  const setPlaying = (value) => {
    playing = value;
  }

  let autoTransitionTimer = 0;
  let timeToTransition = 0;
  const setupValues = (i) => {
    dimensions[0] = window.innerWidth;
    dimensions[1] = window.innerHeight;

    time.value = -10000;
  }

  setupValues(0);

  let timeout;
  window.addEventListener('resize', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      dimensions[0] = window.innerWidth;
      dimensions[1] = window.innerHeight;
      renderer.resize(dimensions[0], dimensions[1]);
    }, 100);
  });

  const opx = renderer.pxRatio;
  let then = 0;
  // let framenum = 0;
  // let framesPerFrame = 10;
  // let gif = new gifJs({
  //   workers: 2,
  //   quality: 10
  // });
  // gif.on('finished', function(blob) {
  //   console.log('ss')
  //   window.open(URL.createObjectURL(blob));
  // });

  // const offscreenCanvas = document.createElement("canvas");
  // offscreenCanvas.className = 'osc';
  // offscreenCanvas.width = canvas.width;
  // offscreenCanvas.height = canvas.height;
  // const osctx = offscreenCanvas.getContext("2d");
  // document.body.appendChild(offscreenCanvas);

  let gifDone = false;
  const run = (delta) => {

  //   if(framenum < 10 * framesPerFrame) {
  //     if(framenum % framesPerFrame == 0) {
  //       // gif.addFrame(canvas, {delay: 100});

  //       osctx.drawImage(canvas,0,0);

  //       gif.addFrame(offscreenCanvas, {copy: true, delay: 100});
  //       // gif.addFrame(ctx, {copy: true});
  //     }
  //     framenum++;
  //   } else if(gifDone === false) {
  //     console.log(framenum)

  //     gif.render();

  //     window.gif = gif;

  //     gifDone = true;
  //   }

    let now = Date.now() / 1000;
    let _delta = now - then;
    then = now;

    if(_delta > 1000) {
      requestAnimationFrame(run);
      return;
    }

    if(playing) {
      uDelta.value = Math.min(_delta, 0.5);
      time.value += _delta * .05;

      renderer.setViewport();
      renderer.setupProgram(programMain, [drawBuffer], [], [time, mouse, noise]);
      renderer.render(4);

      requestAnimationFrame(run);
    }
  }
}

// Determine whether a number is a power of 2
function powerOf2(v) {
  return v && !(v & (v - 1));
}
// Return the next greatest power of 2
function nextPow2( v ) {
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  v++;
  return v;
}
// Update a provided image to the nearest power of 2 in size.
const pow2Image = (c) => {
  const newWidth = powerOf2(c.width) ? c.width : nextPow2(c.width);
  const newHeight = powerOf2(c.height) ? c.height : nextPow2(c.height);
  const _c = document.createElement('canvas');
  const ctx = _c.getContext('2d');
  _c.width = newWidth;
  _c.height = newHeight;
  ctx.drawImage(c, 0, 0, newWidth, newHeight);
  return _c;
}
const asyncImageLoad = function(img, src) {
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  })
}
const glEnumToString = (function() {
  const haveEnumsForType = {};
  const enums = {};

  function addEnums(gl) {
    const type = gl.constructor.name;
    if (!haveEnumsForType[type]) {
      for (const key in gl) {
        if (typeof gl[key] === 'number') {
          const existing = enums[gl[key]];
          enums[gl[key]] = existing ? `${existing} | ${key}` : key;
        }
      }
      haveEnumsForType[type] = true;
    }
  }

  return function glEnumToString(gl, value) {
    addEnums(gl);
    return enums[value] || (typeof value === 'number' ? `0x${value.toString(16)}` : value);
  };
}());
const addExtensions = (ctx) => {
  // Set up the extensions
  ctx.getExtension('OES_standard_derivatives');
  ctx.getExtension('EXT_shader_texture_lod');
  ctx.getExtension('OES_texture_float');
  ctx.getExtension('WEBGL_color_buffer_float');
  ctx.getExtension('OES_texture_float_linear');
  ctx.getExtension('EXT_color_buffer_float');
}
function createContext(c, opt_attribs, params) {
  const ctx = c.getContext("webgl", params) || this._el.getContext("experimental-webgl", params);

  addExtensions(ctx);

  return ctx;
}

const quatToMat4 = (q) => {
    if(q.array) q = q.array; // This just transforms a provided vector into to an array.

    if(q instanceof Array && q.length >= 4) {
      const [x, y, z, w] = q;
      const [x2, y2, z2] = q.map(x => x * 2.);

      const xx = x * x2,
            yx = y * x2,
            yy = y * y2,
            zx = z * x2,
            zy = z * y2,
            zz = z * z2,
            wx = w * x2,
            wy = w * y2,
            wz = w * z2;

      return new Mat4(
        1 - yy -zz, yx -wz, zx + wy, 0,
        yx + wz, 1 - xx - zz, zy - wx, 0,
        zx - wy, zy + wx, 1 - xx - yy, 0,
        0, 0, 0, 1
      );
    }
  }

class Renderer {
  static #defaultOptions = {
    width: 512,
    height: 512,
    pxRatio: Math.min(window.devicePixelRatio, 2),
    clearing: true,
    depthTesting: true,
    premultipliedAlpha: true
  }

  static BLENDING_DEBUG      = -1;
  static BLENDING_NORMAL      = 1;
  static BLENDING_ADDITIVE    = 2;
  static BLENDING_SUBTRACTIVE = 4;
  static BLENDING_MULTIPLY    = 8;
  static BLENDING_OFF         = 16;

  isWebgl2 = false;

  #blending;
  #blendingEnabled = false;
  #buffers = [];

  constructor(canvas, options) {
    options = Object.assign({}, Renderer.#defaultOptions, options);
    this.width = options.width;
    this.height = options.height;
    this.pxRatio = options.pxRatio;
    this.clearing = options.clearing;
    this.depthTesting = options.depthTesting;
    this.canvas = canvas || document.createElement('canvas');
    this.canvas.width = this.width * this.pxRatio;
    this.canvas.height = this.height * this.pxRatio;
    this.premultipliedAlpha = options.premultipliedAlpha;

    this.ctx = this.canvas.getContext("webgl", options) || this.canvas.getContext("experimental-webgl", options);

    this.ctx.viewportWidth = this.canvas.width;
    this.ctx.viewportHeight = this.canvas.height;

    this.uniformResolution = new Uniform(this.ctx, 'resolution', Uniform.TYPE_V2, [this.canvas.width, this.canvas.height]);

    this.addExtensions();
  }
  resize(w, h, ratio) {
    this.width = w;
    this.height = h;
    this.pxRatio = ratio || this.pxRatio;
    this.canvas.width = this.width * this.pxRatio;
    this.canvas.height = this.height * this.pxRatio;

    this.ctx.viewportWidth = this.canvas.width;
    this.ctx.viewportHeight = this.canvas.height;

    this.uniformResolution = new Uniform(this.ctx, 'resolution', Uniform.TYPE_V2, [this.canvas.width, this.canvas.height]);
  }
  setViewport(dimensions) {
    let w = this.width*this.pxRatio;
    let h = this.height*this.pxRatio;
    if(dimensions) {
      w = dimensions[0];
      h = dimensions[1];
    }
    this.ctx.viewport(0, 0, w, h);
    this.uniformResolution = new Uniform(this.ctx, 'resolution', Uniform.TYPE_V2, [w, h]);
  }
  addExtensions() {
    this.ctx.getExtension('OES_standard_derivatives');
    this.ctx.getExtension('EXT_shader_texture_lod');
    this.ctx.getExtension('OES_texture_float');
    this.ctx.getExtension('WEBGL_color_buffer_float');
    this.ctx.getExtension('OES_texture_float_linear');
    this.ctx.getExtension('EXT_color_buffer_float');
  }
  linkBuffer(buffer) {
    let hasBuffer = false;
    this.#buffers.forEach((b) => {
      if(buffer === b) hasBuffer = true;
    });
    if(!hasBuffer) {
      this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, buffer.buffer);
      this.ctx.bufferData(
        this.ctx.ARRAY_BUFFER,
        buffer.data,
        buffer.drawType);
    }
    buffer.link(this.currentProgram.program);
  }
  setupProgram(program, buffers, attributes, uniforms) {
    this.currentProgram = program;
    this.ctx.useProgram(program.program);

    this.premultiplied = program.premultiplied;

    this.depthTesting = program.depthTesting;


    if(program.blending === Program.BLENDING_NORMAL && program.transparent === false ) {
      this.blending = Program.BLENDING_OFF;
    } else {
      this.blending = program.blending;
    }

    this.clearColour = program.clearColour;
    const a = this.clearColour[3];
    // console.log('prem', this.premultipliedAlpha)
    if(this.premultipliedAlpha) this.clearColour = this.clearColour.map((c, i) => c * a );

    this.ctx.clearColor(...this.clearColour);

    // TODO: Unlink unused buffers during this setup phase as well.
    buffers.forEach(buffer => {
      this.linkBuffer(buffer);
    });

    // this.ctx.enable(ctx.DEPTH_TEST);
    if(this.depthTesting) this.ctx.enable(this.ctx.DEPTH_TEST);
    else this.ctx.disable(this.ctx.DEPTH_TEST);

    uniforms.forEach(uniform => {
      uniform.bind(program.program);
    });
    this.uniformResolution.bind(program.program);
  }
  render(points, buffer) {
    this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, buffer?.fb || null);
    if(this.clearing) {
      this.ctx.clear( this.ctx.COLOR_BUFFER_BIT );

      if(this.depthTesting) this.ctx.clear( this.ctx.DEPTH_BUFFER_BIT );
    }
    switch(this.currentProgram.renderType) {
      case Program.RENDER_TRIANGLES:
        this.ctx.drawArrays(this.ctx.TRIANGLES, 0, points);
        break;
      case Program.RENDER_STRIP:
        this.ctx.drawArrays(this.ctx.TRIANGLE_STRIP, 0, points);
        break;
      case Program.RENDER_LINES:
        this.ctx.drawArrays(this.ctx.LINE_STRIP, 0, points);
        break;
      case Program.RENDER_LINELOOP:
        this.ctx.drawArrays(this.ctx.LINE_LOOP, 0, points);
        break;
      case Program.RENDER_POINTS:
        this.ctx.drawArrays(this.ctx.POINTS, 0, points);
        break;
    }

  }

  /* SETTERS AND GETTERS */
  get blending() {
    return this.#blending || Program.BLENDING_NORMAL;
  }
  set blending(blending) {

    if(blending === Renderer.BLENDING_DEBUG) {

      if(!this.breakLog) {
        console.log(blending, Renderer.BLENDING_OFF, this.premultiplied)
        this.breakLog = true;
      }
      this.#blending = blending;
      this.ctx.enable(this.ctx.BLEND);
        this.ctx.blendFuncSeparate( this.ctx.ONE, this.ctx.ONE_MINUS_SRC_ALPHA, this.ctx.ONE, this.ctx.ONE_MINUS_SRC_ALPHA );
      return;
    }

    this.#blending = blending;
    if(blending === Renderer.BLENDING_OFF) {
      this.ctx.disable(this.ctx.BLEND);
      this.#blendingEnabled = false;
      return;
    }
		if ( this.#blendingEnabled === false ) {
      this.ctx.enable(this.ctx.BLEND);
      // this.ctx.alphaFunc(this.ctx.GL_GREATER, 0.5);
      // this.ctx.enable(this.ctx.GL_ALPHA_TEST);
			this.#blendingEnabled = true;
		}

		if( this.premultiplied ) {
      switch (this.blending) {
        case Renderer.BLENDING_NORMAL:
          this.ctx.blendFuncSeparate( this.ctx.ONE, this.ctx.ONE_MINUS_SRC_ALPHA, this.ctx.ONE, this.ctx.ONE_MINUS_SRC_ALPHA );
          break;
        case Renderer.BLENDING_ADDITIVE:
          this.ctx.blendFunc( this.ctx.ONE, this.ctx.ONE );
          break;
        case Renderer.BLENDING_SUBTRACTIVE:
          this.ctx.blendFuncSeparate( this.ctx.ZERO, this.ctx.ZERO, this.ctx.ONE_MINUS_SRC_COLOR, this.ctx.ONE_MINUS_SRC_ALPHA );
          break;
        case Renderer.BLENDING_MULTIPLY:
          this.ctx.blendFuncSeparate( this.ctx.ZERO, this.ctx.SRC_COLOR, this.ctx.ZERO, this.ctx.SRC_ALPHA );
          break;
      }
    } else {
      switch (this.blending) {
        case Renderer.BLENDING_NORMAL:
          this.ctx.blendFuncSeparate( this.ctx.SRC_ALPHA, this.ctx.ONE_MINUS_SRC_ALPHA, this.ctx.ONE, this.ctx.ONE_MINUS_SRC_ALPHA );
          break;
        case Renderer.BLENDING_ADDITIVE:
          this.ctx.blendFunc( this.ctx.SRC_ALPHA, this.ctx.ONE );
          break;
        case Renderer.BLENDING_SUBTRACTIVE:
          this.ctx.blendFunc( this.ctx.ZERO, this.ctx.ONE_MINUS_SRC_COLOR );
          break;
        case Renderer.BLENDING_MULTIPLY:
          this.ctx.blendFunc( this.ctx.ZERO, this.ctx.SRC_COLOR );
          break;
      }
    }
  }
}
class Buffer {
  static #defaultAttribute = {
        numComponents: 2,
        offset: 0,
        stride: 0
      };
  static #defaults = {
    attributes: [{
        name: 'position'
      }
    ],
    normalized: false,
    drawType: window.WebGLRenderingContext.STATIC_DRAW,
    type: window.WebGLRenderingContext.FLOAT
  }
  constructor(ctx, data, options) {
    this.ctx = ctx;
    this.name = name;
    options = Object.assign({}, Buffer.#defaults, options);
    this.attributes = options.attributes.map(a => Object.assign({}, Buffer.#defaultAttribute, a));

    this.normalized = options.normalized;
    this.drawType = options.drawType;
    this.type = options.type;
    if(data instanceof Array) data = new Float32Array(data);
    this.data = data;
    this.buffer = ctx.createBuffer();
  }

  link(program, hasBuffer = false) {
    let location = this.ctx.getAttribLocation(program, `a_${this.name}`);

    this.attributes.forEach(attribute => {
      const location = this.ctx.getAttribLocation(program, `a_${attribute.name}`);
      this.ctx.vertexAttribPointer(location, attribute.numComponents, this.type, this.normalized, attribute.stride, attribute.offset);
      this.ctx.enableVertexAttribArray(location);
    });
  }

  get length() {
    return this.data.length;
  }
}
class Program {

  static RENDER_TRIANGLES     = 0;
  static RENDER_STRIP         = 1;
  static RENDER_LINES         = 2;
  static RENDER_LINELOOP      = 4;
  static RENDER_POINTS        = 8;

  static #defaultOptions = {
    renderType: Program.RENDER_TRIANGLES,
    clearColour: [1.0, 1.0, 1.0, 1.0],
    blending: Renderer.BLENDING_OFF,
    premultiplied: true,
    transparent: false,
    depthTesting: true
  }

  #vShader
  #fShader
  #p
  #renderType

  constructor(ctx, vertexShaderSource, fragmentShaderSource, options = {}) {
    options = Object.assign({}, Program.#defaultOptions, options);

    this.ctx = ctx;

    this.renderType = options.renderType;

    this.clearColour = options.clearColour;
    this.blending = options.blending;
    this.premultiplied = options.premultiplied;
    this.transparent = options.transparent;
    this.depthTesting = options.depthTesting;

    // Create the shaders
    this.vShader = Program.createShaderOfType(this.ctx, this.ctx.VERTEX_SHADER, vertexShaderSource);
    this.fShader = Program.createShaderOfType(this.ctx, this.ctx.FRAGMENT_SHADER, fragmentShaderSource);

    // Create the program and link the shaders
    this.#p = this.ctx.createProgram();
    this.ctx.attachShader(this.#p, this.vShader);
    this.ctx.attachShader(this.#p, this.fShader);

    this.ctx.linkProgram(this.#p);

    // Check the result of linking
    var linked = this.ctx.getProgramParameter(this.#p, this.ctx.LINK_STATUS);
    if (!linked) {
      var error = this.ctx.getProgramInfoLog(this.#p);
      console.log('Failed to link program: ' + error);
      this.ctx.deleteProgram(this.#p);
      this.ctx.deleteShader(this.fShader);
      this.ctx.deleteShader(this.vShader);
    }
  }

  get program() {
    return this.#p;
  }

  /* SETTERS AND GETTERS */

  set renderType(value) {
    if([
      Program.RENDER_TRIANGLES,
      Program.RENDER_STRIP,
      Program.RENDER_LINES,
      Program.RENDER_LINELOOP,
      Program.RENDER_POINTS
    ].indexOf(value) > -1) this.#renderType = value;
  }
  get renderType() {
    return this.#renderType;
  }

  /**
   * Static Methods
   */

	/**
	 * Create a shader of a given type given a context, type and source.
	 *
   * @static
	 * @param  {WebGLContext} ctx The context under which to create the shader
	 * @param  {WebGLShaderType} type The shader type, vertex or fragment
	 * @param  {string} source The shader source.
	 * @return {WebGLShader} The created shader
	 */
  static createShaderOfType(ctx, type, source) {
    const shader = ctx.createShader(type);
    ctx.shaderSource(shader, source);
    ctx.compileShader(shader);

    // Check the compile status
    const compiled = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
    if (!compiled) {
      // Something went wrong during compilation; get the error
      const lastError = ctx.getShaderInfoLog(shader);
      console.error(`${Program.addLineNumbersWithError(source, lastError)}\nError compiling ${glEnumToString(ctx, type)}: ${lastError}`);
      ctx.deleteShader(shader);
      return null;
    }

    return shader;
  }
  static addLineNumbersWithError(src, log = '') {
    console.log(src)
    const errorRE = /ERROR:\s*\d+:(\d+)/gi;
    // Note: Error message formats are not defined by any spec so this may or may not work.
    const matches = [...log.matchAll(errorRE)];
    const lineNoToErrorMap = new Map(matches.map((m, ndx) => {
      const lineNo = parseInt(m[1]);
      const next = matches[ndx + 1];
      const end = next ? next.index : log.length;
      const msg = log.substring(m.index, end);
      return [lineNo - 1, msg];
    }));
    return src.split('\n').map((line, lineNo) => {
      const err = lineNoToErrorMap.get(lineNo);
      return `${lineNo + 1}: ${line}${err ? `\n\n^^^ ${err}` : ''}`;
    }).join('\n');
  }
}
class Uniform {
  static TYPE_INT = 0
  static TYPE_FLOAT = 1
  static TYPE_V2 = 2
  static TYPE_V3 = 3
  static TYPE_V4 = 4
  static TYPE_BOOL = 5
  static TYPE_M2 = 6
  static TYPE_M3 = 7
  static TYPE_M4 = 8

  prefix = 'u'

  constructor(ctx, name, type, value) {
    this.ctx = ctx;
    this.name = name;
    this.type = type;
    this.value = value;
  }

  prebind() {

  }

  bind(program) {
    this.prebind(program);
    const location = this.ctx.getUniformLocation(program, `${this.prefix}_${this.name}`);
    switch(this.type) {
      case Uniform.TYPE_INT :
        if(!isNaN(this.value)) this.ctx.uniform1i( location, this.value );
        break;
      case Uniform.TYPE_FLOAT :
        if(!isNaN(this.value)) this.ctx.uniform1f( location, this.value);
        break;
      case Uniform.TYPE_V2 :
        if(this.value instanceof Array && this.value.length === 2.) this.ctx.uniform2fv( location, this.value);
        break;
      case Uniform.TYPE_V3 :
        if(this.value instanceof Array && this.value.length === 3.) this.ctx.uniform3fv( location, this.value);
        break;
      case Uniform.TYPE_V4 :
        if(this.value instanceof Array && this.value.length === 4.) this.ctx.uniform4fv( location, this.value);
        break;
      case Uniform.TYPE_BOOL :
        if(!isNaN(this.value)) this.ctx.uniform1i( location, this.value);
        break;
      case Uniform.TYPE_M2 :
        if(this.value instanceof Array && this.value.length === 4.) this.ctx.uniformMatrix2fv( location, false, this.value);
      case Uniform.TYPE_M3 :
        if(this.value instanceof Array && this.value.length === 9.) this.ctx.uniformMatrix3fv( location, false, this.value);
      case Uniform.TYPE_M4 :
        if(this.value instanceof Array && this.value.length === 16.) this.ctx.uniformMatrix4fv( location, false, this.value);
        break;
    }
  }
}
class Texture extends Uniform {
  prefix = 's'
  static #defaultOptions = {
    textureType: 0,
    minFilter: window.WebGLRenderingContext.LINEAR,
    magFilter: window.WebGLRenderingContext.LINEAR,
    makePowerOf2: false,
    generateMipMap: false
  }
  static masteri = 0

  static IMAGETYPE_REGULAR = 0
  static IMAGETYPE_TILE = 1
  static IMAGETYPE_MIRROR = 2

  constructor(ctx, name, options) {
    super(ctx, name, 0, null);
    options = Object.assign({}, Texture.#defaultOptions, options);
    this.textureType = options.textureType;
    this.minFilter = options.minFilter;
    this.magFilter = options.magFilter;
    this.makePowerOf2 = options.makePowerOf2;
    this.generateMipMap = options.generateMipMap;
    this.url = options.url;
    this.data = options.data;
    this.value = Texture.masteri++;
  }
  async preload() {
    const store = {};

    const img = new Image();
    img.crossOrigin = "anonymous";

    await asyncImageLoad(img, this.url);

    if(this.makePowerOf2) this.image = pow2Image(img);
    else this.image = img;

    // this.loadTexture(gl, n, store);
    return this;
  }

  prebind(program) {
    if(!this.image) return;

    this.ctx.activeTexture(this.ctx.TEXTURE0 + this.value);

    const texture = this.ctx.createTexture(); // Create the texture object

    this.ctx.pixelStorei(this.ctx.UNPACK_FLIP_Y_WEBGL, true);
    this.ctx.bindTexture(this.ctx.TEXTURE_2D, texture);

    // Set the parameters based on the passed type
    // In WebGL images are wrapped by default, so we don't need to check for that
    if(this.textureType === Texture.IMAGETYPE_MIRROR) {
      this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_S, this.ctx.MIRRORED_REPEAT);
      this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_T, this.ctx.MIRRORED_REPEAT);
    } else if(this.textureType === Texture.IMAGETYPE_REGULAR) {
      this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_S, this.ctx.CLAMP_TO_EDGE);
      this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_T, this.ctx.CLAMP_TO_EDGE);
    }

    this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MIN_FILTER, this.minFilter);
    this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MAG_FILTER, this.magFilter);

    // Upload the image into the texture.
    if(this.data) {
      this.ctx.texImage2D(this.ctx.TEXTURE_2D, 0, this.ctx.RGBA, this.ctx.RGBA, this.ctx.UNSIGNED_BYTE, this.data);
    } else {
      this.ctx.texImage2D(this.ctx.TEXTURE_2D, 0, this.ctx.RGBA, this.ctx.RGBA, this.ctx.UNSIGNED_BYTE, this.image);
    }

    if(this.generateMipMap) this.ctx.generateMipmap(this.ctx.TEXTURE_2D);
  }
}
class FrameBuffer {
  static #defaultOptions = {
    width: 512,
    height: 512,
    pxRatio: Math.min(window.devicePixelRatio, 2),
    tiling: Texture.IMAGETYPE_REGULAR,
    texdepth: FrameBuffer.TEXTYPE_HALF_FLOAT_OES,
    data: null,
    depthTesting: false
  }
  static TEXTYPE_FLOAT = 0
  static TEXTYPE_UNSIGNED_BYTE = 1
  static TEXTYPE_HALF_FLOAT_OES = 2

  #fb1
  #fb2
  #activeFB
  #name
  #width
  #height
  #pxRatio
  #tiling = Texture.IMAGETYPE_REGULAR
  #texdepth = FrameBuffer.TEXTYPE_HALF_FLOAT_OES
  #data;

  constructor(renderer, name, options) {
    options = Object.assign({}, FrameBuffer.#defaultOptions, options);

    this.width = options.width;
    this.height = options.height;
    this.pxRatio = options.pxRatio;
    this.tiling = options.tiling;
    this.texdepth = options.texdepth;
    this.depthTesting = options.depthTesting;

    this.#name = name;
    this.value = Texture.masteri++;

    this.ctx = renderer.ctx;
    this.renderer = renderer;

    this.data = options.data;

    this.#fb1 = this.createFrameBuffer();
    this.#fb2 = this.createFrameBuffer();
    this.#activeFB = this.#fb1;
  }
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.#fb1 = this.createFrameBuffer();
    this.#fb2 = this.createFrameBuffer();
    this.#activeFB = this.#fb1;
  }
  createFrameBuffer() {
    const targetTexture = this.ctx.createTexture();
    this.ctx.bindTexture(this.ctx.TEXTURE_2D, targetTexture);
    {
      // define size and format of level 0
      const level = 0;
      let internalFormat = this.ctx.RGBA;
      const border = 0;
      let format = this.ctx.RGBA;
      let t;
      if(this.texdepth === FrameBuffer.TEXTYPE_FLOAT) {
        const e = this.ctx.getExtension('OES_texture_float');
        t = this.ctx.FLOAT;
        // internalFormat = this.ctx.FLOAT;
        // format = this.ctx.FLOAT;
      } else if(this.texdepth & FrameBuffer.TEXTYPE_HALF_FLOAT_OES) {
        // t = gl.renderer.isWebgl2 ? e.HALF_FLOAT : e.HALF_FLOAT_OES;
        //     gl.renderer.extensions['OES_texture_half_float'] ? gl.renderer.extensions['OES_texture_half_float'].HALF_FLOAT_OES :
        //     gl.UNSIGNED_BYTE;
        const e = this.ctx.getExtension('OES_texture_half_float');
        t = this.renderer.isWebgl2 ? this.ctx.HALF_FLOAT : e.HALF_FLOAT_OES;
        // format = gl.RGBA;
        if(this.renderer.isWebgl2) {
          internalFormat = this.ctx.RGBA16F;
        }
        // internalFormat = gl.RGB32F;
        // format = gl.RGB32F;
        // window.gl = gl
        // t = e.HALF_FLOAT_OES;
      } else {
        t = this.ctx.UNSIGNED_BYTE;
      }
      const type = t;
      const data = this.data;
      this.ctx.texImage2D(this.ctx.TEXTURE_2D, level, internalFormat,
                    this.width*this.pxRatio, this.height*this.pxRatio, border,
                    format, type, data);
      // gl.generateMipmap(gl.TEXTURE_2D);

      // set the filtering so we don't need mips
      this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MIN_FILTER, this.ctx.NEAREST);
      this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MAG_FILTER, this.ctx.NEAREST);

      // Set the parameters based on the passed type
      if(this.tiling === Texture.IMAGETYPE_TILE) {
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_S, this.ctx.REPEAT);
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_T, this.ctx.REPEAT);
      } else if(this.tiling === Texture.IMAGETYPE_MIRROR) {
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_S, this.ctx.MIRRORED_REPEAT);
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_T, this.ctx.MIRRORED_REPEAT);
      } else if(this.tiling === Texture.IMAGETYPE_REGULAR) {
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_S, this.ctx.CLAMP_TO_EDGE);
        this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_T, this.ctx.CLAMP_TO_EDGE);
      }
    }

    // Create and bind the framebuffer
    const fb = this.ctx.createFramebuffer();
    this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, fb);

    if(this.depthTesting) {
      var ext = this.ctx.getExtension('WEBGL_depth_texture');
      let depth = this.ctx.createTexture();
      this.ctx.bindTexture(this.ctx.TEXTURE_2D, depth);
      this.ctx.texImage2D(
        this.ctx.TEXTURE_2D, 0, this.ctx.DEPTH_COMPONENT, this.width*this.pxRatio, this.height*this.pxRatio, 0, this.ctx.DEPTH_COMPONENT, this.ctx.UNSIGNED_SHORT, null);
      this.ctx.framebufferTexture2D(this.ctx.FRAMEBUFFER, this.ctx.DEPTH_ATTACHMENT, this.ctx.TEXTURE_2D, depth, 0);
    }

    // attach the texture as the first color attachment
    const attachmentPoint = this.ctx.COLOR_ATTACHMENT0;
    const level = 0;
    this.ctx.framebufferTexture2D(
      this.ctx.FRAMEBUFFER,
      attachmentPoint,
      this.ctx.TEXTURE_2D,
      targetTexture,
      level);

    return {
      fb: fb,
      frameTexture: targetTexture
    };
  }
  bind() {
    // find the active texture based on the index
    let uniform = this.ctx.getUniformLocation(this.renderer.currentProgram.program, `b_${this.#name}`);

    // Set the texture unit to the uniform
    this.ctx.uniform1i(uniform, this.value);
    this.ctx.activeTexture(this.ctx.TEXTURE0 + this.value);
    // Bind the texture
    this.ctx.bindTexture(this.ctx.TEXTURE_2D, this.#activeFB.frameTexture);
  }
  render(n) {
    this.bind();

    // Finally, ping-pong the texture
    this.#activeFB = this.#activeFB === this.#fb1 ? this.#fb2 : this.#fb1;

    // this.renderer.render(n, this.#activeFB);
    this.renderer.render(n, this.#activeFB, [this.width, this.height]);
  }

  set data(value) {
    if(value instanceof Float32Array) this.#data = value;
  }
  get data() {
    return this.#data || null;
  }
  set width(value) {
    if(value > 0) this.#width = value;
  }
  get width() {
    return this.#width || 1;
  }
  set height(value) {
    if(value > 0) this.#height = value;
  }
  get height() {
    return this.#height || 1;
  }
  set pxRatio(value) {
    if(value > 0) this.#pxRatio = value;
  }
  get pxRatio() {
    return this.#pxRatio || 1;
  }
  set tiling(value) {
    if([Texture.IMAGETYPE_REGULAR, Texture.IMAGETYPE_TILE, Texture.IMAGETYPE_MIRROR].indexOf(value) > -1) this.#tiling = value;
  }
  get tiling() {
    return this.#tiling;
  }
  set texdepth(value) {
    if([FrameBuffer.TEXTYPE_FLOAT, FrameBuffer.TEXTYPE_UNSIGNED_BYTE, FrameBuffer.TEXTYPE_HALF_FLOAT_OES].indexOf(value) > -1) this.#texdepth = value;
  }
  get texdepth() {
    return this.#texdepth;
  }
}
class Camera {
  static #defaultOptions = {
    fov: 30 * Math.PI / 180,
    aspect: window.innerWidth / window.innerHeight,
    near: .5,
    far: 100,
    pos: new Vec3(3, 1, -5),
    target: new Vec3(0, 0, 0),
    up: new Vec3(0, 1, 0)
  }

  #fov
  #aspect
  #near
  #far
  #pos
  #target
  #up
  #updateDebounce

  #model
  #view
  #proj
  #MVP

  #u_model
  #u_view
  #u_proj
  #u_MVP

  #q

  #name

  constructor(renderer, name, options) {
    options = Object.assign({}, Camera.#defaultOptions, options);

    this.renderer = renderer;
    this.ctx = renderer.ctx;

    this.fov = options.fov;
    this.aspect = options.aspect;
    this.near = options.near;
    this.far = options.far;
    this.pos = options.pos;
    this.target = options.target;
    this.up = options.up;

    this.q = new Quat();

    this.name = name;

    this.update(true);
  }
  set q(value) {
    if(value instanceof Quat) {
      this.#q = value;
      this.#model = quatToMat4(this.#q);
      this.#u_model = new Uniform(this.ctx, 'm_model', Uniform.TYPE_M4, this.#model.array);
    }
  }
  get q() {
    return this.#q || new Quat();
  }
  update(nt = false) {
    clearTimeout(this.#updateDebounce);
    // this.#updateDebounce = setTimeout(() => {
      this.#model = new Mat4();
      this.#view = Mat4.lookAt(this.pos, this.target, this.up);
      this.#proj = Mat4.perspective(this.fov, this.aspect, this.near, this.far);
      this.#MVP = this.#proj.multiplyNew(this.#view).multiply(this.#model);

      this.#u_view = new Uniform(this.ctx, 'm_view', Uniform.TYPE_M4, this.#view.array);
      this.#u_proj = new Uniform(this.ctx, 'm_proj', Uniform.TYPE_M4, this.#proj.array);
      this.#u_MVP = new Uniform(this.ctx, 'm_MVP', Uniform.TYPE_M4, this.#MVP.array);

      this.setup = true;
    // }, nt ? 0 : 50);
  }

  set name(value) {
    if(typeof value === 'string') this.#name = value;
  }
  get name() {
    return this.#name || 'camera';
  }
  set fov(value) {
    if(!isNaN(value)) this.#fov = value;
  }
  get fov() {
    return this.#fov;
  }
  set aspect(value) {
    if(!isNaN(value)) this.#aspect = value;
  }
  get aspect() {
    return this.#aspect;
  }
  set near(value) {
    if(!isNaN(value)) this.#near = value;
  }
  get near() {
    return this.#near;
  }
  set far(value) {
    if(!isNaN(value)) this.#far = value;
  }
  get far() {
    return this.#far;
  }
  set pos(value) {
    if(value instanceof Vec3) this.#pos = value;
  }
  get pos() {
    return this.#pos;
  }
  set target(value) {
    if(value instanceof Vec3) this.#target = value;
  }
  get target() {
    return this.#target;
  }
  set up(value) {
    if(value instanceof Vec3) this.#up = value;
  }
  get up() {
    return this.#up;
  }
  get u_model() {
    return this.#u_model;
  }
  get u_view() {
    return this.#u_view;
  }
  get u_proj() {
    return this.#u_proj;
  }
  get u_MVP() {
    return this.#u_MVP;
  }
  get uniforms() {
    return [this.u_model, this.u_view, this.u_proj, this.u_MVP];
  }
}

setup();
