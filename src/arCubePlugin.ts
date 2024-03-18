import {
  HMSPluginSupportResult,
  HMSVideoPlugin,
  HMSVideoPluginCanvasContextType,
  HMSVideoPluginType,
  selectAppData
} from '@100mslive/hms-video-store';
import * as THREE from 'three';
import ArCube from './arCube';
import { hmsStore } from './hms';

class ArCubePlugin implements HMSVideoPlugin {
  input: HTMLCanvasElement | null;
  output: HTMLCanvasElement | null;
  // arCube: ArCube;
  node: HTMLElement;
  renderer: THREE.WebGLRenderer;
  arCube: ArCube;
  //   outputCtx: CanvasRenderingContext2D | null;

  constructor() {
    // this.outputCtx = null;
    console.log('plugin constructor');
    this.input = null;
    this.output = null;
  }

  blendImages(imageDataBottom: ImageData, imageDataTop: ImageData) {
    console.log('imageDataBottom', imageDataBottom);
    console.log('imageDataTop', imageDataTop);

    // Ensure the dimensions of both ImageData objects are the same
    if (
      imageDataBottom.width !== imageDataTop.width ||
      imageDataBottom.height !== imageDataTop.height
    ) {
      throw new Error('ImageData dimensions must match');
    }

    // Create a new ImageData object for the blended image
    const blendedImageData = new ImageData(
      imageDataBottom.width,
      imageDataBottom.height
    );

    // Blend pixel data from both ImageData objects
    for (let i = 0; i < blendedImageData.data.length; i += 4) {
      // Combine pixel values from both images using alpha blending
      const alphaTop = imageDataTop.data[i + 3] / 255; // Alpha value of the top image
      const alphaBottom = 1 - alphaTop; // Alpha value of the bottom image

      // Blend RGB channels
      blendedImageData.data[i] =
        imageDataBottom.data[i] * alphaBottom + imageDataTop.data[i] * alphaTop;
      blendedImageData.data[i + 1] =
        imageDataBottom.data[i + 1] * alphaBottom +
        imageDataTop.data[i + 1] * alphaTop;
      blendedImageData.data[i + 2] =
        imageDataBottom.data[i + 2] * alphaBottom +
        imageDataTop.data[i + 2] * alphaTop;

      // Preserve alpha channel
      blendedImageData.data[i + 3] = 255; // Fully opaque
    }

    return blendedImageData;
  }

  flipImageDataVertically(imageData: ImageData) {
    const width = imageData.width;
    const height = imageData.height;
    const flippedData = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceIndex = (y * width + x) * 4;
        const destIndex = ((height - y - 1) * width + x) * 4;

        flippedData[destIndex] = imageData.data[sourceIndex];
        flippedData[destIndex + 1] = imageData.data[sourceIndex + 1];
        flippedData[destIndex + 2] = imageData.data[sourceIndex + 2];
        flippedData[destIndex + 3] = imageData.data[sourceIndex + 3];
      }
    }

    return new ImageData(flippedData, width, height);
  }

  /**
   * @param input {HTMLCanvasElement}
   * @param output {HTMLCanvasElement}
   */
  processVideoFrame(input: HTMLCanvasElement, output: HTMLCanvasElement) {
    // console.log('input', input);
    // console.log('output', output);
    if (!input || !output) {
      throw new Error('Plugin invalid input/output');
    }

    this.input = input;
    this.output = output;
    // let imgData: any;
    // we don't want to change the dimensions so set the same width, height
    const width = input.width;
    const height = input.height;
    output.width = width;
    output.height = height;

    const threeJsContext = this.arCube.renderer.getContext();
    // threeJsContext?.clear(threeJsContext.COLOR_BUFFER_BIT);

    const inputCtx = input.getContext('2d');
    const inputImgData = inputCtx?.getImageData(0, 0, width, height);

    const pixels = new Uint8Array(width * height * 4);
    // const pixels2 = new Uint8Array(width * height * 4);

    // console.log('threeJsContext', threeJsContext);
    // this.arCube.renderer.readRenderTargetPixels(
    //   this.arCube.renderTarget,
    //   0,
    //   0,
    //   width,
    //   height,
    //   pixels2
    // );

    threeJsContext?.readPixels(
      0,
      0,
      width,
      height,
      threeJsContext.RGBA,
      threeJsContext.UNSIGNED_BYTE,
      pixels
    );

    const threeImageData = new ImageData(
      new Uint8ClampedArray(pixels),
      width,
      height
    );

    // console.log('threeImageData', threeImageData);
    const outputCtx = output.getContext('2d');

    if (!inputImgData) {
      console.log('fucked');
    }
    const flippedImage = this.flipImageDataVertically(threeImageData);
    const blendedData = this.blendImages(inputImgData!, flippedImage);
    outputCtx?.putImageData(blendedData, 0, 0);
  }

  getName() {
    return 'arcube-plugin';
  }

  /**
   * @deprecated
   */
  isSupported(): boolean {
    return true;
  }

  checkSupport() {
    // we're not doing anything complicated, it's supported on all browsers
    const browserResult = {} as HMSPluginSupportResult;
    browserResult.isSupported = true;
    return browserResult;
  }

  async init() {
    this.node = hmsStore.getState(selectAppData('node'));
    // this.renderer = hmsStore.getState(selectAppData('renderer'));
    // console.log('this.renderer', this.renderer);
    console.log('plugin node', this.node);
    this.arCube = new ArCube(this.node);
    this.arCube.animate();
  } // placeholder, nothing to init

  getPluginType() {
    return HMSVideoPluginType.TRANSFORM; // because we transform the image
  }

  getContextType() {
    return HMSVideoPluginCanvasContextType['2D'];
  }

  stop() {} // placeholder, nothing to stop
}

export default ArCubePlugin;
