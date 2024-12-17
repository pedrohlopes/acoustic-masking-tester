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
    gridStep: number;
    sampleRate: number;
    totalDuration: number;
    maskerLocation: number;
    maskerDuration: number;
    raiseType: string;
}

export const defaultTestSettings: TestSettings = {
    maskerLevel: -3,
    gridSize: 10,
    gridStep: 0.02,
    sampleRate: 44100,
    totalDuration: 1.0,
    maskerLocation: 0.5,
    maskerDuration: 0.005,
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
                    <p className='text-sm max-w-[50%]'>Grid Step (s):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      value={testSettings.gridStep>=0? testSettings.gridStep.toString(): ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, gridStep: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, gridStep: -1 });
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
                    <p className='text-sm max-w-[50%]'>Masker Location:</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
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
                    <p className='text-sm max-w-[50%]'>Masker Duration (s):</p>
                    <Input
                      type="number"
                      className='max-w-[40%]'
                      value={testSettings.maskerDuration>=0? testSettings.maskerDuration.toString(): ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setTestSettings({ ...testSettings, maskerDuration: value });
                        }
                        else {
                          setTestSettings({ ...testSettings, maskerDuration: -1 });
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-row w-full items-center justify-between">
                    <p className='text-sm max-w-[50%]'>Raise Type:</p>
                    <Input
                      type="text"
                      className='max-w-[40%]'
                      value={testSettings.raiseType}
                      onChange={(e) => {
                        setTestSettings({ ...testSettings, raiseType: e.target.value });
                      }}
                    />
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