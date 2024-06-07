import { IThemeManager } from '@jupyterlab/apputils';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { IStateDB } from '@jupyterlab/statedb';
import { ReactWidget } from '@jupyterlab/ui-components';
import { ISignal } from '@lumino/signaling';
import React, { useEffect, useRef, useState } from 'react';
import { MainDisplay } from '../components/MainDisplay';
import { TypedHMSRoomProvider, hmsActions } from '../hms';
import { IModelRegistry, IModelRegistryData } from '../registry';

interface IRootDisplayProps {
  node: HTMLElement;
  modelRegistryChanged: ISignal<IModelRegistry, IModelRegistryData>;
  state: IStateDB;
  themeChangedSignal: ISignal<
    IThemeManager,
    IChangedArgs<string, string | null>
  >;
}

const RootDisplay = ({
  node,
  modelRegistryChanged,
  state,
  themeChangedSignal
}: IRootDisplayProps) => {
  const childRef = useRef(null);
  const [height, setHeight] = useState(800);

  useEffect(() => {
    hmsActions.setAppData('themeChanged', themeChangedSignal);
  }, []);

  // TODO: There's probably a better way to do this
  // add overflow: auto to parent container
  useEffect(() => {
    if (childRef.current) {
      const parent = (childRef.current as HTMLElement).parentElement;
      parent?.classList.add('jlab-gather-overflow');
    }

    const rootHeight = document.getElementById('jlab-gather-root');

    if (rootHeight) {
      console.log('WOOP');
      setHeight(rootHeight.clientHeight);
    }
  }, [childRef]);

  return (
    <div
      ref={childRef}
      id="jlab-gather-root"
      className="jlab-gather-root"
      style={{ height: height }}
    >
      <MainDisplay state={state} />
    </div>
  );
};

export class RootDisplayWidget extends ReactWidget {
  private _modelRegistryChanged: ISignal<IModelRegistry, IModelRegistryData>;
  private _state: IStateDB;
  private _themeChangedSignal: ISignal<
    IThemeManager,
    IChangedArgs<string, string | null>
  >;

  constructor(
    modelRegistryChanged: ISignal<IModelRegistry, IModelRegistryData>,
    state: IStateDB,
    themeChangedSignal: ISignal<
      IThemeManager,
      IChangedArgs<string, string | null>
    >
  ) {
    super();
    this._modelRegistryChanged = modelRegistryChanged;
    this._state = state;
    this._themeChangedSignal = themeChangedSignal;
  }

  render() {
    return (
      <TypedHMSRoomProvider>
        <RootDisplay
          node={this.node}
          modelRegistryChanged={this._modelRegistryChanged}
          state={this._state}
          themeChangedSignal={this._themeChangedSignal}
        />
      </TypedHMSRoomProvider>
    );
  }
}
