import {
  selectAppData,
  selectIsSomeoneScreenSharing
} from '@100mslive/react-sdk';
//@ts-expect-error AR.js doesn't have type definitions
import * as THREEx from '@ar-js-org/ar.js/three.js/build/ar-threex.js';
import { Signal } from '@lumino/signaling';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { hmsActions, hmsStore } from './hms';
import { IModelRegistryData } from './registry';

const FIRST_SCENE = 0;
const SECOND_SCENE = 1;

export interface IScaleSignal {
  sceneNumber: number;
  scale: number;
}

type Dict<T> = { [keys: string]: T };

class ArCube {
  sceneGroup2: THREE.Group<THREE.Object3DEventMap>;
  gltfModel2: THREE.Group<THREE.Object3DEventMap>;
  /**
   * Construct a new JupyterLab-Gather widget.
   */
  constructor() {
    this.secondSceneSignal = new Signal(this);
    this.scaleSignal = new Signal(this);
    this.bgCubeCenter = new THREE.Vector3();
    this.initialize();

    // this.animate();
    // window.addEventListener('markerFound', () => {
    //   console.log('Marker found');
    // });

    // window.addEventListener('markerLost', () => {
    //   console.log('Marker lost');
    // });
  }

  modelInScene: string[];
  scenesWithModel: Dict<number[]>;
  clock: THREE.Clock;
  scene: THREE.Scene;
  camera: THREE.Camera;
  arToolkitSource: any;
  arToolkitContext: any;
  markerRootArray: THREE.Group[];
  markerGroupArray: THREE.Group[];
  hiroRootArray: THREE.Group[];
  hiroGroupArray: THREE.Group[];
  patternArray: string[];
  patternArraySecondModel: string[];
  gltfLoader: GLTFLoader;
  animations: THREE.AnimationClip[] | undefined;
  mixer: THREE.AnimationMixer;
  renderer: THREE.WebGLRenderer;
  mixerUpdateDelta: number;
  webcam_loaded: Promise<void>;
  resolve: any;
  deltaTime: number;
  totalTime: number;
  okToLoadModel: boolean;
  renderTarget: THREE.WebGLRenderTarget;
  sceneGroups: THREE.Group[];
  isSecondScene: boolean;
  bgCubeBoundingBox: THREE.Box3;
  readonly existingWebcam: HTMLVideoElement | null;
  readonly newWebcam: HTMLVideoElement | undefined;
  readonly secondSceneSignal: Signal<this, boolean>;
  readonly scaleSignal: Signal<this, IScaleSignal>;
  bgCubeCenter: THREE.Vector3;
  arjsVid: HTMLElement | null;
  // sceneGroup: THREE.Group;
  // sceneGroupArray: THREE.Group[];
  // edgeGroup: THREE.Group;
  // gltfModel: THREE.Group;
  // observer: IntersectionObserver;
  // readonly markerControls: any;
  // readonly ambientLight: THREE.AmbientLight;
  // readonly rotationArray: THREE.Vector3[];
  // readonly markerRoot: THREE.Group;
  // readonly markerGroup: THREE.Group;
  // readonly pointLight: THREE.PointLight;
  // readonly loader: THREE.TextureLoader;
  // readonly stageMesh: THREE.MeshBasicMaterial;
  // readonly stage: THREE.Mesh;
  // readonly edgeGeometry: THREE.CylinderGeometry;
  // readonly edgeCenters: THREE.Vector3[];
  // readonly edgeRotations: THREE.Vector3[];
  // readonly animationRequestId: number | undefined;
  // readonly now: number;
  // readonly then: number;
  // readonly elapsed: number;
  // readonly fpsInterval: number;
  // readonly webcamFromArjs: HTMLElement | null;
  // model: IModelRegistryData;

  initialize() {
    this.sceneGroups = [];
    this.modelInScene = new Array(2);
    this.scenesWithModel = {};
    hmsStore.subscribe(
      this.setupSource.bind(this),
      selectAppData('videoDeviceId')
    );

    this.setupThreeStuff();

    this.setupSource();

    this.setupContext();

    this.setupMarkerRoots();

    this.setupScene(FIRST_SCENE);
  }

