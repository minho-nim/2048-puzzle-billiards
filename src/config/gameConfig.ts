import { Ball } from '../types/game';

export const GAME_CONFIG = {
  // Logical dimensions of the board (square)
  BOARD_WIDTH: 560,
  BOARD_HEIGHT: 560,
  BOARD_BORDER_THICKNESS: 24,

  // Ball dimensions: larger values grow while lower values shrink as the board advances.
  BASE_BALL_RADIUS: 35,
  MIN_BALL_RADIUS: 23,
  MAX_BALL_RADIUS: 47,
  BALL_MASS: 1.0,

  // Physics constants
  PHYSICS_HZ: 120,
  FIXED_DT: 1 / 120,
  MAX_SUBSTEPS_PER_FRAME: 8,
  RESTITUTION: 0.94,
  WALL_RESTITUTION: 0.88,
  FRICTION: 0.985,
  VELOCITY_STOP_THRESHOLD: 0.08,

  // Launch and aim controls
  MAX_DRAG_DISTANCE: 180,
  MIN_DRAG_DISTANCE: 6,
  MAX_LAUNCH_SPEED: 26,
  DRAG_SENSITIVITY: 0.16,
  CONTROL_MODE: 'slingshot' as 'slingshot' | 'direct',

  // Rules: Starts with 1 blue ball. If it turns gray, 1 last chance remains!
  INITIAL_LIFE: 1,
  INITIAL_MAX_LIFE: 1,
  MAX_LIFE_CAP: 14,
  MIN_BALLS_ON_BOARD: 2,
  MAX_BALLS_ON_BOARD: 14,
};

// Initial layout: Exactly two '2' balls.
// Only ONE is the black number ball (cue ball). The other is a white number ball.
export const INITIAL_BALLS: Omit<Ball, 'id'>[] = [
  {
    value: 2,
    x: 230,
    y: 280,
    vx: 0,
    vy: 0,
    radius: 29,
    mass: 1,
    isMoving: false,
    isMerging: false,
    mergeCooldown: 0,
    isBlackNumber: true, // Unique player-controlled black number ball
  },
  {
    value: 2,
    x: 330,
    y: 280,
    vx: 0,
    vy: 0,
    radius: 29,
    mass: 1,
    isMoving: false,
    isMerging: false,
    mergeCooldown: 0,
    isBlackNumber: false, // Normal white number ball
  },
];
