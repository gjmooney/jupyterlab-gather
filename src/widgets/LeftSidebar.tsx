import { selectAppData } from '@100mslive/react-sdk';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ReactWidget } from '@jupyterlab/apputils';
import { Button, SidePanel, UseSignal } from '@jupyterlab/ui-components';
import { ISignal } from '@lumino/signaling';
import { Panel, Widget } from '@lumino/widgets';
import React, { useEffect, useState } from 'react';
import ArCube from '../arCube';
import { arIcon } from '../components/Icons';
import ModelListItem from '../components/ModelListItem';
import AddNewFileModal from '../components/modals/AddNewFileModal';
import AddNewUrlModal from '../components/modals/AddNewUrlModal';
import { APP_DATA } from '../constants';
import { hmsStore } from '../hms';
import { IModelRegistry, IModelRegistryData } from '../registry';
import { useCubeStore } from '../store';
// https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/Suzanne/glTF/Suzanne.gltf'
// https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/IridescenceAbalone/glTF/IridescenceAbalone.gltf
// https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/Fox/glTF/Fox.gltf

interface IModelInfoList {
  modelList: IModelRegistryData[];
  modelRegistry: IModelRegistry;
}

const LeftSidebarComponent = ({ modelList, modelRegistry }: IModelInfoList) => {
  const [arCube, setArCube] = useState<ArCube | null>(null);
  // const [selected, setSelected] = useState<IModelRegistryData>();
  const [isAddModelUrlOpen, setAddModelUrlOpen] = useState(false);
  const [isAddModelFileOpen, setAddModelFileOpen] = useState(false);

  const isDisabled = !useCubeStore.use.canLoadModel();
  const isSecondScene = useCubeStore.use.isSecondScene();
  const selected = useCubeStore.use.selected();
  const setSelected = useCubeStore.use.updateSelected();

  useEffect(() => {
    setArCube(hmsStore.getState(selectAppData(APP_DATA.arCube)));
  }, []);

  useEffect(() => {
    console.log('selected', selected);
  }, [selected]);

  const handleModelNameClick = (model: IModelRegistryData) => {
    setSelected(model);
  };

  const handleModelSelectClick = (sceneNumber: number) => {
    console.log('dev - handle set click', sceneNumber);

    if (!arCube) {
      console.log('dev - !arcube');
      setArCube(hmsStore.getState(selectAppData(APP_DATA.arCube)));
    }

    console.log('dev - post !', arCube);

    if (!selected) {
      console.log('Model must be selected');
      return;
    }

    arCube?.changeModelInScene(sceneNumber, selected.name);
  };

  const handleLoadSecondScene = () => {
    if (isSecondScene) {
      arCube?.disableSecondScene();
    } else {
      arCube?.enableSecondScene();
    }
    // setIsSecondScene(!isSecondScene);
  };

  const handleOpenAddUrlModal = () => {
    setAddModelUrlOpen(true);
  };

  const handleOpenAddFileModal = () => {
    setAddModelFileOpen(true);
  };

  const handleCloseAddModelModal = () => {
    setAddModelUrlOpen(false);
    setAddModelFileOpen(false);
  };

  const handleAddModelSubmit = (data: IModelRegistryData): void => {
    modelRegistry.registerModel(data);
    handleCloseAddModelModal();
  };

  return (
    <div className="jlab-gather-sidebar-container">
      <div className="jlab-gather-sidebar-description">
        Select a model from the list below
      </div>
      <div className="jlab-gather-sidebar-list">
        {modelList.map(model => {
          return (
            <ModelListItem
              model={model}
              handleClick={handleModelNameClick}
              className={
                selected?.name === model.name
                  ? 'jlab-gather-model-list-item-selected'
                  : ''
              }
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="jlab-gather-sidebar-buttons">
          <Button
            className="jlab-gather-sidebar-button"
            onClick={() => handleModelSelectClick(0)}
          >
            Set as first model
          </Button>
          <Button
            className="jlab-gather-sidebar-button"
            onClick={() => handleModelSelectClick(1)}
          >
            Set as second model
          </Button>
        </div>
        <Button
          className="jlab-gather-sidebar-load-button"
          onClick={handleOpenAddUrlModal}
          disabled={isDisabled}
        >
          Add New Model (URL)
        </Button>
        <AddNewUrlModal
          isOpen={isAddModelUrlOpen}
          onSubmit={handleAddModelSubmit}
          onClose={handleCloseAddModelModal}
        />
        <Button
          className="jlab-gather-sidebar-load-button"
          onClick={handleOpenAddFileModal}
          disabled={isDisabled}
        >
          Add New Model (File)
        </Button>
        <AddNewFileModal
          isOpen={isAddModelFileOpen}
          onSubmit={handleAddModelSubmit}
          onClose={handleCloseAddModelModal}
        />
        <Button
          className="jlab-gather-sidebar-load-button"
          onClick={handleLoadSecondScene}
          disabled={isDisabled}
        >
          {isDisabled ? (
            <FontAwesomeIcon icon={faSpinner} className="jlab-gather-spinner" />
          ) : isSecondScene ? (
            'Disable Second Model'
          ) : (
            'Load Second Model'
          )}
        </Button>
      </div>
    </div>
  );
};

export class LeftSidebarWidget extends SidePanel {
  private _signal: ISignal<IModelRegistry, IModelRegistryData>;
  private _modelList: IModelRegistryData[];

  constructor(modelRegistry: IModelRegistry) {
    super({ content: new Panel() });
    this._signal = modelRegistry.modelRegistryChanged;

    this.addClass('jlab-gather-sidebar-widget');
    this.title.icon = arIcon;
    this.title.className;
    this.title.caption = 'Augmented reality';

    const headerNode = document.createElement('h2');
    headerNode.textContent = 'augmented reality';
    this.header.addWidget(new Widget({ node: headerNode }));

    const widget = ReactWidget.create(
      <UseSignal signal={this._signal}>
        {() => (
          <LeftSidebarComponent
            modelList={this._modelList}
            modelRegistry={modelRegistry}
          />
        )}
      </UseSignal>
    );

    this.content.addWidget(widget);

    this._signal.connect((sender, model) => {
      this._modelList = this.addModelToRegistryArray(model);
      this.updateModel(model.name);
    });
  }

  addModelToRegistryArray(model: IModelRegistryData) {
    const registryFromStore: IModelRegistryData[] =
      useCubeStore.getState().modelRegistry;

    const existingModels = registryFromStore.map(
      registryModels => registryModels.name
    );

    // Add model if it's new
    if (!existingModels.includes(model.name)) {
      registryFromStore.push(model);
    } else {
      // update model if it already exists
      registryFromStore.forEach((element, index) => {
        if (element.name === model.name) {
          registryFromStore[index] = model;
        }
      });
    }

    useCubeStore.setState({
      modelRegistry: registryFromStore
    });

    return registryFromStore;
  }

  updateModel(modelName: string) {
    const scenesWithModel = useCubeStore.getState().scenesWithModel;
    const arCube: ArCube = hmsStore.getState(selectAppData(APP_DATA.arCube));

    if (!arCube) {
      return;
    }

    if (scenesWithModel[modelName]) {
      scenesWithModel[modelName].forEach((sceneNumber: number) => {
        arCube.changeModelInScene(sceneNumber, modelName);
      });
    }
  }
}
