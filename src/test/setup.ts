import { vi } from 'vitest';
import { mockPhaser } from './mocks/phaser.mock';

// Mock Phaser before any tests run
vi.mock('phaser', () => ({
  default: mockPhaser,
  ...mockPhaser
}));

// Set up global Phaser object
(global as any).Phaser = mockPhaser;

// Setup DOM environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key) => {
    if (key === 'stairway-sprint-high-score') return '0';
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
});