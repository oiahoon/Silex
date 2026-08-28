/**
 * @jest-environment jsdom
 */

import { describe, expect, it, jest } from '@jest/globals'
import { Editor } from 'grapesjs'
import { keymapsPlugin } from './keymaps'

describe('keymapsPlugin', () => {
  it('deactivates preview mode when Escape is pressed', () => {
    const previewButton = {
      get: jest.fn(() => true),
      set: jest.fn(),
    }
    const editor = {
      Commands: { add: jest.fn() },
      Keymaps: { add: jest.fn() },
      Modal: { close: jest.fn(), isOpen: jest.fn(() => false) },
      Panels: { getButton: jest.fn(() => previewButton) },
      getEditing: jest.fn(() => false),
    } as unknown as Editor

    keymapsPlugin(editor, {} as never)
    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    }))

    expect(previewButton.set).toHaveBeenCalledWith('active', false)
  })
})