  setupThreeStuff() {
    console.log('setting up three stuff');

    this.okToLoadModel = true;
    this.scene = new THREE.Scene();

    // promise to track if AR.js has loaded the webcam
    this.webcam_loaded = new Promise(resolve => {
      this.resolve = resolve;
    });

    window.addEventListener('arjs-video-loaded', (e: any) => {
      e.detail.component.style.display = 'none';
      this.resolve();
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    this.camera = new THREE.Camera();
    this.scene.add(this.camera);

    // Camera lights
    const camLight = new THREE.DirectionalLight(0xffffff, 1);
    camLight.position.set(-1, 2, 4);
    this.camera.add(camLight);

    // const canvas = document.getElementById('target') as HTMLCanvasElement;

    // const offscreen = canvas?.transferControlToOffscreen();
    // if (!canvas?.transferControlToOffscreen) {
    //   console.log('no support');
    // }

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      // canvas: canvas,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    });

    this.renderer.setClearColor(new THREE.Color('lightgrey'), 0);

    //Not render target things
    const isScreenShareOn = hmsStore.getState(selectIsSomeoneScreenSharing);

    if (isScreenShareOn) {
      console.log('iffing');
      const container = document.getElementById('screen-share-container');
      container?.appendChild(this.renderer.domElement);
    } else {
      // Renderer target things
      console.log('elsing');
      this.renderTarget = new THREE.WebGLRenderTarget();
      this.renderTarget.setSize(1280, 720);
      this.renderer.setRenderTarget(this.renderTarget);
    }

    // this.renderer.setSize(1280, 720, false);
    // this.renderer.domElement.style.position = 'absolute';

    // this.renderer.domElement.style.top = '0px';
    // this.renderer.domElement.style.left = '0px';

    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.totalTime = 0;

    hmsActions.setAppData('renderer', this.renderer);
  }

  setupSource() {
    console.log('setting up source');
    const deviceId = hmsStore.getState(selectAppData('videoDeviceId'));

    this.arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: 'webcam',
      deviceId
    });

    this.arjsVid = document.getElementById('arjs-video');

    if (this.arjsVid) {
      this.arjsVid.remove();
    }

    this.arToolkitSource.init();
  }

  getThemeColor() {
    const layoutColor = getComputedStyle(document.body);
    const cubeColorValue = layoutColor.getPropertyValue('--jp-layout-color0');

    return cubeColorValue;
  }

  // updateSource() {
  //   const deviceId = hmsStore.getState(selectAppData('videoDeviceId'));

  //   this.arToolkitSource = new THREEx.ArToolkitSource({
  //     sourceType: 'webcam',
  //     deviceId
  //   });

  //   this.arjsVid = document.getElementById('arjs-video');

  //   if (this.arjsVid) {
  //     this.arjsVid.remove();
  //   }
  //   this.arToolkitSource.init();
  // }

