import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { SliderProps } from '@radix-ui/react-slider';

export interface SliderComponent 
  extends ForwardRefExoticComponent<SliderProps & RefAttributes<HTMLDivElement>> {}

export declare const Slider: SliderComponent; 