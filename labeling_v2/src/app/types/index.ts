export type DataType = 'A' | 'B' | 'C';

export interface Slice {
  id: string;
  start: number; // frame number
  end: number;   // frame number
  level1: string;
  level2: string;
}

export interface FileInfo {
  fileName: string;
  duration: string;
  type: DataType;
  totalFrames: number;
  fps: number;
}

export interface BVHJoint {
  name: string;
  offset: [number, number, number];
  channels: string[];
  children: BVHJoint[];
}

export interface BVHData {
  hierarchy: BVHJoint;
  frames: number;
  frameTime: number;
  motionData: number[][];
}
