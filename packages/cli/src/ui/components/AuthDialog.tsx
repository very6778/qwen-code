/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState } from 'react';
import { AuthType } from '@qwen-code/qwen-code-core';
import { Box, Text } from 'ink';
import { execSync } from 'child_process';
import {
  setOpenAIApiKey,
  setOpenAIBaseUrl,
  setOpenAIModel,
  validateAuthMethod,
} from '../../config/auth.js';
import { type LoadedSettings, SettingScope } from '../../config/settings.js';
import { Colors } from '../colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { OpenAIKeyPrompt } from './OpenAIKeyPrompt.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';

interface AuthDialogProps {
  onSelect: (authMethod: AuthType | undefined, scope: SettingScope) => void;
  settings: LoadedSettings;
  initialErrorMessage?: string | null;
}

function parseDefaultAuthType(
  defaultAuthType: string | undefined,
): AuthType | null {
  if (
    defaultAuthType &&
    Object.values(AuthType).includes(defaultAuthType as AuthType)
  ) {
    return defaultAuthType as AuthType;
  }
  return null;
}

export function AuthDialog({
  onSelect,
  settings,
  initialErrorMessage,
}: AuthDialogProps): React.JSX.Element {
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage || null,
  );
  const [showOpenAIKeyPrompt, setShowOpenAIKeyPrompt] = useState(false);
  const items = [
    { label: 'Qwen OAuth', value: AuthType.QWEN_OAUTH },
    { label: 'OpenAI', value: AuthType.USE_OPENAI },
    { label: 'ZAI OpenRouter (GLM-4.6)', value: AuthType.USE_ZAI_OPENROUTER },
  ];

  const initialAuthIndex = Math.max(
    0,
    items.findIndex((item) => {
      if (settings.merged.security?.auth?.selectedType) {
        return item.value === settings.merged.security?.auth?.selectedType;
      }

      const defaultAuthType = parseDefaultAuthType(
        process.env['QWEN_DEFAULT_AUTH_TYPE'],
      );
      if (defaultAuthType) {
        return item.value === defaultAuthType;
      }

      if (process.env['ZAI_API_KEY']) {
        return item.value === AuthType.USE_ZAI_OPENROUTER;
      }

      if (process.env['GEMINI_API_KEY']) {
        return item.value === AuthType.USE_GEMINI;
      }

      return item.value === AuthType.LOGIN_WITH_GOOGLE;
    }),
  );

  const handleAuthSelect = (authMethod: AuthType) => {
    const error = validateAuthMethod(authMethod);
    if (error) {
      if (
        authMethod === AuthType.USE_OPENAI &&
        !process.env['OPENAI_API_KEY']
      ) {
        setShowOpenAIKeyPrompt(true);
        setErrorMessage(null);
      } else {
        setErrorMessage(error);
      }
    } else {
      setErrorMessage(null);
      onSelect(authMethod, SettingScope.User);
    }
  };

  const handleOpenAIKeySubmit = (
    apiKey: string,
    baseUrl: string,
    model: string,
  ) => {
    setOpenAIApiKey(apiKey);
    setOpenAIBaseUrl(baseUrl);
    setOpenAIModel(model);
    setShowOpenAIKeyPrompt(false);
    onSelect(AuthType.USE_OPENAI, SettingScope.User);
  };

  const handleOpenAIKeyCancel = () => {
    setShowOpenAIKeyPrompt(false);
    setErrorMessage('OpenAI API key is required to use OpenAI authentication.');
  };

  
  const handlePaste = () => {
    try {
      let clipboardText = '';

      // Debug: Try to get clipboard content
      try {
        // Try macOS pbpaste first with timeout
        clipboardText = execSync('pbpaste', {
          encoding: 'utf8',
          timeout: 1000,
          stdio: ['ignore', 'pipe', 'ignore']
        });
        console.log('[DEBUG] pbpaste success:', clipboardText);
      } catch (macError) {
        console.log('[DEBUG] pbpaste failed:', (macError as Error).message);
        // Try Linux xclip
        try {
          clipboardText = execSync('xclip -selection clipboard -o', {
            encoding: 'utf8',
            timeout: 1000
          });
        } catch (linuxError) {
          // Try Windows clip
          try {
            clipboardText = execSync('powershell -command "Get-Clipboard"', {
              encoding: 'utf8',
              timeout: 1000
            });
          } catch (winError) {
            console.log('[DEBUG] All clipboard methods failed');
            throw new Error('Clipboard access not available');
          }
        }
      }

      // Clean up clipboard text
      clipboardText = clipboardText.replace(/\r\n/g, '').replace(/\n/g, '').trim();
    } catch (error) {
      console.log('[DEBUG] Paste error:', error);
    }
  };

  useKeypress(
    (key) => {
      if (showOpenAIKeyPrompt) {
        return;
      }

      if (key.ctrl && key.name === 'v') {
        // Ctrl+V for paste
        handlePaste();
      } else if (key.meta && key.name === 'v') {
        // Cmd+V for macOS
        handlePaste();
      } else if (key.ctrl && key.sequence === 'v') {
        // Alternate Ctrl+V detection
        handlePaste();
      } else if (key.meta && key.sequence === 'v') {
        // Alternate Cmd+V detection
        handlePaste();
      } else if (key.name === 'escape') {
        // Prevent exit if there is an error message.
        // This means they user is not authenticated yet.
        if (errorMessage) {
          return;
        }
        if (settings.merged.security?.auth?.selectedType === undefined) {
          // Prevent exiting if no auth method is set
          setErrorMessage(
            'You must select an auth method to proceed. Press Ctrl+C again to exit.',
          );
          return;
        }
        onSelect(undefined, SettingScope.User);
      }
    },
    { isActive: true },
  );

  if (showOpenAIKeyPrompt) {
    return (
      <OpenAIKeyPrompt
        onSubmit={handleOpenAIKeySubmit}
        onCancel={handleOpenAIKeyCancel}
      />
    );
  }

  
  return (
    <Box
      borderStyle="round"
      borderColor={Colors.Gray}
      flexDirection="column"
      padding={1}
      width="100%"
    >
      <Text bold>Get started</Text>
      <Box marginTop={1}>
        <Text>How would you like to authenticate for this project?</Text>
      </Box>
      <Box marginTop={1}>
        <RadioButtonSelect
          items={items}
          initialIndex={initialAuthIndex}
          onSelect={handleAuthSelect}
        />
      </Box>
      {errorMessage && (
        <Box marginTop={1}>
          <Text color={Colors.AccentRed}>{errorMessage}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color={Colors.AccentPurple}>(Use Enter to Set Auth)</Text>
      </Box>
      <Box marginTop={1}>
        <Text>Terms of Services and Privacy Notice for Qwen Code</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={Colors.AccentBlue}>
          {'https://github.com/QwenLM/Qwen3-Coder/blob/main/README.md'}
        </Text>
      </Box>
    </Box>
  );
}
