import { useState } from 'react';
import {Input} from "@nextui-org/input";
import { ScrollShadow } from '@nextui-org/react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Slider,
    Select,
    SelectItem
  } from "@nextui-org/react";


export interface SettingsModalProps {
    isOpen: boolean;
    testSettings: TestSettings;
    onClose: () => void;
    setTestSettings: (settings: TestSettings) => void;
}

export interface TestSettings {
    maskerLevel: number;
    gridSize: number;
    timeStep: number;
    frequencyStep: number;
    sampleRate: number;
    totalDuration: number;
    maskerFrequency: number;
    maskerLocation: number;
    WBNoiseType: string;
    WBNoiseDuration: number;
    noiseBW: number;
    pulseDuration: number;
    toneDuration: number;
    raiseDuration: number;
    raiseType: string;
}

export const defaultTestSettings: TestSettings = {
    maskerLevel: -3,
    gridSize: 10,
    timeStep: 0.02,
    maskerFrequency: 1000,
    frequencyStep: 100,
    sampleRate: 44100,
    totalDuration: 1.0,
    maskerLocation: 0.5,
    WBNoiseType: "white",
    WBNoiseDuration: 0.01,
    noiseBW: 10,
    pulseDuration: 0.005,
    toneDuration: 0.8,
    raiseDuration: 0.01,
    raiseType: "exponential",
};

export const SettingsModal = ({ isOpen,onClose, testSettings, setTestSettings }: SettingsModalProps) => {
    const [currentSettings, setSettings] = useState(testSettings);
    return (
        <Modal 
          isOpen={isOpen} 
          onClose={() => {
            onClose();
            setTestSettings(testSettings);
          }}
        >
        
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Adjust advanced settings</ModalHeader>
              <ModalBody>
                <ScrollShadow
                  className="h-[400px] items-center justify-center"
                  orientation='vertical'
                  >
                <div className="flex flex-col gap-4 max-w-[98%]">
                  <div className="flex flex-row items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Masker Level (dB from max wav value):</p>
                    <div className='flex flex-col gap-1'>
                      <Slider
                          value={currentSettings.maskerLevel}
                          minValue={-80}
                          maxValue={0}
                          showTooltip
                          onChange={(value) => {
                              if (typeof value === 'number') {
                                  setTestSettings({ ...currentSettings, maskerLevel: value });
                              }
                        }}
                      />
                      <p className='text-xs'>Current masker level: {currentSettings.maskerLevel} dB</p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Grid Size:</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      value={testSettings.gridSize>=0? testSettings.gridSize.toString(): ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, gridSize: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, gridSize: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Time Step (s):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      value={testSettings.timeStep>=0? testSettings.timeStep.toString(): ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, timeStep: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, timeStep: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Frequency Step (Hz):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      value={testSettings.frequencyStep>=0? testSettings.frequencyStep.toString(): ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, frequencyStep: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, frequencyStep: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Sample Rate:</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      value={testSettings.sampleRate>=0? testSettings.sampleRate.toString(): ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, sampleRate: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, sampleRate: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Total Duration (s):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      value={testSettings.totalDuration>=0? testSettings.totalDuration.toString(): ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, totalDuration: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, totalDuration: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Masker Center in time (s):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      step={0.1}
                      value={testSettings.maskerLocation>=0? testSettings.maskerLocation.toString(): ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, maskerLocation: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, maskerLocation: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Masker Central Frequency (Hz):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      step={100}
                      value={testSettings.maskerFrequency>=0? testSettings.maskerFrequency.toString(): ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, maskerFrequency: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, maskerFrequency: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Wideband Noise Type:</p>
                    <Select
                      value={testSettings.WBNoiseType}
                      className='max-w-[40%]'
                      defaultSelectedKeys={["white"]}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log(value);
                        setTestSettings({ ...testSettings, WBNoiseType: value });
                      }}
                    >
                      <SelectItem value="white" key={'white'}>White</SelectItem>
                      <SelectItem value="pink" key={'pink'}>Pink</SelectItem>
                      <SelectItem value="brown" key={'brown'}>Brown</SelectItem>
                      <SelectItem value="blue" key={'blue'}>Blue</SelectItem>
                      <SelectItem value="violet" key={'violet'}>Violet</SelectItem>
                    </Select>
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Noise Bandwidth (% Hz, relative to central frequency):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      step={5}
                      value={testSettings.noiseBW>=0? testSettings.noiseBW.toString(): ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, noiseBW: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, noiseBW: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Pulse Duration (s):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      step={0.001}
                      value={testSettings.pulseDuration>=0? testSettings.pulseDuration.toString(): ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, pulseDuration: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, pulseDuration: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Tone Duration (s):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      step={0.1}
                      value={testSettings.toneDuration>=0? testSettings.toneDuration.toString(): ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, toneDuration: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, toneDuration: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Raise Duration (s):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      step={0.005}
                      value={testSettings.raiseDuration>=0? testSettings.raiseDuration.toString(): ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, raiseDuration: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, raiseDuration: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                  <p className='text-sm max-w-[50%]'>Raise Type:</p>
                  <Select
                    value={testSettings.raiseType}
                    className='max-w-[40%]'
                    defaultSelectedKeys={["exponential"]}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log(value);
                      setTestSettings({ ...testSettings, raiseType: value });
                    }}
                  >
                    <SelectItem value="exponential" key={'exponential'}>Exponential</SelectItem>
                    <SelectItem value="linear" key={'linear'}>Linear</SelectItem>
                  </Select>
                  </div>
                  
                  
                </div>
                </ScrollShadow>
                </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    )
}