  setupContext() {
    console.log('setting up context');

    // create atToolkitContext
    this.arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl:
        THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
      detectionMode: 'mono'
    });

    // copy projection matrix to camera when initialization complete
    this.arToolkitContext.init(() => {
      this.camera.projectionMatrix.copy(
        this.arToolkitContext.getProjectionMatrix()
      );
    });
  }

  setupMarkerRoots() {
    console.log('setting up marker roots');

    this.markerRootArray = [];
    this.markerGroupArray = [];

    this.hiroRootArray = [];
    this.hiroGroupArray = [];

    this.patternArray = [
      'letterA',
      'letterB',
      'letterC',
      'letterD',
      'letterF',
      'kanji'
    ];

    this.patternArraySecondModel = [
      'letterJ',
      'letterK',
      'letterL',
      'letterM',
      'letterN',
      'letterP'
    ];

    const rotationArray = [
      new THREE.Vector3(-Math.PI / 2, 0),
      new THREE.Vector3(0, -Math.PI / 2, Math.PI / 2),
      new THREE.Vector3(Math.PI / 2, 0, Math.PI),
      new THREE.Vector3(-Math.PI / 2, Math.PI / 2, 0),
      new THREE.Vector3(Math.PI, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ];

    for (let i = 0; i < 6; i++) {
      const markerRoot = new THREE.Group();
      this.markerRootArray.push(markerRoot);
      this.scene.add(markerRoot);
      new THREEx.ArMarkerControls(this.arToolkitContext, markerRoot, {
        type: 'pattern',
        patternUrl:
          THREEx.ArToolkitContext.baseURL +
          'examples/marker-training/examples/pattern-files/pattern-' +
          this.patternArray[i] +
          '.patt'
      });

      const markerGroup = new THREE.Group();
      this.markerGroupArray.push(markerGroup);
      markerGroup.position.y = -1.25 / 2;
      markerGroup.rotation.setFromVector3(rotationArray[i]);

      markerRoot.add(markerGroup);
    }

    for (let i = 0; i < 6; i++) {
      const hiroRoot = new THREE.Group();
      this.hiroRootArray.push(hiroRoot);
      this.scene.add(hiroRoot);
      new THREEx.ArMarkerControls(this.arToolkitContext, hiroRoot, {
        type: 'pattern',
        patternUrl:
          'https://raw.githubusercontent.com/QuantStack/jupyterlab-gather/main/pattern-files/pattern-' +
          this.patternArraySecondModel[i] +
          '.patt'
      });

      const hiroGroup = new THREE.Group();
      this.hiroGroupArray.push(hiroGroup);
      hiroGroup.position.y = -1.25 / 2;
      hiroGroup.rotation.setFromVector3(rotationArray[i]);

      hiroRoot.add(hiroGroup);
    }
  }

  setupScene(sceneNumber: number) {
    console.log('setting up scene');
    const sceneGroup = new THREE.Group();
    // a 1x1x1 cube model with scale factor 1.25 fills up the physical cube
    sceneGroup.scale.set(1.75 / 2, 1.75 / 2, 1.75 / 2);
    sceneGroup.name = `scene${sceneNumber}`;

    const cubeColor = this.getThemeColor();

    // reversed cube
    //TODO: Can probably just have one cube and add it to scenes as needed

    const bgCube = new THREE.Mesh(
      new RoundedBoxGeometry(2, 2, 2, 7, 0.1),
      new THREE.MeshBasicMaterial({
        color: cubeColor,
        side: THREE.BackSide
      })
    );

    sceneGroup.add(bgCube);

    this.sceneGroups.push(sceneGroup);

    // Set up BG cubes bounding box and center
    if (!this.bgCubeBoundingBox) {
      this.bgCubeBoundingBox = new THREE.Box3().setFromObject(bgCube);
      this.bgCubeBoundingBox.getCenter(this.bgCubeCenter);
    }

    this.loadModel(sceneNumber);
    console.log('fin');
  }

  loadModel(sceneNumber: number, modelName?: string) {
    console.log('loading model', sceneNumber, modelName);
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
    }

    const modelNameOrDuck = modelName ? modelName : 'duck';
    const model = this.findModelByName(modelNameOrDuck);
    console.log('model', model);

    // remove old model first
    // if (this.gltfModel) {
    //   this.removeFromScene(sceneNumber, this.gltfModel);
    // }

    // load model
    this.okToLoadModel = false;
    hmsActions.setAppData('canLoadModel', false);

    if ('url' in model) {
      this.gltfLoader.load(
        model.url,
        gltf => {
          this.onSuccessfulLoad(gltf, sceneNumber, modelNameOrDuck);
        },
        () => {
          console.log('model loading');
        },
        error => {
          console.log('Error loading model url', error);
        }
      );
    } else if ('gltf' in model) {
      // const data = JSON.stringify(model.gltf);
      const data = model.gltf;
      this.gltfLoader.parse(
        data,
        '',
        gltf => {
          this.onSuccessfulLoad(gltf, sceneNumber, modelNameOrDuck);
        },
        error => {
          console.log('Error loading model gltf', error);
        }
      );
    }
  }

  onSuccessfulLoad = (gltf: GLTF, sceneNumber: number, modelName: string) => {
    console.log('on successful load', gltf, modelName);

    const gltfModel = gltf.scene;
    gltfModel.name = `model${sceneNumber}`;

    //  filter out plane mesh
    gltfModel.children.forEach(objectGroup => {
      const filterOutPlanes = objectGroup.children.filter(
        obj => !obj.name.startsWith('edge-')
      );
      objectGroup.children = filterOutPlanes;
    });

    // handle animations
    this.animations = gltf.animations;
    this.mixer = new THREE.AnimationMixer(gltfModel);

    if (this.animations) {
      this.animations.forEach(clip => {
        this.mixer.clipAction(clip).play();
      });
    }

    // Set scale of new model to fit inside the BG Cube
    const initialModelBoundingBox = new THREE.Box3().setFromObject(gltfModel);
    const minRatio = this.calcScale(
      this.bgCubeBoundingBox,
      initialModelBoundingBox
    );
    gltfModel.scale.set(minRatio, minRatio, minRatio);

    // Get new bounding box from scaled model and center the model in the BG Cube
    const scaledModelBoundingBox = new THREE.Box3().setFromObject(gltfModel);
    const modelCenter = new THREE.Vector3();
    scaledModelBoundingBox.getCenter(modelCenter);
    gltfModel.position.set(-modelCenter.x, -modelCenter.y, -modelCenter.z);

    // add model to scene
    this.sceneGroups[sceneNumber].add(gltfModel);
    this.okToLoadModel = true;

    // Track which scenes a model is loaded in
    // This is mostly to reflect changes to a model in JupyterCAD if it's loaded
    // in multiple scenes
    const updatedScenesWithModel = { ...this.scenesWithModel };

    if (!(modelName in updatedScenesWithModel)) {
      updatedScenesWithModel[modelName] = [];
    }

    updatedScenesWithModel[modelName] = [
      ...updatedScenesWithModel[modelName],
      sceneNumber
    ];

    this.scenesWithModel = updatedScenesWithModel;

    // Track which model is loaded in which scene
    // This is to get model names on the scale sliders
    this.modelInScene[sceneNumber] = modelName;

    // update app data state
    hmsActions.setAppData('loadedModels', updatedScenesWithModel);
    hmsActions.setAppData('canLoadModel', true);

    // Send scale value to right sidebar
    this.scaleSignal.emit({ sceneNumber, scale: minRatio });

    console.log('model loaded parse');
  };

  calcScale(bgCubeBoundingBox: THREE.Box3, modelBoundingBox: THREE.Box3) {
    // Calculate side lengths of model1
    const bgCubeBounds = {
      x: Math.abs(bgCubeBoundingBox.max.x - bgCubeBoundingBox.min.x),
      y: Math.abs(bgCubeBoundingBox.max.y - bgCubeBoundingBox.min.y),
      z: Math.abs(bgCubeBoundingBox.max.z - bgCubeBoundingBox.min.z)
    };

    // Calculate side lengths of model2
    const modelBounds = {
      x: Math.abs(modelBoundingBox.max.x - modelBoundingBox.min.x),
      y: Math.abs(modelBoundingBox.max.y - modelBoundingBox.min.y),
      z: Math.abs(modelBoundingBox.max.z - modelBoundingBox.min.z)
    };

    // Calculate length ratios
    const lengthRatios = [
      bgCubeBounds.x / modelBounds.x,
      bgCubeBounds.y / modelBounds.y,
      bgCubeBounds.z / modelBounds.z
    ];

    // Select smallest ratio in order to contain the models within the scene
    const minRatio = Math.min(...lengthRatios);

    return minRatio;
  }

  findModelByName(name: string) {
    const modelRegistry = hmsStore.getState(selectAppData('modelRegistry'));
    return modelRegistry.find(
      (model: IModelRegistryData) => model.name === name
    );
  }

  changeModelInScene(sceneNumber: number, modelName: string) {
    const sceneGroup = this.sceneGroups[sceneNumber];
    const modelToRemove = sceneGroup.getObjectByName(`model${sceneNumber}`);

    if (modelToRemove) {
      sceneGroup.remove(modelToRemove);
    }

    this.loadModel(sceneNumber, modelName);
  }

  removeFromScene(sceneNumber: number, object3d: THREE.Object3D) {
    this.sceneGroups[sceneNumber].remove(object3d);
  }

  enableSecondScene() {
    console.log('enabling second');
    this.isSecondScene = true;
    this.setupScene(SECOND_SCENE);
    this.secondSceneSignal.emit(true);
  }

  disableSecondScene() {
    console.log('disabling second');
    this.isSecondScene = false;
    //TODO this won't work with more than two scenes but it's fine for now
    this.sceneGroups.pop();

    this.hiroGroupArray.forEach(group => {
      if (group.children.length > 0) {
        group.remove(group.children[0]);
      }
    });

    this.secondSceneSignal.emit(false);
  }

  resizeCanvasToDisplaySize() {
    const canvas = this.renderer.domElement;
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    // console.log('canvas.width in resize', canvas.width);
    // console.log('width in resize', width);
    // adjust displayBuffer size to match
    if (canvas.width !== width || canvas.height !== height) {
      // you must pass false here or three.js sadly fights the browser
      this.renderer.setSize(width, height, false);
      // this.camera.aspect = width / height;
      // this.camera.updateProjectionMatrix();

      // update any render target sizes here
    }
  }

  setScale(scale: number, sceneNumber: number) {
    this.sceneGroups[sceneNumber]
      .getObjectByName(`model${sceneNumber}`)
      ?.scale.set(scale, scale, scale);
  }

  render() {
    // this.renderer.setRenderTarget(this.renderTarget);
    // this.renderer.render(this.scene, this.camera);
    // this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));

    this.deltaTime = this.clock.getDelta();
    this.totalTime += this.deltaTime;

    this.update();

    if (this.mixer) {
      this.mixerUpdateDelta = this.clock.getDelta();
      this.mixer.update(this.mixerUpdateDelta);
    }

    this.render();
  }

  update() {
    // update artoolkit on every frame
    if (this.arToolkitSource.ready !== false) {
      this.arToolkitContext.update(this.arToolkitSource.domElement);
    }

    // console.log('root array', this.markerRootArray);

    for (let i = 0; i < 6; i++) {
      if (this.markerRootArray[i].visible) {
        //TODO want to iterate through new scene group list
        this.markerGroupArray[i].add(this.sceneGroups[0]);
        // console.log('visible: ' + this.patternArray[i]);
        break;
      }
    }

    if (this.isSecondScene) {
      for (let i = 0; i < 6; i++) {
        if (this.hiroRootArray[i].visible) {
          //TODO want to iterate through new scene group list
          //TODO need to remove this on second disable
          this.hiroGroupArray[i].add(this.sceneGroups[1]);
          // console.log('visible: ' + this.patternArraySecondModel[i - 6]);
          break;
        }
      }
    }
  }
}

export default ArCube;
