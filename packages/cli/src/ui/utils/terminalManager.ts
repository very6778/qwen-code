/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Terminal Manager for Fullscreen Mode
 *
 * Provides professional terminal management capabilities:
 * - Clears terminal on startup for fullscreen experience
 * - Restores original terminal state on exit
 * - Handles errors gracefully
 */

export class TerminalManager {
  private savedTerminalState: {
    cursor?: { x: number; y: number };
    buffer?: string;
  } | null = null;

  /**
   * Save current terminal state before clearing
   */
  private saveTerminalState(): void {
    try {
      // Save cursor position
      process.stdout.write('\x1b[s');
      this.savedTerminalState = { cursor: { x: 0, y: 0 } };
    } catch (error) {
      // Silent fail - terminal state saving is optional
      if (process.env['DEBUG']) {
        console.warn('Failed to save terminal state:', error);
      }
    }
  }

  /**
   * Clear terminal for fullscreen mode
   * Uses ANSI escape sequences for maximum compatibility
   */
  clearFullscreen(): void {
    try {
      // Save current state first
      this.saveTerminalState();

      // Clear screen and move cursor to top-left
      process.stdout.write('\x1b[2J\x1b[H');

      // Optional: Clear scrollback buffer for true fullscreen
      // This provides the "clean slate" experience like Claude Code
      process.stdout.write('\x1b[3J');
    } catch (error) {
      // Fallback to console.clear if ANSI sequences fail
      try {
        console.clear();
      } catch (fallbackError) {
        if (process.env['DEBUG']) {
          console.warn('Failed to clear terminal:', fallbackError);
        }
      }
    }
  }

  /**
   * Restore terminal to original state
   * Called during cleanup/exit
   */
  restoreTerminal(): void {
    try {
      if (this.savedTerminalState) {
        // Restore cursor position
        process.stdout.write('\x1b[u');
      }

      // Clear screen again for clean exit
      process.stdout.write('\x1b[2J\x1b[H');
    } catch (error) {
      // Silent fail - this is cleanup code
      if (process.env['DEBUG']) {
        console.warn('Failed to restore terminal:', error);
      }
    }
  }

  /**
   * Check if running in a TTY environment
   */
  static isTTY(): boolean {
    return !!(process.stdin.isTTY && process.stdout.isTTY);
  }

  /**
   * Check if fullscreen mode is supported
   */
  static isFullscreenSupported(): boolean {
    // Basic TTY check
    if (!this.isTTY()) {
      return false;
    }

    // Check for common terminal environments that support ANSI
    const term = process.env['TERM'] || '';
    const termProgram = process.env['TERM_PROGRAM'] || '';

    // Most modern terminals support ANSI escape sequences
    const supportedTerms = [
      'xterm', 'xterm-256color', 'screen', 'tmux',
      'alacritty', 'kitty', 'wezterm', 'iterm'
    ];

    return supportedTerms.some(supported =>
      term.includes(supported) || termProgram.includes(supported.toLowerCase())
    ) || term.includes('color') || term.includes('256');
  }
}