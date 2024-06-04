import { selectAppData } from '@100mslive/react-sdk';
import { ReactWidget } from '@jupyterlab/apputils';
import { SidePanel } from '@jupyterlab/ui-components';
import { Panel, Widget } from '@lumino/widgets';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import React, { useEffect, useState } from 'react';
import ArCube, { IScaleSignal } from '../arCube';
import { arIcon } from '../components/Icons';
import { hmsStore } from '../hms';

const FIRST_SCENE = 0;
const SECOND_SCENE = 1;
const SCALE_FACTOR = 4.0;

interface IScaleSliderProps {
  sceneNumber: number;
  initialScale: number;
  arCube: ArCube | undefined;
}

const ScaleSlider = ({
  sceneNumber,
  initialScale,
  arCube
}: IScaleSliderProps) => {
  const [sliderValue, setSliderValue] = useState(initialScale);

  const handleChange = (value: number, sceneNumber: number) => {
    if (!arCube) {
      return;
    }
    arCube.setScale(value, sceneNumber);
    setSliderValue(value);
  };

  return (
    <div className="jlab-gather-scale-slider">
      <p style={{ textTransform: 'capitalize' }}>
        {arCube?.modelInScene[sceneNumber]}
      </p>
      <Slider
        className="slider"
        min={initialScale / SCALE_FACTOR}
        max={initialScale * SCALE_FACTOR}
        defaultValue={initialScale}
        value={sliderValue}
        step={0.001}
        onChange={value => handleChange(value as number, sceneNumber)}
      />
    </div>
  );
};

const RightSidebarComponent = () => {
  const [arCube, setArCube] = useState<ArCube | undefined>(undefined);
  const [isSecondModel, setIsSecondModel] = useState(false);
  const [firstScale, setFirstScale] = useState(1);
  const [secondScale, setSecondScale] = useState(1);

  useEffect(() => {
    setArCube(hmsStore.getState(selectAppData('arCube')));
    hmsStore.subscribe(updateArCube, selectAppData('arCube'));
  }, []);

  const updateArCube = () => {
    const updatedCube = hmsStore.getState(selectAppData('arCube'));

    if (updatedCube) {
      updatedCube.secondSceneSignal.connect(updateIsSecondModel);
      updatedCube.scaleSignal.connect(updateScaleValue);
      setArCube(updatedCube);
    }
  };

  // This scale is just to adjust the slider position when a new model is loaded
  const updateScaleValue = (sender: ArCube, value: IScaleSignal) => {
    value.sceneNumber === 0
      ? setFirstScale(value.scale)
      : setSecondScale(value.scale);
  };

  const updateIsSecondModel = (sender: ArCube, value: boolean) => {
    setIsSecondModel(value);
  };

  return (
    <div className="jlab-gather-sidebar-container">
      <div className="jlab-gather-sidebar-description">Set Scale</div>
      <div className="jlab-gather-sidebar-list jlab-gather-sidebar-right">
        <ScaleSlider
          sceneNumber={FIRST_SCENE}
          initialScale={firstScale}
          arCube={arCube}
        />
        {isSecondModel ? (
          <ScaleSlider
            sceneNumber={SECOND_SCENE}
            initialScale={secondScale}
            arCube={arCube}
          />
        ) : null}
      </div>
    </div>
  );
};

export class RightSidebarWidget extends SidePanel {
  constructor() {
    super({ content: new Panel() });

    this.addClass('jlab-gather-sidebar-widget');
    this.title.icon = arIcon;
    this.title.className;
    this.title.caption = 'Augmented reality';

    const headerNode = document.createElement('h2');
    headerNode.textContent = 'augmented reality';
    this.header.addWidget(new Widget({ node: headerNode }));

    const widget = ReactWidget.create(<RightSidebarComponent />);

    this.content.addWidget(widget);
  }
}
